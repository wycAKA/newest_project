import {Amplify} from "aws-amplify";
import {ResourcesConfig} from '@aws-amplify/core';

export const configureAmplify = (userType: 'user' | 'company') => {
    const userPoolId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_ID;
    const userPoolClientId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_CLIENT_ID;
    const userPoolDomain = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_DOMAIN
        : process.env.NEXT_PUBLIC_COMPANY_POOL_DOMAIN;
    const redirectSignOut = process.env.NEXT_PUBLIC_REDIRECT_SIGNOUT;

    if (!userPoolId || !userPoolClientId || !userPoolDomain || !redirectSignOut) {
        throw new Error('User pool ID or client ID is not defined');
    }

    const config: ResourcesConfig = {
        Auth: {
            Cognito: {
                userPoolId: userPoolId,
                userPoolClientId: userPoolClientId,
                loginWith: {
                    oauth: {
                        domain: userPoolDomain,
                        scopes: ['email', 'openid', 'profile'],
                        responseType: 'code',
                        redirectSignIn: [getAuthRedirectUrl(userType)],
                        redirectSignOut: [redirectSignOut]
                    }
                }
            }
        }
    };

    // Amplifyの設定を適用
    Amplify.configure(config, {ssr: true});
};

export function getAuthRedirectUrl(userType: 'user' | 'company'): string {
    return `${process.env.NEXT_PUBLIC_DOMAIN_URL}${
        userType === 'user'
            ? '/auth/user/callback'
            : '/auth/company/callback'
    }`;
}
