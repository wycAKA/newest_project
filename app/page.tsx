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

  // 画像を削除する関数
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
  };

  const generateAnswer = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/chatgpt", { prompt }, { timeout: 15000 });
      setAnswer(res.data.text);
    } catch (e: any) {
      if (e.code === "ECONNABORTED") {
        setError("タイムアウト: 15秒以内に回答が返ってきませんでした。");
      } else {
        setError("エラーが発生しました。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedImages([...uploadedImages, ...acceptedFiles]);
    }
  }, [uploadedImages]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*", // 画像ファイルのみを受け入れる
    multiple: true, // 複数のファイルをアップロード可能にする
  });

  return (
    <div className="min-h-screen bg-white"> {/* ページ全体を白背景に */}
      <div className="mt-24 mx-auto my-16 min-w-1/2 max-w-2xl px-4 py-4 bg-white"> {/* 中央のコンテンツも白背景 */}
        <div className="bg-gray-700 rounded-md md:flex md:items-center md:justify-between py-2 px-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-white">Art Info</h2>
          </div>
        </div>

        {/* チャット入力欄 */}
        <div className="px-4 py-8">
          <div className="relative">
            <textarea
              id="question"
              className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="質問したいことを入力してください"
              maxLength={500}
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          {/* アップロードされた画像のプレビューをテキストエリアの下に表示 */}
          <div className="mt-4 max-h-32 overflow-y-auto"> {/* 画像のプレビューエリアをスクロール可能に */}
            {uploadedImages.length > 0 && (
              <div className="pt-4 flex flex-wrap">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="p-1 relative mx-2">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Uploaded ${index}`}
                      className="h-16 w-16 rounded-md shadow"
                    />
                    {/* 画像を削除するボタン */}
                    <button
                      onClick={() => removeImage(index)} // 削除するための関数を呼び出す
                      className="absolute top-0 right-0 text-black bg-gray-500/20 rounded-full h-6 w-6 flex items-center justify-center shadow"
                      style={{ transform: "translate(50%, -50%)" }} // 右上の少し外に配置
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4">
          {/* ドラッグアンドドロップエリア */}
          <div {...getRootProps()} className="p-4 border-dashed border-2 border-gray-300 rounded-md text-center mb-4">
            <input {...getInputProps()} />
            <p className="text-gray-600">画像をドラッグ＆ドロップするか、クリックして選択してください（複数選択可）</p>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end mt-4">
          <button
            className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            disabled={isLoading || prompt.length === 0}
            onClick={generateAnswer}
          >
            質問する
          </button>
        </div>

        {/* エラーや回答の表示 */}
        {isLoading ? (
          <div className="font-medium leading-6 text-lg text-indigo-700 pb-2">読み込み中...</div>
        ) : (
          <>
            {error && <div className="mt-4 text-red-500">{error}</div>}
            {answer && (
              <>
                <div className="font-medium leading-6 text-lg text-gray-900 pb-2">回答：</div>
                <p className="mt-2 text-gray-700">{answer}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
