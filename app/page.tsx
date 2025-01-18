"use client";
import axios from "axios";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const Chat = () => {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);
  const [history, setHistory] = useState<Record<string, { prompt: string; answer: string; images: File[] }[]>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateChatId = () => {
    return `${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const createNewChat = () => {
    const newChatId = generateChatId();
    setActiveChatId(newChatId);
    setHistory((prevHistory) => ({
      ...prevHistory,
      [newChatId]: [],
    }));
    setPrompt("");
    setAnswer("");
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true);
    setChoices([]);
  };

  const generateAnswer = async () => {
    if (!activeChatId) {
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const apiKey = isFirstQuestion
        ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_IMAGE
        : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_TEXT;

      if (!apiKey) {
        throw new Error("APIキーが設定されていません");
      }

      const res = await axios.post(
        "/api/claude",
        { prompt, isFirstQuestion },
        {
          headers: {
            "X-API-Key": apiKey,
          },
          timeout: 15000,
        }
      );

      const parsedContent = JSON.parse(res.data.content[0].text);
      const response = parsedContent.response;
      const suggestions = parsedContent.suggestion_list;

      setAnswer(response.text);
      setChoices([
        suggestions.suggestion1,
        suggestions.suggestion2,
        suggestions.suggestion3,
      ]);

      setHistory((prevHistory) => ({
        ...prevHistory,
        [activeChatId]: [
          ...prevHistory[activeChatId],
          { prompt, answer: response.text, images: uploadedImages },
        ],
      }));

      setIsFirstQuestion(false);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const newImages = [...uploadedImages, ...acceptedFiles];
        setUploadedImages(newImages);

        if (newImages.length >= 1) {
          setIsImageUploaded(true);
        }
      }
    },
    [uploadedImages]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    maxFiles: 1,
    disabled: isImageUploaded,
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
      </div>

      <div className="flex flex-1">
        {isHistoryVisible && (
          <div className="w-1/2 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-ms font-bold">会話履歴</h2>
            {Object.keys(history).map((chatId) => (
              <div
                key={chatId}
                className="mb-2 cursor-pointer"
                onClick={() => setActiveChatId(chatId)}
              >
                <div
                  className={`p-2 rounded-md ${
                    chatId === activeChatId ? "bg-indigo-200" : "bg-gray-100"
                  }`}
                >
                  Chat {chatId}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4">
              {activeChatId &&
                history[activeChatId]?.map((chat, index) => (
                  <div key={index} className="mb-4">
                    <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-start">
                      {chat.answer}
                    </div>
                    {chat.images.length > 0 && (
                      <div className="py-4 flex flex-wrap gap-4">
                        {chat.images.map((file, index) => (
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
                ))}
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
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="h-20 w-20 object-cover rounded-md shadow"
                      />
                      <button
                        onClick={() => {
                          const updatedImages = uploadedImages.filter((_, i) => i !== index);
                          setUploadedImages(updatedImages);
                          if (updatedImages.length === 0) setIsImageUploaded(false);
                        }}
                        className="absolute top-0 right-0 bg-gray-800 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                    <p className="text-ms font-bold">画像は最大1枚までアップロードされています</p>
                  ) : (
                    <p className="text-ms font-bold">
                      画像をドラッグ＆ドロップするか
                      <br />
                      クリックして選択してください
                      <br />
                      （最大1枚まで）
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
                    disabled={uploadedImages.length === 0}
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
                    disabled={!prompt}
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
