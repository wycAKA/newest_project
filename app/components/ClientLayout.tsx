'use client'

import '@aws-amplify/ui-react/styles.css';
import '@/app/globals.css';
import '@/app/i18n';
import {Authenticator} from '@aws-amplify/ui-react';
import {AuthProvider} from '@/app/contexts/AuthContext';
import {configureAmplify} from "@/app/utils/amplifyConfig";
import {useEffect, useState} from 'react';
import {extendUserTypeCookie, getUserTypeFromCookie} from "@/app/utils/cookieManager";

export default function ClientLayout({children}: { children: React.ReactNode }) {
    const [isConfigured, setIsConfigured] = useState(false)

    useEffect(() => {
        const initialize = async () => {
            try {
                const userType = getUserTypeFromCookie();

                if (userType) {
                    extendUserTypeCookie();
                    await configureAmplify(userType);
                }
                setIsConfigured(true);
            } catch (error) {
                console.error('Failed to configure Amplify:', error);
            }
        }

        initialize();
    }, [])

    // Amplifyの設定が完了するまでローディング状態を表示（オプション）
    if (!isConfigured) {
        return null // または適切なローディングコンポーネント
    }

    return (
        <Authenticator.Provider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </Authenticator.Provider>
    );
}
