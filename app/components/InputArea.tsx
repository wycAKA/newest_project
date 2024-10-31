'use client';

import React, {KeyboardEvent, useState} from 'react';
import {useTranslation} from 'react-i18next';
import TranslationLanguageSwitcher from '@/app/components/TranslationLanguageSwitcher';

interface Props {
    onSendMessage: (content: string) => void;
    connected: boolean;
}

const InputArea: React.FC<Props> = ({onSendMessage, connected}) => {
    const {t} = useTranslation();
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && connected) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift + Enter の場合は改行を許可
                return;
            }
            // Enter のみの場合は送信
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[40px] max-h-[120px] text-gray-900 placeholder:text-gray-500"
                    placeholder={t('chat.input.placeholder')}
                    disabled={!connected}
                    rows={1}
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!connected || !input.trim()}
                >
                    {t('chat.input.send')}
                </button>
            </div>
            <div className="flex justify-end mt-2">
                <TranslationLanguageSwitcher/>
            </div>
        </form>
    );
};

export default InputArea;
