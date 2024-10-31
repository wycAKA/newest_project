'use client'

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/app/contexts/AuthContext';
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuthContext();

    const clearStorageAndCookies = () => {
        // ローカルストレージをクリア
        localStorage.clear();

        // すべてのクッキーを削除
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }

        // セッションストレージもクリア
        sessionStorage.clear();
    };

    const handleLogout = () => {
        try {
            // ストレージとクッキーをクリア
            clearStorageAndCookies();

            // トップにリダイレクト
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div
            className={`fixed inset-0 overflow-hidden z-50 transition-opacity ${
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
                <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
                    <div className="w-screen max-w-md">
                        <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-lg font-medium text-gray-900">{t('menu.menu')}</h2>
                                    <button
                                        className="ml-3 h-7 flex items-center text-gray-400 hover:text-gray-500"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">{t('menu.close')}</span>
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <nav className="mt-6">
                                    <ul className="space-y-4">
                                        <li>
                                            <Link href="/" className="text-base text-gray-900 hover:text-indigo-600">
                                                {t('menu.home')}
                                            </Link>
                                        </li>
                                        {isAuthenticated && (
                                            <li>
                                                <button
                                                    onClick={handleLogout}
                                                    className="text-base text-gray-900 hover:text-indigo-600"
                                                >
                                                    {t('menu.logout')}
                                                </button>
                                            </li>
                                        )}
                                        <li className="pt-4 border-t">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Language
                                                </label>
                                                <LanguageSwitcher />
                                            </div>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Drawer;
