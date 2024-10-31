'use client'

import {useAuthenticator} from '@aws-amplify/ui-react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {ChannelResponse, fetchUserChannels} from '@/app/utils/channelService';
import Layout from "@/app/components/Layout";
import Link from 'next/link';
import {Loader2, MessageCircle} from 'lucide-react';
import {useTranslation} from "react-i18next";

export const revalidate = 0;

// 時間表示のフォーマット関数
const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 6) {
        // 1週間以上前は年月日表示
        return date.toLocaleDateString();
    } else if (days > 0) {
        // 1日以上前は曜日表示
        return date.toLocaleDateString(undefined, {weekday: 'short'});
    } else {
        // 当日は時刻表示
        return date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
    }
};

const UnreadBadge = ({count}: { count: number }) => {
    if (count === 0) return null;

    return (
        <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center">
      <span className="text-xs font-medium text-white">
        {count > 99 ? '99+' : count}
      </span>
        </div>
    );
};

export default function Channels() {
    const {t} = useTranslation();
    const {authStatus} = useAuthenticator(context => [context.authStatus, context.user, context.signOut]);
    const router = useRouter();
    const [channelResponse, setChannelResponse] = useState<ChannelResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/');
        }
    }, [authStatus, router]);

    useEffect(() => {
        async function loadChannels() {
            if (authStatus === 'authenticated') {
                try {
                    setIsLoading(true);
                    const response = await fetchUserChannels();
                    if (response) {
                        setChannelResponse(response);
                    } else {
                        setError('No channel data received');
                    }
                } catch (err) {
                    setError('Failed to load channels');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            }
        }

        loadChannels();
    }, [authStatus]);

    if (authStatus !== 'authenticated') {
        return null;
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50">
                <div className="w-screen max-w-[1024px] mx-auto bg-white shadow-sm">
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        <div className="px-4 py-3">
                            <h2 className="text-lg font-semibold text-gray-800">{t('chat.talks')}</h2>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-600"/>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-sm text-red-600">{error}</div>
                    ) : channelResponse?.channels.length ? (
                        <div className="divide-y divide-gray-100">
                            {channelResponse.channels.map((channel) => (
                                <Link
                                    key={channel.channelId}
                                    href={`/users/messages/${channel.channelId}`}
                                    className="block hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-start p-4 gap-3">
                                        {/* アバター部分 */}
                                        <div
                                            className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <MessageCircle className="h-6 w-6 text-indigo-600"/>
                                        </div>

                                        {/* メイン情報 */}
                                        <div className="flex-1 min-w-0 flex">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                                                    {channel.displayName}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {channel.latestMessageContent || 'No messages yet'}
                                                </p>
                                            </div>

                                            {/* 時間と未読バッジ */}
                                            <div className="flex flex-col items-end flex-shrink-0 gap-1">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(channel.latestMessageTimestamp)}
                        </span>
                                                <UnreadBadge count={channel.unreadCount || 0}/>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 px-4">
                            <MessageCircle className="h-12 w-12 text-gray-300 mb-2"/>
                            <p className="text-sm text-gray-600 text-center">
                                {t('chat.notChannel')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
