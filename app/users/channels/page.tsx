'use client'

import {memo} from 'react';
import {useAuthenticator} from '@aws-amplify/ui-react';
import {useRouter} from 'next/navigation';
import {useEffect, useState, useMemo} from 'react';
import {ChannelResponse, fetchUserChannels, Channel} from '@/app/utils/channelService';
import Layout from "@/app/components/Layout";
import Link from 'next/link';
import {Loader2, MessageCircle} from 'lucide-react';
import {useTranslation} from "react-i18next";

export const dynamic = 'force-dynamic';

// formatTimeをuseMemoで最適化
function ChannelList({channels}: { channels: ChannelResponse['channels'] }) {
    const formatTime = useMemo(() => (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 6) return date.toLocaleDateString();
        if (days > 0) return date.toLocaleDateString(undefined, {weekday: 'short'});
        return date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
    }, []);

    return (
        <div className="divide-y divide-gray-100">
            {channels.map((channel) => (
                <Link
                    key={channel.channelId}
                    href={`/users/messages/${channel.channelId}`}
                    className="block hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                    <ChannelItem channel={channel} formatTime={formatTime} />
                </Link>
            ))}
        </div>
    );
}

// UnreadBadgeをメモ化
const UnreadBadge = memo(({count}: { count: number }) => {
    if (count === 0) return null;
    return (
        <div className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-xs font-medium text-white">
                {count > 99 ? '99+' : count}
            </span>
        </div>
    );
});

UnreadBadge.displayName = 'UnreadBadge';

// ChannelItemコンポーネントを分離
function ChannelItem({ channel, formatTime }: { channel: Channel, formatTime: (timestamp: string) => string }) {
    return (
        <div className="flex items-start p-4 gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-indigo-600"/>
            </div>
            <div className="flex-1 min-w-0 flex">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {channel.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                        {channel.latestMessageContent || 'No messages yet'}
                    </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTime(channel.latestMessageTimestamp)}
                    </span>
                    <UnreadBadge count={channel.unreadCount || 0}/>
                </div>
            </div>
        </div>
    );
}

export default function Channels() {
    const {t} = useTranslation();
    const {authStatus} = useAuthenticator(context => [context.authStatus]);
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
                    setChannelResponse(response);
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
                        <ChannelList channels={channelResponse.channels} />
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
