'use client';

import {useCallback, useEffect, useState} from 'react';
import {useParams, useRouter} from "next/navigation";
import {fetchAuthSession} from 'aws-amplify/auth';
import Layout from "@/app/components/Layout"
import {ArrowLeft, Loader2} from 'lucide-react';
import ChatContainer from "@/app/components/ChatContainer"
import {useWebSocket} from '@/app/hooks/useWebSocket';
import {checkChannelAccess} from '@/app/utils/channelService';

export const dynamic = 'force-dynamic';

export default function Home() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [channelName, setChannelName] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(true);
    const params = useParams();
    const channelId = params.channelId as string;
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || null;

    const {
        connected,
        messages,
        sendMessage,
        hasMore,
        isLoading,
        loadMoreMessages
    } = useWebSocket(WEBSOCKET_URL, channelId);

    useEffect(() => {
        async function initialize() {
            try {
                setIsInitializing(true);
                const {tokens} = await fetchAuthSession();
                const idToken = tokens?.idToken;
                if (idToken) {
                    const payload = JSON.parse(atob(idToken.toString().split('.')[1]));
                    setUserId(payload.sub);

                    const displayName = await checkChannelAccess(channelId);
                    if (!displayName) {
                        router.push('/users/channels');
                        return;
                    }
                    setChannelName(displayName);
                }
            } catch (error) {
                console.error('Error during initialization:', error);
                router.push('/users/channels');
            } finally {
                setIsInitializing(false);
            }
        }

        initialize();
    }, [channelId, router]);

    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleSendMessage = useCallback((content: string) => {
        if (userId) {
            sendMessage(content, userId);
        }
    }, [userId, sendMessage]);

    const handleLoadMore = useCallback(() => {
        if (hasMore && !isLoading) {
            loadMoreMessages();
        }
    }, [hasMore, isLoading, loadMoreMessages]);

    if (isInitializing) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-12 w-12 animate-spin text-gray-600"/>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-screen bg-gray-50">
                <div className="w-screen max-w-[1024px] mx-auto bg-white shadow-sm flex flex-col h-full">
                    {/* ヘッダー部分 */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-200">
                        <div className="relative flex items-center justify-center px-4 py-3">
                            <button
                                onClick={handleGoBack}
                                className="absolute left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={20} className="text-gray-600"/>
                            </button>
                            <h2 className="text-lg font-semibold text-gray-800 truncate px-12">
                                {channelName}
                            </h2>
                        </div>
                    </div>

                    {/* チャットコンテナ */}
                    <div className="flex-1 overflow-hidden">
                        {userId && (
                            <ChatContainer
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                connected={connected}
                                currentUserId={userId}
                                hasMore={hasMore}
                                isLoading={isLoading}
                                onLoadMore={handleLoadMore}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
