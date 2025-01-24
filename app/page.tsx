"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

// interface ApiResponse {
//   text: string;
//   choices?: string[];
// }

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
  

  //固定値
  const dynamoDBTableName = "log-prod";
  const s3BucketName = "picture-storage-prod";
  const s3SystemPromptFile = "system_prompt/system_prompt_20250118.txt";
  const s3UserPromptFile = "user_prompt/user_message.json";
  const modelName = "anthropic.claude-3-5-sonnet-20240620-v1:0";
  const imageType = "image/jpg";


  //可変値
  const sessionId = useRef<string>(`session_${Date.now()}`);
  const timeStamp = useRef<string>(new Date().toISOString());
  const [userId, setUserId] = useState<string>("user123"); // ユーザーID（サンプル値）
  const [logType, setLogType] = useState<string>("Message");
  const [id, setId] = useState<string>("id_12345");


  // スクロール動作の設定
  // React.useEffect(() => {
  //   if (scrollContainerRef.current) {
  //     setTimeout(() => {
  //       scrollContainerRef.current!.scrollTop = scrollContainerRef.current!.scrollHeight;
  //     }, 0);
  //   }
  // }, [history]);

  

  // スクロール処理
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // React.useEffect(() => {
  //   if (scrollContainerRef.current) {
  //     scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  //   }
  // }, [history, choices]);

  // 履歴または選択肢が更新されたときにスクロール
  useEffect(() => {
    scrollToBottom();
  }, [history, choices]); // ここで"history"と"choices" を監視

  //画像をBase64エンコード
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

  // // AWS Pollyクライアントの作成
  // const pollyClient = new PollyClient({
  //   region: process.env.NEXT_PUBLIC_AWS_REGION,
  //   credentials: {
  //     accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
  //     secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  //   },
  // });

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
      const apiGateway1 = "https://c4kw81t56e.execute-api.ap-northeast-1.amazonaws.com/dev/invoke";
      const apiGateway2 = "https://n7gvvahv4a.execute-api.ap-northeast-1.amazonaws.com/dev/invoke";
      const apiEndpoint = isFirstQuestion ? apiGateway1 : apiGateway2;
  
      const base64Images = await Promise.all(uploadedImages.map((file) => encodeImageToBase64(file)));
      const s3Paths = base64Images.map((_, index) => `${sessionId.current}/image_${index + 1}.jpg`);
  
      const payload = {
        prompt,
        dynamoDBTableName,
        s3BucketName,
        s3SystemPromptFile,
        s3UserPromptFile,
        modelName,
        sessionId: sessionId.current,
        timeStamp: timeStamp.current,
        userId,
        logType,
        id,
        images: base64Images.map((data, index) => ({
          data,
          path: s3Paths[index],
          type: imageType,
          contentType: "image/jpeg" // contentType を追加
        })),
        history,
      };
  
      const res = await axios.post(
        apiEndpoint,
        { payload, isFirstQuestion }, // isFirstQuestionをAPIに送信
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      // レスポンスの全体をログに出力
      console.log("APIレスポンス:", res);
  
      // レスポンスデータの解析
      if (res.status === 200 && res.data.content) {
        const parsedContent = JSON.parse(res.data.content[0].text);
        const response = parsedContent.response;
        const suggestions = parsedContent.suggestion_list;
  
        setAnswer(response.answer);
  
        if (isFirstQuestion) {
          setFirstAnswer(response.name); // 最初の回答を保存
          setFirstUploadedImages(uploadedImages); // 最初の画像を保存
        }
  
        // 質問と回答を履歴に追加
        setHistory((prev) => [...prev, { type: "question", text: prompt }]);
        setHistory((prev) => [...prev, { type: "answer", text: response.answer }]);
  
        setChoices([
          suggestions.suggestion1,
          suggestions.suggestion2,
          suggestions.suggestion3,
        ]);
        setPrompt(""); // 質問欄をリセット
        setIsFirstQuestion(false);
      } else {
        // ステータスコードやデータが期待通りでない場合のエラーハンドリング
        throw new Error("APIレスポンスが不正です。再度お試しください。");
      }
    } catch (error: any) {
      // エラー詳細をコンソールに記録
      console.error("エラー発生:", error);
  
      // ユーザー向けエラーメッセージを設定
      if (error.response) {
        // サーバーからのレスポンスがある場合
        setError(`エラーが発生しました (HTTP ${error.response.status}): ${error.response.data.message || "詳細不明"}`);
      } else if (error.request) {
        // リクエストが送信されたがレスポンスがない場合
        setError("サーバーからの応答がありません。ネットワーク接続を確認してください。");
      } else {
        // その他のエラー
        setError(error.message || "予期しないエラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  
  // // テキストをAmazon Pollyで音声合成
  // const synthesizeSpeech = async (text: string) => {
  //   try {
  //     const command = new SynthesizeSpeechCommand({
  //       Text: text,
  //       OutputFormat: "mp3",
  //       VoiceId: "Joanna", // 任意の声を選択
  //     });
  //     const response = await pollyClient.send(command);
  //     if (response.AudioStream) {
  //       const audioBlob = new Blob([response.AudioStream], { type: "audio/mpeg" });
  //       const audioUrl = URL.createObjectURL(audioBlob);
  //       setAudioUrl(audioUrl); // 再生用URLを設定
  //     }
  //   } catch (err) {
  //     console.error("Amazon Pollyエラー:", err);
  //   }
  // };

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

      <div className="flex flex-1 mt-[50px]">
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

        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
            {/* スクロール可能な会話エリア */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
              {/* 最初のチャットを固定表示 */}
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
                      ? "flex-end bg-green-100 text-green-800 self-end w-[300px] sm:w-[800px]" // smがパソコンの設定
                      : "flex-start bg-gray-200 text-gray-800 self-start w-[300px] sm:w-[800px]"
                  }`}
                >
                  {entry.text}
                </div>
              ))}
              
              {/* 後続質問候補 */}
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
