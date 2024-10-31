`use client`;

import {Amplify} from 'aws-amplify';
import {ResourcesConfig} from '@aws-amplify/core';

export const configureAmplify = (userType: 'user' | 'company') => {
    const userPoolId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_ID;
    const userPoolClientId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_CLIENT_ID;
    const domain = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_DOMAIN
        : process.env.NEXT_PUBLIC_COMPANY_POOL_DOMAIN;

    if (!userPoolId || !userPoolClientId || !domain) {
        throw new Error(`Missing Cognito configuration for ${userType} user type`);
    }

    // リダイレクトURLを配列として定義
    const redirectSignIn = process.env.NEXT_PUBLIC_REDIRECT_SIGNIN
        ? [process.env.NEXT_PUBLIC_REDIRECT_SIGNIN]
        : ['http://localhost:3000/auth/callback'];

    const redirectSignOut = process.env.NEXT_PUBLIC_REDIRECT_SIGNOUT
        ? [process.env.NEXT_PUBLIC_REDIRECT_SIGNOUT]
        : ['http://localhost:3000'];

    const config: ResourcesConfig = {
        Auth: {
            Cognito: {
                userPoolId: userPoolId,
                userPoolClientId: userPoolClientId,
                loginWith: {
                    oauth: {
                        domain: domain,
                        scopes: ['openid', 'email', 'profile'],
                        redirectSignIn: redirectSignIn,
                        redirectSignOut: redirectSignOut,
                        responseType: 'code'
                    }
                }
            }
        }
    };

    Amplify.configure(config);
};

export const getLoginUrl = (userType: 'user' | 'company'): string => {
    const domain = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_DOMAIN
        : process.env.NEXT_PUBLIC_COMPANY_POOL_DOMAIN;

    const clientId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_CLIENT_ID;

    const region = process.env.NEXT_PUBLIC_REGION;
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_SIGNIN || '');

    if (!domain || !clientId || !region) {
        throw new Error(`Missing Cognito configuration for ${userType} user type`);
    }

    return `${domain}/?redirect_uri=${redirectUri}`;
};

export const getLogoutUrl = (userType: 'user' | 'company'): string => {
    const domain = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_DOMAIN
        : process.env.NEXT_PUBLIC_COMPANY_POOL_DOMAIN;

    const clientId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_CLIENT_ID;

    const region = process.env.NEXT_PUBLIC_REGION;
    const signOutUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_SIGNOUT || '');

    if (!domain || !clientId || !region) {
        throw new Error(`Missing Cognito configuration for ${userType} user type`);
    }

    return `${domain}/logout?client_id=${clientId}&logout_uri=${signOutUri}`;
};
