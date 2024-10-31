import {fetchFromApi} from './api';

export interface Message {
    messageId: string;
    channelId: string;
    content: string;
    userId: string;
    timestamp: string;
    translateContent?: string;
}

export interface MessageResponse {
    messages: Message[];
}

export interface MessageParameters {
    before?: string | null;
    after?: string | null;
    limit?: number | null;

    [key: string]: string | number | null | undefined;
}

export async function fetchMessages(channel_id: string, parameters?: MessageParameters): Promise<MessageResponse> {
    let uri = `/messages/${channel_id}`;
    if (parameters) {
        const validParams = Object.entries(parameters)
            .filter(([, value]) => value !== null && value !== undefined)
            .reduce((acc, [key, value]) => ({
                ...acc,
                [key]: value
            }), {});

        const searchParams = new URLSearchParams(validParams);
        const queryString = searchParams.toString();

        if (queryString) {
            uri += '?' + queryString;
        }
    }
    return fetchFromApi<MessageResponse>(uri);
}

export async function readMessages(channel_id: string): Promise<void> {
    try {
        await fetchFromApi(`/messages/${channel_id}/read`, 'POST');
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}
