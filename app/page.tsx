"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const Chat = () => {
  // 初回の質問を指定
  const initialQuestion = "この作品について教えてください。";

  // 各種状態管理
  const [prompt, setPrompt] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);
  const [firstAnswer, setFirstAnswer] = useState("");
  const [firstUploadedImages, setFirstUploadedImages] = useState<File[]>([]);
  const [history, setHistory] = useState<{ type: "question" | "answer"; text: string }[]>([]);
  const [activeChat, setActiveChat] = useState("");
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 固定値（バックエンドで使用する値）
  const dynamoDBTableName = "log-prod";
  const bucketName = "cc2024-prompt-test";
  const s3SystemPromptFile = "system_prompt/system_prompt_20250118.txt";
  const s3UserPromptFile = "user_prompt/user_message.json";
  const modelName = "anthropic.claude-3-5-sonnet-20240620-v1:0";
  const imageType = "image/jpg";

  // 可変値（バックエンドで使用する値）
  const folderName = useRef<string>(`session_${Date.now()}`);
  const timeStamp = useRef<string>(new Date().toISOString());
  const [userId, setUserId] = useState<string>("user123");
  const [logType, setLogType] = useState<string>("Message");
  const [id, setId] = useState<string>("id_12345");

  // スクロール処理
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, choices]); // 履歴や選択肢が更新されたらスクロール

  // 画像をBase64エンコード
  const encodeImageToBase64 = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // 画像を削除する関数
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    if (updatedImages.length === 0) {
      setIsImageUploaded(false); // 再度アップロード可能に
    }
  };

  // 新しいチャット作成
  const createNewChat = () => {
    setPrompt(initialQuestion);
    setAnswer("");
    setChoices([]);
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true);
    setHistory([]);
    setActiveChat("");
    setFirstAnswer("");
    setFirstUploadedImages([]);
  };

  // 回答生成
  const generateAnswer = async () => {
    if (!prompt.trim()) return; // 空の質問は送信しない
    setIsLoading(true);
    setError("");

    try {
      // APIエンドポイントの選択
      const apiGateway1 = "https://c4kw81t56e.execute-api.ap-northeast-1.amazonaws.com/dev/invoke";
      const apiGateway2 = "https://n7gvvahv4a.execute-api.ap-northeast-1.amazonaws.com/dev/invoke";
      const apiEndpoint = isFirstQuestion ? apiGateway1 : apiGateway2;

      // アップロードされた画像をBase64エンコード
      const imageFile = await Promise.all(uploadedImages.map((file) => encodeImageToBase64(file)));

      console.log("Base64 encoded image:", imageFile);
      
      console.log("Uploaded images:", uploadedImages);

      // ペイロードの作成
      const payload = {
        node: {
          name: "saveImgToS3",
          inputs: [
            {
              name: "Input",
              type: "OBJECT",
              value: {
                bucketName,
                item: {
                  timeStamp: timeStamp.current,
                  img: {
                    bucket: bucketName,
                    key: "images/your-image-name.jpg",
                    url: `https://${bucketName}.s3.ap-northeast-1.amazonaws.com/images/your-image-name.jpg`,
                  },
                  sender: "User",
                  tokens: 123,
                  sessionId: "abcdef78-90ab-cdef-1234-567890abcdef",
                  id,
                  text: prompt,
                  type: logType,
                  userId,
                },
                imageFile, // Base64エンコードされた画像
                bucket_name: bucketName,
                system_key: s3SystemPromptFile,
                folderName: folderName.current,
                model_id: modelName,
                contentType: imageType,
                message_key: s3UserPromptFile,
                tableName: dynamoDBTableName,
              },
            },
          ],
        },
      };

      console.log("Payload being sent to API:", payload);

      // APIリクエストの送信
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const resData = await response.json();

        // 受け取ったレスポンスデータをログに出力
        console.log("レスポンスデータ:", resData);

        if (resData.content) {
          const parsedContent = JSON.parse(resData.content[0].text);
          const responseContent = parsedContent.response;
          const suggestions = parsedContent.suggestion_list;

          console.log("解析されたレスポンス:", parsedContent);
          setAnswer(responseContent.answer);

          if (isFirstQuestion) {
            setFirstAnswer(responseContent.name);
            setFirstUploadedImages(uploadedImages);
          }

          setHistory((prev) => [...prev, { type: "question", text: prompt }]);
          setHistory((prev) => [...prev, { type: "answer", text: responseContent.answer }]);

          setChoices([
            suggestions.suggestion1,
            suggestions.suggestion2,
            suggestions.suggestion3,
          ]);
          setPrompt("");
          setIsFirstQuestion(false);
        } else {
          throw new Error("APIレスポンスが不正です。再度お試しください。");
        }
      } else {
        throw new Error(`APIエラー: HTTPステータス ${response.status}`);
      }
    } catch (error) {
      console.error("エラー発生:", error);

      const typedError = error as Error;
      if (typedError.name === "AbortError") {
        setError("リクエストがタイムアウトしました。再度お試しください。");
      } else {
        setError(typedError.message || "予期しないエラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ドロップゾーンの設定
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const newImages = [...uploadedImages, ...acceptedFiles];
        setUploadedImages(newImages);

        if (newImages.length >= 3) {
          setIsImageUploaded(true);
        }
      }
    },
    [uploadedImages]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    maxFiles: 3,
    disabled: isImageUploaded,
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-gray-800 text-white z-10"
        style={{ height: "50px" }}
      >
        <button
          onClick={() => setIsHistoryVisible(!isHistoryVisible)}
          className="text-xl font-bold"
        >
          <img
            src="/menuicon.png"
            alt="menu"
            className="h-6 w-6 max-h-6 max-w-6"
          />
        </button>
        <h1 className="text-lg font-semibold">Art Info</h1>
        <button onClick={createNewChat}>
          <img
            src="/chaticon.png"
            alt="new chat"
            className="h-8 w-8 object-contain"
          />
        </button>
      </div>

      <div className="flex flex-1 mt-[50px]">
        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
            {/* スクロール可能な会話エリア */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
              {firstAnswer && (
                <div className="mb-4">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-start">
                    {firstAnswer}
                    {firstUploadedImages.length > 0 && (
                      <div className="pt-4 flex flex-wrap gap-4">
                        {firstUploadedImages.map((file, index) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(file)}
                            alt={`Uploaded ${index}`}
                            className="h-20 w-20 object-cover rounded-md shadow"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isFirstQuestion && (
                <p className="text-left text-ms font-bold">
                  調べたい作品の画像を入力してください。
                </p>
              )}

              {isFirstQuestion && uploadedImages.length > 0 && (
                <div className="py-4 flex flex-wrap gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="p-1 relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Uploaded ${index}`}
                        className="h-20 w-20 object-cover rounded-md shadow"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 text-black bg-gray-500/20 rounded-full h-6 w-6 flex items-center justify-center shadow"
                        style={{ transform: "translate(50%, -50%)" }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {history.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-lg ${
                    entry.type === "question"
                      ? "flex-end bg-green-100 text-green-800 self-end w-[300px] sm:w-[800px]"
                      : "flex-start bg-gray-200 text-gray-800 self-start w-[300px] sm:w-[800px]"
                  }`}
                >
                  {entry.text}
                </div>
              ))}

              {choices.length > 0 && (
                <div className="mt-4 space-y-2">
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(choice)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md w-full text-left shadow-md w-[300px] sm:w-[800px]"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && <p>読み込み中...</p>}
              {error && <p className="text-red-500">{error}</p>}
            </div>

            {/* 下部固定エリア */}
            <div className="sticky bottom-0 bg-white border-t p-4">
              {isFirstQuestion && (
                <div
                  {...getRootProps()}
                  className={`p-4 border-dashed border-2 rounded-md text-center mb-4 ${
                    isImageUploaded ? "bg-gray-200 text-gray-400 cursor-not-allowed" : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {isImageUploaded ? (
                    <p className="text-ms font-bold">画像は最大3枚までアップロードされています</p>
                  ) : (
                    <p className="text-ms font-bold">
                      画像をドラッグ＆ドロップするか
                      <br />
                      クリックして選択してください
                      <br />
                      （最大3枚まで）
                    </p>
                  )}
                </div>
              )}
              {!isFirstQuestion && (
                <textarea
                  className="w-full border rounded p-2 mb-4"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder="質問を入力してください"
                />
              )}
              <div className="flex justify-end">
                {isFirstQuestion ? (
                  <button
                    onClick={generateAnswer}
                    disabled={
                      isFirstQuestion && uploadedImages.length === 0
                        ? true
                        : isLoading || !prompt.trim()
                    }
                    className={`px-4 py-2 rounded ${
                      uploadedImages.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {uploadedImages.length === 0 ? "画像をアップロードしてください" : "送信"}
                  </button>
                ) : (
                  <button
                    onClick={generateAnswer}
                    disabled={isLoading || !prompt.trim()}
                    className={`px-4 py-2 rounded ${
                      !prompt
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {prompt ? "送信" : "質問を入力してください"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
