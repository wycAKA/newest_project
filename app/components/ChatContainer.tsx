'use client'

import React, {useEffect, useRef, useState} from 'react';
import MessageList from '@/app/components/MessageList';
import InputArea from '@/app/components/InputArea';
import {Message} from '@/app/utils/messageService';

interface Props {
    messages: Message[];
    onSendMessage: (content: string) => void;
    connected: boolean;
    currentUserId: string;
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
}

const ChatContainer: React.FC<Props> = ({
                                            messages,
                                            onSendMessage,
                                            connected,
                                            currentUserId,
                                            hasMore,
                                            isLoading,
                                            onLoadMore
                                        }) => {
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const firstRenderRef = useRef(true);
    const previousMessagesLengthRef = useRef(messages.length);
    const scrollHeightRef = useRef(0);
    const isLoadingRef = useRef(false);

    // スクロール位置のチェックと管理
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // 下部付近かどうかのチェック
        const bottomThreshold = 100;
        const isNear = container.scrollHeight - container.scrollTop - container.clientHeight < bottomThreshold;
        setIsNearBottom(isNear);

        // スクロール位置が33%を超えたら追加読み込みを開始
        const scrollPercentage = (container.scrollTop / container.scrollHeight) * 100;
        const loadMoreThreshold = 33; // コンテンツの上部33%の位置で読み込みを開始

        if (scrollPercentage < loadMoreThreshold && !isLoadingRef.current && hasMore) {
            isLoadingRef.current = true;
            scrollHeightRef.current = container.scrollHeight;
            onLoadMore();
        }
    };

    // メッセージ更新時のスクロール処理
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const currentMessagesLength = messages.length;

        // 新しいメッセージが追加された場合（下方向の更新）
        if (currentMessagesLength > previousMessagesLengthRef.current) {
            if (isNearBottom) {
                setTimeout(() => {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'instant'
                    });
                }, 100);
            }
        }
        // 古いメッセージが読み込まれた場合（上方向の更新）
        else if (currentMessagesLength > previousMessagesLengthRef.current && scrollHeightRef.current > 0) {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - scrollHeightRef.current;
            if (scrollDiff > 0) {
                container.scrollTop = scrollDiff;
            }
        }

        previousMessagesLengthRef.current = currentMessagesLength;
        isLoadingRef.current = false;
    }, [messages, isNearBottom]);

    // 初回レンダリング時のスクロール処理
    useEffect(() => {
        if (firstRenderRef.current && messages.length > 0) {
            firstRenderRef.current = false;
            const container = messagesContainerRef.current;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
            // ページ全体のスクロール
            setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'instant'
                });
            }, 100);
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scroll-smooth"
                onScroll={handleScroll}
            >
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"/>
                    </div>
                )}
                <MessageList messages={messages} currentUserId={currentUserId}/>
            </div>
            <div className="flex-shrink-0">
                <InputArea onSendMessage={onSendMessage} connected={connected}/>
            </div>
        </div>
    );
};

export default ChatContainer;
