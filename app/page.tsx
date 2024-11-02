'use client'

import {useTranslation} from 'react-i18next';
import {ReactElement, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import Layout from "@/app/components/Layout";
import {useAuthContext} from './contexts/AuthContext';

export default function Home(): ReactElement {
    const router = useRouter();
    const {isAuthenticated, isLoading} = useAuthContext();
    const {t} = useTranslation();
    const signupUrl = process.env.NEXT_PUBLIC_SIGNUP_URL || 'https://www.yolo-japan.com/';

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/users/channels');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleUserLogin = () => {
        router.push('/auth/user/callback');
    };

    const handleCompanyLogin = () => {
        router.push('/auth/company/callback');
    };

    return (
        <Layout>
            <div className="w-full max-w-md space-y-8 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
                        {t('top.welcome')}
                    </h2>
                </div>

                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        <button
                            onClick={handleUserLogin}
                            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {t('top.userLogin')}
                        </button>
                        <button
                            onClick={handleCompanyLogin}
                            className="w-full flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            {t('top.companyLogin')}
                        </button>
                    </div>
                </div>

                <div>
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            {t('auth.noAccount')} <br/>
                            <Link href={signupUrl} className="font-medium text-indigo-600 hover:text-indigo-500">
                                {t('auth.signUp')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
