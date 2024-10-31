'use client';

import React from 'react';
import MessageItem from './MessageItem';
import {Message} from '@/app/utils/messageService';

interface Props {
    messages: Message[];
    currentUserId: string; // 追加
}

const MessageList: React.FC<Props> = ({messages, currentUserId}) => {
    return (
        <div className="p-4 space-y-4">
            {messages.map((message) => (
                <MessageItem key={message.messageId} message={message} currentUserId={currentUserId}/>
            ))}
        </div>
    );
};

export default MessageList;
