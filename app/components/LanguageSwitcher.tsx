'use client';

import React from 'react';
import {useTranslation} from 'react-i18next';

const LanguageSwitcher = () => {
    const {i18n} = useTranslation();

    const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLanguage = event.target.value;
        i18n.changeLanguage(newLanguage);
    };

    return (
        <select
            value={i18n.language}
            onChange={changeLanguage}
            className="p-2 border rounded-md bg-white text-gray-700"
        >
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
            <option value="vi">Tiếng Việt</option>
            <option value="pt">Português</option>
        </select>
    );
};

export default LanguageSwitcher;
