'use client';

import React, {KeyboardEvent, useState, useCallback, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import TranslationLanguageSwitcher from '@/app/components/TranslationLanguageSwitcher';
import {getUserTypeFromCookie} from "@/app/utils/cookieManager";

interface Props {
    onSendMessage: (content: string) => void;
    connected: boolean;
}

const InputArea: React.FC<Props> = ({onSendMessage, connected}) => {
    const {t} = useTranslation();
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const userType = getUserTypeFromCookie();
    const isSubmittingRef = useRef(false);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (isSubmittingRef.current || !input.trim() || !connected) {
            return;
        }

        try {
            isSubmittingRef.current = true;
            setIsSending(true);

            await onSendMessage(input);
            setInput('');
        } finally {
            // 送信完了後、少し待ってから次の送信を許可
            setTimeout(() => {
                isSubmittingRef.current = false;
                setIsSending(false);
            }, 500);
        }
    }, [input, connected, onSendMessage]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[40px] max-h-[120px] text-gray-900 placeholder:text-gray-500"
                    placeholder={t('chat.input.placeholder')}
                    disabled={!connected || isSending}
                    rows={1}
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!connected || !input.trim() || isSending}
                >
                    {isSending ? t('chat.input.sending') : t('chat.input.send')}
                </button>
            </div>
            {userType === 'user' && (
                <div className="flex justify-end mt-2">
                    <TranslationLanguageSwitcher/>
                </div>
            )}
        </form>
    );
};

export default InputArea;
