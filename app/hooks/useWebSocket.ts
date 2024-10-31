import {useCallback, useEffect, useRef, useState} from "react";
import {fetchMessages, Message, readMessages} from "@/app/utils/messageService";
import {fetchAuthSession} from "aws-amplify/auth";

interface MessagesState {
    items: Message[];
    firstTimestamp: string | null;
    lastTimestamp: string | null;
    hasMore: boolean;
    isLoading: boolean;
}

export const useWebSocket = (url: string | null, channelId: string | null) => {
    const [connected, setConnected] = useState(false);
    const [messagesState, setMessagesState] = useState<MessagesState>({
        items: [],
        firstTimestamp: null,
        lastTimestamp: null,
        hasMore: true,
        isLoading: false
    });

    const socketRef = useRef<WebSocket | null>(null);
    const connectAttemptedRef = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 50;
    const messagePageSize = 100;

    const getReconnectDelay = () => {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 16000);
        return delay + Math.random() * 1000;
    };

    const loadInitialMessages = useCallback(async () => {
        if (!channelId) return;

        try {
            const response = await fetchMessages(channelId, {
                limit: messagePageSize
            });

            if (response.messages.length > 0) {
                setMessagesState({
                    items: response.messages,
                    firstTimestamp: response.messages[0].timestamp,
                    lastTimestamp: response.messages[response.messages.length - 1].timestamp,
                    hasMore: response.messages.length === messagePageSize,
                    isLoading: false
                });
            }

            await readMessages(channelId);
        } catch (error) {
            console.error('Error fetching initial messages:', error);
        }
    }, [channelId]);

    const loadMoreMessages = useCallback(async () => {
        if (!channelId || messagesState.isLoading || !messagesState.hasMore) return;

        try {
            setMessagesState(prev => ({...prev, isLoading: true}));

            const response = await fetchMessages(channelId, {
                before: messagesState.firstTimestamp,
                limit: messagePageSize
            });

            if (response.messages.length > 0) {
                setMessagesState(prev => ({
                    items: [...response.messages, ...prev.items],
                    firstTimestamp: response.messages[0].timestamp,
                    lastTimestamp: prev.lastTimestamp,
                    hasMore: response.messages.length === messagePageSize,
                    isLoading: false
                }));
            } else {
                setMessagesState(prev => ({
                    ...prev,
                    hasMore: false,
                    isLoading: false
                }));
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
            setMessagesState(prev => ({...prev, isLoading: false}));
        }
    }, [channelId, messagesState.firstTimestamp, messagesState.hasMore, messagesState.isLoading]);

    const connect = useCallback(async () => {
        if (connectAttemptedRef.current) return;
        connectAttemptedRef.current = true;

        if (socketRef.current) {
            if (socketRef.current.readyState === WebSocket.OPEN) {
                return;
            }
            socketRef.current.close();
            socketRef.current = null;
        }

        if (!url || !channelId) {
            connectAttemptedRef.current = false;
            return;
        }

        try {
            const {tokens} = await fetchAuthSession();
            const idToken = tokens?.idToken;

            if (idToken) {
                const payload = JSON.parse(atob(idToken.toString().split('.')[1]));
                const userIdFromToken = payload.sub;

                const socket = new WebSocket(`${url}?channelId=${channelId}&userId=${userIdFromToken}`);

                socket.onopen = async () => {
                    setConnected(true);
                    reconnectAttemptsRef.current = 0;
                    connectAttemptedRef.current = true;
                    await loadInitialMessages();
                };

                socket.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.content) {
                            setMessagesState(prev => ({
                                ...prev,
                                items: [...prev.items, data],
                                lastTimestamp: data.timestamp
                            }));
                            await readMessages(channelId);
                        } else if (data.type === 'pong') {
                            console.debug('Received pong from server');
                        }
                    } catch (error) {
                        console.error('Error processing received message:', error);
                    }
                };

                socket.onclose = () => {
                    setConnected(false);
                    socketRef.current = null;
                    connectAttemptedRef.current = false;

                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectTimeoutRef.current = setTimeout(async () => {
                            reconnectAttemptsRef.current += 1;
                            console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                            await connect();
                        }, getReconnectDelay());
                    }
                };

                socket.onerror = (error) => {
                    console.error('WebSocket Error:', error);
                    if (socketRef.current) {
                        socketRef.current.close();
                        socketRef.current = null;
                    }
                    setConnected(false);
                    connectAttemptedRef.current = false;
                };

                socketRef.current = socket;
            }
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            connectAttemptedRef.current = false;
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectTimeoutRef.current = setTimeout(async () => {
                    reconnectAttemptsRef.current += 1;
                    await connect();
                }, getReconnectDelay());
            }
        }
    }, [url, channelId, loadInitialMessages]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setConnected(false);
        connectAttemptedRef.current = false;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
        }
        reconnectAttemptsRef.current = 0;
    }, []);

    const sendMessage = useCallback((message: string, userId: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket is not connected. Attempting to reconnect...');
            connect();
            return;
        }

        const messageObj = JSON.stringify({
            action: 'broadcast',
            message: message,
            userId: userId,
        });

        try {
            socketRef.current.send(messageObj);
        } catch (error) {
            console.error('Error sending message:', error);
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectTimeoutRef.current = setTimeout(async () => {
                    reconnectAttemptsRef.current += 1;
                    await connect();
                }, getReconnectDelay());
            }
        }
    }, [connect]);

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    useEffect(() => {
        const pingInterval = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                try {
                    socketRef.current.send(JSON.stringify({action: 'ping'}));
                } catch (error) {
                    console.error('Error sending ping:', error);
                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectTimeoutRef.current = setTimeout(async () => {
                            reconnectAttemptsRef.current += 1;
                            await connect();
                        }, getReconnectDelay());
                    }
                }
            }
        }, 30000);

        return () => {
            clearInterval(pingInterval);
        };
    }, [connect]);

    return {
        connected,
        messages: messagesState.items,
        hasMore: messagesState.hasMore,
        isLoading: messagesState.isLoading,
        loadMoreMessages,
        sendMessage,
        connect,
        disconnect
    };
};
