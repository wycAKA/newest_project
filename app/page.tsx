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
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [activeChat, setActiveChat] = useState<string>("Chat 1");
  const [allChats, setAllChats] = useState<{ id: string; history: Record<string, string[]> }[]>([
    { id: "Chat 1", history: {} },
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
    setHistory({});
    setPrompt(initialQuestion);
    setAnswer("");
    setChoices([]);
    setError("");
    setIsFirstQuestion(true);
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
              text: "{\"response\": {\"answer\": \"フェルメールについての情報\"}, \"suggestion_list\": {\"suggestion1\": \"フェルメールの代表作は？\", \"suggestion2\": \"光の表現について教えて\", \"suggestion3\": \"オランダ黄金時代について\"}}",
            },
          ],
        };

        const parsedContent = JSON.parse(mockResponse.content[0].text);
        const response = parsedContent.response;
        const suggestions = parsedContent.suggestion_list || {};

        setAnswer(response.answer);
        setChoices([suggestions.suggestion1, suggestions.suggestion2, suggestions.suggestion3]);
        setPrompt("");
        setIsFirstQuestion(false);
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

      setAnswer(response.answer);
      setChoices([suggestions.suggestion1, suggestions.suggestion2, suggestions.suggestion3]);
      setPrompt("");
      setIsFirstQuestion(false);
    } catch (e: any) {
      setError(e.message || "エラーが発生しました。");
    } finally {
      setIsLoading(false);
      scrollToBottom();
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
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-gray-800 text-white z-10">
        <button onClick={createNewChat} className="text-xl font-bold">
          新しいチャット
        </button>
      </div>

      <div className="flex flex-1 mt-[50px]">
        <div className="w-full">
          <div className="flex flex-col h-full">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
              {answer && (
                <div className="mb-4">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md max-w-xs self-start">
                    {answer}
                  </div>
                </div>
              )}
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
              <button
                onClick={generateAnswer}
                disabled={isLoading || !prompt.trim()}
                className="px-4 py-2 rounded bg-indigo-600 text-white"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
