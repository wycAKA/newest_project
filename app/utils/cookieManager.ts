// utils/cookieManager.ts を新規作成
import Cookies from 'js-cookie';

export const COOKIE_USER_TYPE = 'userType';
const DEFAULT_EXPIRY_DAYS = 365;

// 現在のドメインのベースドメインを取得する関数
function getBaseDomain(): string {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
}

export function getUserTypeFromCookie(): 'user' | 'company' | null {
    return Cookies.get(COOKIE_USER_TYPE) as 'user' | 'company' | null;
}

export function updateUserTypeCookie(userType: 'user' | 'company') {
    Cookies.set(COOKIE_USER_TYPE, userType, {
        expires: DEFAULT_EXPIRY_DAYS,
        sameSite: 'strict',
        secure: true
    });
}

export function extendUserTypeCookie() {
    const currentUserType = getUserTypeFromCookie();
    if (currentUserType) {
        updateUserTypeCookie(currentUserType as 'user' | 'company');
    }
}

export function deleteUserTypeCookie() {
    Cookies.remove(COOKIE_USER_TYPE, {
        sameSite: 'strict',
        secure: true
    });
}

export function clearAllCookies() {
    // document.cookieから直接すべてのCookieを取得
    const cookies = document.cookie.split(';');
    const baseDomain = getBaseDomain();

    // 各Cookieを削除
    for (const cookie of cookies) {
        const [name] = cookie.split('=').map(c => c.trim());

        // ルートパスで削除
        Cookies.remove(name, {path: '/'});

        // ベースドメインで削除
        Cookies.remove(name, {
            path: '/',
            domain: baseDomain,
            sameSite: 'strict',
            secure: true
        });

        // 明示的にCookieを期限切れにする
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${baseDomain}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}
