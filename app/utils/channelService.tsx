`use client`;

import {fetchFromApi} from './api';

export interface Channel {
    channelId: string;
    companyId: string;
    serviceType: string;
    isPublic: boolean;
    latestMessageContent: string;
    latestMessageTimestamp: string;
    displayName: string;
    unreadCount: number;
}

export interface ChannelResponse {
    channels: Channel[];
    page_size: number;
    last_evaluated_key?: string;
}

// APIエラーの型定義
export interface ApiError {
    status: number;
    message: string;
    error?: string;
}

// カスタムエラークラスの定義
export class ChannelAccessError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ChannelAccessError';
        this.status = status;
    }
}

export async function fetchUserChannels(): Promise<ChannelResponse> {
    return fetchFromApi<ChannelResponse>('/users/channels');
}

export async function checkChannelAccess(channelId: string): Promise<string | false> {
    try {
        const response = await fetchFromApi<Channel>(`/users/messages/${channelId}`);
        return response['displayName'];
    } catch (error) {
        // エラーの型を確認
        if (error instanceof Error) {
            const apiError = error as ChannelAccessError;
            if (apiError.status === 404 || apiError.status === 403) {
                return false;
            }
        }
        throw error;
    }
}
