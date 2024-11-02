import {Amplify} from "aws-amplify";
import {ResourcesConfig} from '@aws-amplify/core';

export const configureAmplify = (userType: 'user' | 'company') => {
    const userPoolId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_ID;
    const userPoolClientId = userType === 'user'
        ? process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
        : process.env.NEXT_PUBLIC_COMPANY_POOL_CLIENT_ID;

    if (!userPoolId || !userPoolClientId) {
        throw new Error('User pool ID or client ID is not defined');
    }

    // V6形式の設定
    let config: ResourcesConfig = {
        Auth: {
            Cognito: {
                userPoolId: userPoolId,
                userPoolClientId: userPoolClientId,
            },
        },
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
