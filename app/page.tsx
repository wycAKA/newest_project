"use client";
import axios from "axios";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const Chat = () => {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false); // 画像が登録されたか
  const [isFirstQuestion, setIsFirstQuestion] = useState(true); // 初回かどうか
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [activeChat, setActiveChat] = useState("");
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // API　GatewayのエンドポイントURL
  const API_ENDPOINT = "https://201wbd5ky7.execute-api.ap-northeast-1.amazonaws.com/picture/upload";


  // 画像を削除する関数
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    if (updatedImages.length === 0) {
      setIsImageUploaded(false); // 再度アップロード可能に
    }
  };

  //画像をAPI　Gateway経由でS3にアップロードする関数
  const uploadImageToS3 = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {

      const response = await axios.post(API_ENDPOINT, formData, {

        headers : {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }

  //新しいチャット作成
  const createNewChat = () => {
    setPrompt("");
    setAnswer("");
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true); // 初回に戻す
    setActiveChat("");
  };

  
  //回答生成
  const generateAnswer = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/chatgpt", { prompt }, { timeout: 15000 });
      setAnswer(res.data.text);
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
      'image/*': [], // 画像ファイルのみを許可
    },
    maxFiles: 3,
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
          <div className="p-4">
            {/* ドラッグアンドドロップエリア */}
            <div
              {...getRootProps()}
              className={`p-4 border-dashed border-2 rounded-md text-center mb-4 ${
                isImageUploaded ? "bg-gray-200 text-gray-400 cursor-not-allowed" : ""
              }`}
            >
              <input {...getInputProps()} />
              {isImageUploaded ? (
                <p className="text-ms">画像は最大3枚までアップロードされています</p>
              ) : (
                <p className="text-ms">画像をドラッグ＆ドロップするか<br />クリックして選択してください<br />（最大3枚まで）</p>
              )}
            </div>

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

            {/* チャット入力と回答 */}
            <div className="flex flex-col">
              <textarea
                className="w-full border rounded p-2 mb-4"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="質問を入力してください"
                disabled={isFirstQuestion} // 初回は入力不可
              />
              <div className="flex justify-end">
                <button
                  onClick={generateAnswer}
                  disabled={isFirstQuestion ? uploadedImages.length === 0 : !prompt} // 初回は画像のみでOK、以降はテキスト必須
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  質問する
                </button>
              </div>
            </div>
            {isLoading && <p>読み込み中...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {answer && <p className="mt-4">{answer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

