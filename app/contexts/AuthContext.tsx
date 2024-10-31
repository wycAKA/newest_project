'use client'

import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {useAuthenticator} from '@aws-amplify/ui-react';
import {AuthUser} from '@aws-amplify/auth';

export type UserType = 'user' | 'company';

// Cognitoユーザー情報の型定義
interface CognitoUser extends AuthUser {
    username: string;
    attributes?: {
        email: string;
        [key: string]: string;
    };
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    username: string | null;
    userType: UserType | null;
    user: CognitoUser | null;
}

const initialAuthContext: AuthContextType = {
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userType: null,
    user: null,
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export function AuthProvider({children}: { children: ReactNode }) {
    const {authStatus, user} = useAuthenticator(context => [context.authStatus, context.user]);
    const [authState, setAuthState] = useState<AuthContextType>(initialAuthContext);

    useEffect(() => {
        if (authStatus !== undefined) {
            // userTypeの判定
            let userType: UserType | null = null;

            if (user) {
                // 属性やトークンを使用してユーザータイプを判定
                // 例: カスタム属性やグループ情報に基づいて判定
                const cognitoUser = user as CognitoUser;
                const userAttributes = cognitoUser.attributes;

                if (userAttributes) {
                    // カスタム属性に基づく判定の例
                    if (userAttributes['custom:user_type'] === 'company') {
                        userType = 'company';
                    } else {
                        userType = 'user';
                    }
                }

                // もしくは、IDトークンのクレームに基づいて判定することも可能
                // const idToken = user.getSignInUserSession()?.getIdToken().getJwtToken();
            }

            setAuthState({
                isAuthenticated: authStatus === 'authenticated',
                isLoading: false,
                username: user?.username || null,
                userType: userType,
                user: user as CognitoUser,
            });
        }
    }, [authStatus, user]);

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
