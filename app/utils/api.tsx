`use client`;

import { fetchAuthSession } from 'aws-amplify/auth';
import axios from 'axios';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined in the environment variables');
}

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
    if (config.method?.toLowerCase() !== 'options') {
        try {
            const { tokens } = await fetchAuthSession();
            const idToken = tokens?.idToken?.toString();
            if (idToken) {
                config.headers['authorization'] = idToken;
            }
        } catch (error) {
            console.error('Error getting auth token', error);
        }
    }
    return config;
});

export async function fetchFromApi<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: unknown): Promise<T> {
    try {
        const response = await apiClient.request<T>({
            url: endpoint,
            method,
            data,
        });
        return response.data;
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}
