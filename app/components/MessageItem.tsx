'use client';

import React from 'react';
import {Message} from '@/app/utils/messageService';

interface Props {
    message: Message;
    currentUserId: string;
}

const MessageItem: React.FC<Props> = ({message, currentUserId}) => {
    const isUser = message.userId === currentUserId;

    const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const renderContent = (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = content.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`underline ${isUser ? 'text-blue-100' : 'text-blue-500'}`}
                    >
                        {part}
                    </a>
                );
            }
            return part.split('\n').map((line, lineIndex) => (
                <React.Fragment key={`${index}-${lineIndex}`}>
                    {line}
                    {lineIndex < part.split('\n').length - 1 && <br/>}
                </React.Fragment>
            ));
        });
    };

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
            <div
                className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                    isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                }`}
            >
                <p className="whitespace-pre-wrap break-words">{renderContent(message.content)}</p>
                {!isUser && message.translateContent && (
                    <p className="whitespace-pre-wrap break-words">---<br/>{renderContent(message.translateContent)}</p>
                )}
            </div>
            <p className={`text-xs mt-1 ${isUser ? 'text-gray-600' : 'text-gray-500'}`}>
                {formatDateTime(message.timestamp)}
            </p>
        </div>
    );
};

export default MessageItem;
