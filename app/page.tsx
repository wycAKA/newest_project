"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // UUIDライブラリをインポート
 
const Chat = () => {
  const initialQuestion = "この作品について教えてください。"; // 初回の質問を指定（API作成後削除）
  const [prompt, setPrompt] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false); // 画像が登録されたか
  const [isFirstQuestion, setIsFirstQuestion] = useState(true); // 初回かどうか
  const [firstAnswer, setFirstAnswer] = useState(""); // 最初の回答を保存
  const [firstUploadedImages, setFirstUploadedImages] = useState<File[]>([]); // 最初の画像を保存
  const [history, setHistory] = useState<{ type: "question" | "answer"; text: string }[]>([]); // 質問と回答を交互に保存
  const [activeChat, setActiveChat] = useState("");
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 音声URLの状態
  const scrollContainerRef = useRef<HTMLDivElement>(null); // スクロールコンテナの参照
 
  // スクロール処理
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };
 
  // 履歴または選択肢が更新されたときにスクロール
  useEffect(() => {
    scrollToBottom();
  }, [history, choices]); // ここで"history"と"choices" を監視
 
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
    setPrompt(initialQuestion); // 初回の質問に戻す
    setAnswer(""); // 現在の回答をリセット
    setChoices([]); // 現在の選択肢をリセット
    setError(""); // エラーをリセット
    setUploadedImages([]); // アップロード画像をリセット
    setIsImageUploaded(false); // 画像アップロードの状態をリセット
    setIsFirstQuestion(true); // 初回状態に戻す
    setHistory([]); // 会話履歴をリセット
    setActiveChat(""); // アクティブなチャットをリセット
    setFirstAnswer(""); // 最初の回答をリセット
    setFirstUploadedImages([]); // 最初の画像をリセット
  };
 
  // 回答生成
  const generateAnswer = async () => {
    if (!prompt.trim()) return; // 空の質問を送らない
    setIsLoading(true);
    setError("");
 
    try {
     
      // 初回かどうかでAPIキーを切り替え
      const apiEndpoint = isFirstQuestion
        ? "https://c4kw81t56e.execute-api.ap-northeast-1.amazonaws.com/dev/invoke"
        : "https://n7gvvahv4a.execute-api.ap-northeast-1.amazonaws.com/dev/invoke";

      // sessionIdを動的に生成
      const sessionId = uuidv4(); 
 
      // FormDataを作成
      const formData = new FormData();
      formData.append("prompt", prompt); // 質問内容を追加
      formData.append("isFirstQuestion", JSON.stringify(isFirstQuestion)); // 初回フラグを追加
 
      // アップロードされた画像をFormDataに追加
      uploadedImages.forEach((file, index) => {
        formData.append(`image${index + 1}`, file); // `image1`, `image2` のように追加
      });
 
      if (!apiEndpoint) {
        // throw new Error("APIキーが設定されていません");
        console.warn("APIキーが設定されていないため、モックデータを使用します");
        // モックデータを使用
        const mockResponse = {
          content: [
            {
              type: "text",
              text: "{\n  \"response\": {\n    \"name\": \"レースを編む女\",\n    \"answer\": \"フェルメールは「牛乳を注ぐ女」や「真珠の耳飾りの少女」など、他の女性労働も描いています。\",\n    \"explain\": \"ヨハネス・フェルメールは、日常生活の一場面を描くことで知られています。「レースを編む女」以外にも、「牛乳を注ぐ女」（1658-1660年頃）では台所で働く女性を、「真珠の耳飾りの少女」（1665年頃）では真珠の耳飾りをつける女性を描いています。これらの作品は、オランダ絵画の黄金時代における市民生活の一端を示しています。\"\n  },\n  \"suggestion_list\": {\n    \"suggestion1\": \"「牛乳を注ぐ女」の特徴は？\",\n    \"suggestion2\": \"フェルメールの作品における光の表現とは？\",\n    \"suggestion3\": \"17世紀オランダの市民生活とは？\"\n  }\n}"
            }
          ]
        };
 
        // モックデータを解析
        const parsedContent = JSON.parse(mockResponse.content[0].text);
        const response = parsedContent.response;
        const suggestions = parsedContent.suggestion_list;
 
        setAnswer(response.answer);
        setChoices([
          suggestions.suggestion1,
          suggestions.suggestion2,
          suggestions.suggestion3,
        ]);
 
        if (isFirstQuestion) {
          setFirstAnswer(response.name); // モックデータから回答を保存
          setFirstUploadedImages(uploadedImages); // アップロードされた画像を保存
        }
        // 質問を履歴に追加
        setHistory((prev) => [...prev, { type: "question", text: prompt }]);
        // 回答を履歴に追加
        setHistory((prev) => [...prev, { type: "answer", text: response.answer }]);
 
        setChoices([
          suggestions.suggestion1,
          suggestions.suggestion2,
          suggestions.suggestion3,
        ]);
        setPrompt(""); // 質問欄をリセット
        setIsFirstQuestion(false);
        setIsLoading(false);
        return;
      }
 
        // Base64エンコードされた画像データを作成
      const encodedImages = await Promise.all(
        uploadedImages.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result?.toString().split(",")[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          })
        )
      );
      

      // 現在のタイムスタンプ
      const timeStamp = new Date().toISOString();

      // バックエンドに送信するデータを構築
      const payload = {
        document: {
          tableName: "log-test",
          bucketName: "picture-art-storage",
          folderName: "user-uploads/user-test",
          //folderName: sessionId,
          imageFile: encodedImages[0] || "", // 最初の画像を送信（複数の場合は拡張が必要）
          contentType: uploadedImages[0]?.type || "image/jpg",
          item: {
            sessionId: sessionId,
            id: "12345678-90ab-cdef-1234-567890abcdef",
            type: "Message",
            userId: "yourUserId",
            tokens: 123, // 必要なら適切なトークン数に置き換え
            timeStamp,
            sender: "User",
            text: prompt,
            img: {
              bucket: "cc2024-prompt-test",
              key: "images/" + encodeURIComponent(uploadedImages[0]?.name || "image.jpg"),
              url: `https://cc2024-prompt-test.s3.ap-northeast-1.amazonaws.com/images/${encodeURIComponent(
                uploadedImages[0]?.name || "image.jpg"
              )}`,
            },
          },
          model_id: "anthropic.claude-3-5-sonnet-20240620-v1:0",
          bucket_name: "cc2024-prompt-test",
          system_key: "system_prompt/system_prompt_20250118.txt",
          message_key: "user_prompt/user_message.json",
        },
      };

      // 送信するデータをコンソールで確認
      console.log("Payload to send:", payload);

 
      // APIリクエストの送信
      const res = await axios.post(apiEndpoint, payload, {
        headers: {
          "Content-Type": "application/json", // 必要に応じて適切なContent-Typeを指定
        },
        timeout: 30000, // タイムアウトを設定
      });

      // レスポンスを出力して確認
      console.log("API Response:", res);
 
      // APIがきちんと設定されている場合
      // Claudeのレスポンスをパース
      const parsedContent = JSON.parse(res.data.content[0].text);
      const response = parsedContent.response;
      const suggestions = parsedContent.suggestion_list;
 
      setAnswer(response.answer);
      setChoices([
        suggestions.suggestion1,
        suggestions.suggestion2,
        suggestions.suggestion3,
      ]);
 
      if (isFirstQuestion) {
        setFirstAnswer(res.data.text); // 最初の回答を保存
        setFirstUploadedImages(uploadedImages); // 最初の画像を保存
      }
 
      // 質問を履歴に追加
      setHistory((prev) => [...prev, { type: "question", text: prompt }]);
      setHistory((prev) => [...prev, { type: "answer", text: response }]);
 
      setChoices([
        suggestions.suggestion1,
        suggestions.suggestion2,
        suggestions.suggestion3,
      ]);
      setPrompt(""); // 質問欄をリセット
      setActiveChat(res.data.text);
      setIsFirstQuestion(false);
    } catch (e: any) {
      setError(e.message || "エラーが発生しました。");
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
          setIsImageUploaded(true); // 画像が3枚登録された
        }
      }
    },
    [uploadedImages]
  );
 
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [] // 画像ファイルを許可
    },
    maxFiles: 3,
    disabled: isImageUploaded, // 画像がアップロード済みなら無効化
  });
 
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <div
       className="fixed top-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-gray-800 text-white z-10"
       style={{ height: "50px" }} // ヘッダーの高さを指定
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
 
      <div className="flex flex-col flex-1 mt-[50px]">
        {/* {isHistoryVisible && (
          <div className="w-1/2 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-ms font-bold">会話履歴</h2>
            {Object.keys(history).map((month) => (
              <div key={month} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600">{month}</h3>
                <ul>
                  {history[month].map((title, index) => (
                    <li
                      key={index}
                      onClick={() => setActiveChat(title)}
                      className={`cursor-pointer py-1 px-2 ${
                        activeChat === title ? "bg-indigo-100" : ""
                      } hover:bg-indigo-50`}
                    >
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )} */}
 
        <div className={isHistoryVisible ? "w-3/4 flex flex-col" : "w-full flex flex-col"}>
          <div className="flex flex-col h-full">
            {/* スクロール可能な会話エリア */}
            <div ref={scrollContainerRef} className="flex flex-col flex-1 overflow-y-auto p-4">
              {/* 最初のチャットを固定表示 */}
              {firstAnswer && (
                <div className="mb-4 self-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs">
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
              {/* 説明文を追加 */}
              {isFirstQuestion && (
                <>
                  <p className="text-left text-ms font-bold">
                    調べたい作品の画像を入力してください。
                  </p>
                </>
              )}
              {/* アップロードされた画像のプレビュー */}
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
 
              {/* 履歴を表示 */}
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-lg ${
                    entry.type === "question"
                      ? "self-end bg-green-100 text-green-800 w-[300px] sm:w-[800px]" // smがパソコンの設定
                      : "self-start bg-gray-200 text-gray-800 w-[300px] sm:w-[800px]"
                  }`}
                  style={{
                    // maxWidth: "70%", // メッセージの最大幅を調整
                  }}
                >
                  {entry.text}
 
                  {/* 回答の注意書き */}
                  {entry.type === "answer" && (
                    <p className="mt-2 text-xs text-gray-500">
                      AIによって生成された回答は誤っている可能性があります。
                    </p>
                  )}
                </div>
              ))}
             
              {/* 後続質問候補 */}
              {choices.length > 0 && (
                <div className="flex flex-col justify-center items-center space-y-2">
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(choice)}
                      className="border border-gray-400 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition w-[300px] sm:w-[800px]"
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
                  // 初回の送信ボタン
                  <button
                    onClick={generateAnswer}
                    disabled={
                      isFirstQuestion && uploadedImages.length === 0 // 初回は画像が必須
                        ? true
                        : isLoading || !prompt.trim() // 入力が空または読み込み中の場合も無効化
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
                  // 2回目以降の送信ボタン
                  <button
                    onClick={generateAnswer}
                    disabled={isLoading || !prompt.trim()} // 入力が空か読み込み中は無効化
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