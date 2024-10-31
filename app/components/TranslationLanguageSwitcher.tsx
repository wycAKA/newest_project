'use client';

import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {changeLanguage, fetchLanguage} from '@/app/utils/userService';

const TranslationLanguageSwitcher = () => {
    const {t} = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState<string>('en');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initLanguage = async () => {
            try {
                const language = await fetchLanguage();
                setCurrentLanguage(language);
            } catch (error) {
                console.error('Error fetching translation language:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initLanguage();
    }, []);

    const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = event.target.value;

        try {
            await changeLanguage(newLanguage);
            setCurrentLanguage(newLanguage);
        } catch (error) {
            console.error('Error updating translation language:', error);
        }
    };

    return (
        <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">{t('translation.language')}:</span>
            <select
                onChange={handleLanguageChange}
                className="p-1 text-sm border rounded-md bg-white text-gray-700 w-24"
                value={currentLanguage}
                disabled={isLoading}
            >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="ru">Русский</option>
                <option value="it">Italiano</option>
                <option value="ar">العربية</option>
                <option value="ja">日本語</option>
                <option value="ko">한国어</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="vi">Tiếng Việt</option>
            </select>
        </div>
    );
};

export default TranslationLanguageSwitcher;
