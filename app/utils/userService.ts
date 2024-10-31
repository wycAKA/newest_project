import {fetchFromApi} from './api';

export interface User {
    userId: string;
    companyId: string;
    locale: string;
    language: string;
    name: string;
    profileImageUrl: string;
}

export async function fetchLanguage(): Promise<string> {
    const user = await fetchFromApi<User>('/users/language');
    return user['language'];
}

export async function changeLanguage(language: string): Promise<User> {
    return fetchFromApi<User>('/users/language', 'POST', {language});
}
