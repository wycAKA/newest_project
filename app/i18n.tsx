// frontend/app/i18n.tsx
'use client';

import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { PropsWithChildren } from 'react';

// i18nの初期化
i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'ja', 'ko', 'pt', 'vi', 'zh'],
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        defaultNS: 'translation',
        detection: {
            order: ['cookie', 'localStorage', 'navigator'],
            caches: ['cookie'],
            cookieMinutes: 60 * 24 * 365,
        },
        react: {
            useSuspense: false,
        },
    });

// Providerコンポーネント
export function I18nProvider({ children }: PropsWithChildren) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default i18n;
