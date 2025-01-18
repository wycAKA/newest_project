"use client";
import axios from "axios";
import React, { useState, useCallback} from "react";
import { useDropzone } from "react-dropzone";

const Chat = () => {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false); // 画像が登録されたか
  const [isFirstQuestion, setIsFirstQuestion] = useState(true); // 初回かどうか
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [activeChat, setActiveChat] = useState("");
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]); // サジェスト用
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 音声URLの状態

  // 画像を削除する関数
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    if (updatedImages.length === 0) {
      setIsImageUploaded(false); // 再度アップロード可能に
    }
  };


  //新しいチャット作成
  const createNewChat = () => {
    setPrompt("");
    setAnswer("");
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true); // 初回に戻す
    setActiveChat("");
    setChoices([]);
  };

  
  //回答生成
  const generateAnswer = async () => {
    setIsLoading(true);
    setError("");
    setSuggestions([]);//サジェストを初期化


    try {
      // 初回かどうかでAPIキーを切り替え
      const apiKey = isFirstQuestion
        ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_IMAGE
        : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_TEXT;
  
      if (!apiKey) {
        throw new Error("APIキーが設定されていません");
      }



      const res = await axios.post(
        "/api/claude", 
        { prompt, isFirstQuestion}, // isFirstQuestionをAPIに送信
        {
          headers: {
            "X-API-Key": apiKey, // 適切なAPIキーを設定
          },
          timeout: 15000,
        }
      );

      // Claudeのレスポンスをパース
      const parsedContent = JSON.parse(res.data.content[0].text);
      const response = parsedContent.response;
      const suggestions = parsedContent.suggestion_list;


      setAnswer(response.text);
      setChoices([
        suggestions.suggestion1,
        suggestions.suggestion2,
        suggestions.suggestion3,
      ]);

      if (isFirstQuestion) {
        setFirstAnswer(res.data.text); // 最初の回答を保存
        setFirstUploadedImages(uploadedImages); // 最初の画像を保存
      }


      //追加
      const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
      setHistory((prevHistory) => {
        const updatedMonthHistory = prevHistory[currentMonth] || [];
        return {
          ...prevHistory,
          [currentMonth]: [...updatedMonthHistory, res.data.text],
        };
      });

      setActiveChat(res.data.text);
      setIsFirstQuestion(false); // 初回終了
    } catch (e: unknown) { // unknown型を使用
      if (axios.isAxiosError(e)) { // axiosエラーを型安全にチェック
        if (e.code === "ECONNABORTED") {
          setError("タイムアウト: 15秒以内に回答が返ってきませんでした。");
        } else {
          setError("エラーが発生しました。");
        }
      } else {
        setError("予期しないエラーが発生しました。");
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

        if (newImages.length >= 1) {
          setIsImageUploaded(true); // 画像が3枚登録された
        }
      }
    },
    [uploadedImages]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [], // 画像ファイルのみを許可
    },
    maxFiles: 1,
    disabled: isImageUploaded, // 画像がアップロード済みなら無効化
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-white">
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

      <div className="flex flex-1">
        {isHistoryVisible && (
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
        )}

        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
            {/* スクロール可能な会話エリア */}
            <div className = "flex-1 overflow-y-auto p-4">
              {/* 最初のチャットを固定表示 */}
              {firstAnswer && (
                <div className="mb-4">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-start">
                    {firstAnswer}
                  </div>
                  {firstUploadedImages.length > 0 && (
                    <div className="py-4 flex flex-wrap gap-4">
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
              )}
              {/* 説明文を追加 */}
              {isFirstQuestion && (
                <>
                  <p className="text-left text-ms font-bold">
                    調べたい作品の画像を入力してください。
                  </p>
                  <p className="text-left text-xs font-bold mb-2">
                    ※正面・左右など様々な角度から入力すると精度が上がる可能性があります。
                  </p>
                </>
              )}
              {/* アップロードされた画像のプレビュー */}
              {uploadedImages.length > 0 && (
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
              {/* 現在の質問・回答 */}
              {prompt && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-end mb-2">
                  {prompt}
                </div>
              )}
              {answer && (
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-start mb-2">
                  {answer}
                  {audioUrl && (
                    <button
                      onClick={() => new Audio(audioUrl).play()}
                      className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      再生
                    </button>
                  )}
                </div>
              )}

              {/* 後続質問候補 */}
              {choices.length > 0 && (
                <div className="mt-4 space-y-2">
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(choice)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md w-full text-left shadow-md"
                    >e
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
                    disabled={uploadedImages.length === 0} // 初回は画像必須
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
                    disabled={!prompt} // テキスト入力が必要
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
