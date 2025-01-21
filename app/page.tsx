"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // 一意のID生成

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
  const [history, setHistory] = useState<{ type: "question" | "answer"; text: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState(uuidv4());
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [chatList, setChatList] = useState<{ id: string; title: string; history: typeof history }[]>([
    { id: activeChatId, title: "新しいチャット", history: [] },
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, choices]);

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);

    if (updatedImages.length === 0) {
      setIsImageUploaded(false);
    }
  };

  const createNewChat = () => {
    const newChatId = uuidv4();
    const newChat = { id: newChatId, title: `新しいチャット ${chatList.length + 1}`, history: [] };

    setChatList((prev) => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setPrompt(initialQuestion);
    setAnswer("");
    setChoices([]);
    setError("");
    setUploadedImages([]);
    setIsImageUploaded(false);
    setIsFirstQuestion(true);
    setHistory([]);
    setFirstAnswer("");
    setFirstUploadedImages([]);
  };

  const switchChat = (chatId: string) => {
    const selectedChat = chatList.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setActiveChatId(chatId);
      setHistory(selectedChat.history);
      setPrompt(initialQuestion);
      setAnswer("");
      setChoices([]);
      setIsFirstQuestion(true);
    }
  };

  const saveChatHistory = () => {
    setChatList((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId ? { ...chat, history } : chat
      )
    );
  };

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

        setHistory((prev) => [
          ...prev,
          { type: "question", text: prompt },
          { type: "answer", text: response.answer },
        ]);

        setAnswer(response.answer);
        setChoices([
          suggestions.suggestion1 || "選択肢がありません",
          suggestions.suggestion2 || "選択肢がありません",
          suggestions.suggestion3 || "選択肢がありません",
        ]);
        setPrompt("");
        setIsFirstQuestion(false);
        setIsLoading(false);
        saveChatHistory();
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

      setHistory((prev) => [
        ...prev,
        { type: "question", text: prompt },
        { type: "answer", text: response.answer },
      ]);

      setAnswer(response.answer);
      setChoices([
        suggestions.suggestion1 || "選択肢がありません",
        suggestions.suggestion2 || "選択肢がありません",
        suggestions.suggestion3 || "選択肢がありません",
      ]);
      setPrompt("");
      setIsFirstQuestion(false);
      saveChatHistory();
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
          <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-ms font-bold">すべてのチャット履歴</h2>
            {chatList.map((chat) => (
              <div key={chat.id} className="mb-4">
                <h3
                  className={`text-sm font-semibold cursor-pointer hover:underline ${
                    chat.id === activeChatId ? "text-indigo-500" : "text-gray-600"
                  }`}
                  onClick={() => switchChat(chat.id)}
                >
                  {chat.title}
                </h3>
              </div>
            ))}
          </div>
        )}

        <div className={isHistoryVisible ? "w-3/4" : "w-full"}>
          <div className="flex flex-col h-full">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-4 p-2 rounded-lg shadow-md max-w-xs ${
                    entry.type === "question"
                      ? "bg-blue-100 text-blue-800 self-end"
                      : "bg-gray-200 text-gray-800 self-start"
                  }`}
                >
                  {entry.text}
                </div>
              ))}
              {isLoading && <p>読み込み中...</p>}
              {error && <p className="text-red-500">{error}</p>}
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4">
              <textarea
                className="w-full border rounded p-2 mb-4"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="質問を入力してください"
              />
              <div className="flex justify-end">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
