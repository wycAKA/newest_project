// utils/cookieManager.ts を新規作成
import Cookies from 'js-cookie';

export const COOKIE_USER_TYPE = 'userType';
const DEFAULT_EXPIRY_DAYS = 365;

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
    const currentUserType = Cookies.get(COOKIE_USER_TYPE);
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
