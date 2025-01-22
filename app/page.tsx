"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const Chat = () => {
  const initialQuestion = "この作品について教えてください。";
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
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [activeChat, setActiveChat] = useState<string>("Chat 1");
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  const [allChats, setAllChats] = useState<{ id: string; history: Record<string, string[]> }[]>([
    { id: "Chat 1", history: {} },
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the bottom of the chat container
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, choices]);

  // Remove an image by index
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    if (updatedImages.length === 0) {
      setIsImageUploaded(false);
    }
  };

  // Create a new chat and reset states
  const createNewChat = () => {
    if (Object.keys(history).length > 0) {
      setAllChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat ? { ...chat, history } : chat
        )
      );
    }

    const newChatId = `Chat ${allChats.length + 1}`;
    setActiveChat(newChatId);
    setAllChats((prevChats) => [...prevChats, { id: newChatId, history: {} }]);
    setPrompt(initialQuestion);
    setAnswer("");
    setChoices([]);
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true);
    setHistory({});
    setFirstAnswer("");
    setFirstUploadedImages([]);
  };

  // Switch to a different chat
  const switchChat = (chatId: string) => {
    const selectedChat = allChats.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setActiveChat(chatId);
      setHistory(selectedChat.history);
      setPrompt(initialQuestion);
      setAnswer("");
      setChoices([]);
      setIsFirstQuestion(true);
    }
  };

  // Delete a specific chat
  const deleteChat = (chatId: string) => {
    setAllChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
    if (activeChat === chatId) {
      if (allChats.length > 1) {
        const nextChat = allChats.find((chat) => chat.id !== chatId);
        if (nextChat) {
          setActiveChat(nextChat.id);
          setHistory(nextChat.history);
        }
      } else {
        createNewChat();
      }
    }
  };

  // Generate an answer based on the prompt
  const generateAnswer = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      const apiKey = isFirstQuestion
        ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_IMAGE
        : process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY_TEXT;

      if (!apiKey) {
        console.warn("APIキーが設定されていないため、モックデータを使用します");
        const mockResponse = {
          content: [
            {
              type: "text",
              text: "{\n  \"response\": {\"answer\": \"フェルメールについての情報\"},\n  \"suggestion_list\": {\n    \"suggestion1\": \"フェルメールの代表作は？\",\n    \"suggestion2\": \"光の表現について教えて\",\n    \"suggestion3\": \"オランダ黄金時代について\"\n  }\n}",
            },
          ],
        };

        const parsedContent = JSON.parse(mockResponse.content[0].text);
        const response = parsedContent.response;
        const suggestions = parsedContent.suggestion_list || {};

        const currentMonth = new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });

        setHistory((prev) => {
          const updatedMonthHistory = prev[currentMonth] || [];
          return {
            ...prev,
            [currentMonth]: [...updatedMonthHistory, `質問: ${prompt}`],
          };
        });

        setHistory((prev) => {
          const updatedMonthHistory = prev[currentMonth] || [];
          return {
            ...prev,
            [currentMonth]: [...updatedMonthHistory, `回答: ${response.answer}`],
          };
        });

        setAnswer(response.answer);
        setChoices([
          suggestions.suggestion1 || "選択肢がありません",
          suggestions.suggestion2 || "選択肢がありません",
          suggestions.suggestion3 || "選択肢がありません",
        ]);
        setPrompt("");
        setIsFirstQuestion(false);
        setIsLoading(false);
        return;
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
      const suggestions = parsedContent.suggestion_list || {};

      const currentMonth = new Date().toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });

      setHistory((prev) => {
        const updatedMonthHistory = prev[currentMonth] || [];
        return {
          ...prev,
          [currentMonth]: [...updatedMonthHistory, `質問: ${prompt}`],
        };
      });

      setHistory((prev) => {
        const updatedMonthHistory = prev[currentMonth] || [];
        return {
          ...prev,
          [currentMonth]: [...updatedMonthHistory, `回答: ${response.answer}`],
        };
      });

      setAllChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat ? { ...chat, history } : chat
        )
      );

      setAnswer(response.answer);
      setChoices([
        suggestions.suggestion1 || "選択肢がありません",
        suggestions.suggestion2 || "選択肢がありません",
        suggestions.suggestion3 || "選択肢がありません",
      ]);
      setPrompt("");
      setIsFirstQuestion(false);
    } catch (e: any) {
      setError(e.message || "エラーが発生しました。");
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

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
    accept: { "image/*": [] },
    maxFiles: 3,
    disabled: isImageUploaded,
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
        {isHistoryVisible && (
          <div className="w-1/2 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-ms font-bold">すべてのチャット履歴</h2>
            {allChats.map((chat) => (
              <div key={chat.id} className="mb-4">
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-sm font-semibold cursor-pointer hover:underline ${
                      activeChat === chat.id ? "bg-indigo-200" : ""
                    }`}
                    onClick={() => switchChat(chat.id)}
                  >
                    {chat.id}
                  </h3>
                  <button
                    onClick={() => deleteChat(chat.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    削除
                  </button>
                </div>
                <ul>
                  {Object.keys(chat.history).map((month) =>
                    chat.history[month].map((entry, index) => (
                      <li
                        key={index}
                        className="py-1 px-2 hover:bg-indigo-50"
                      >
                        {entry}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
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
                <>
                  <p className="text-left text-ms font-bold">
                    調べたい作品の画像を入力してください。
                  </p>
                </>
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
              {choices.length > 0 && (
                <div className="mt-4 space-y-2">
                  {choices.map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(choice)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md w-full text-left shadow-md"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
              {isLoading && <p>読み込み中...</p>}
              {error && <p className="text-red-500">{error}</p>}
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
                    <p className="text-ms font-bold">
                      画像は最大1枚までアップロードされています
                    </p>
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
