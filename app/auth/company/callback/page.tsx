"use client";

import { signInWithRedirect } from "@aws-amplify/auth";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchFromApi } from "@/app/utils/api";
import {configureAmplify} from "@/app/utils/amplifyConfig";

export const dynamic = 'force-dynamic';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // Amplifyの設定をコンポーネント内で行う
        configureAmplify('company');
    }, []);

    useEffect(() => {
        async function handleAuthCallback() {
            try {
                console.log("Starting auth callback handling");

                // 既存のセッションをチェック
                const existingSession = await fetchAuthSession();
                if (existingSession.tokens) {
                    console.log("User is already authenticated, redirecting to dashboard");
                    router.push('/');
                    return;
                }

                // 明示的にサインインプロセスを完了
                await signInWithRedirect();

                console.log("Sign in with redirect completed");

                // セッションを取得
                const authSession = await fetchAuthSession();
                console.log("Auth session:", authSession);

                if (authSession.tokens) {
                    const user = await getCurrentUser();
                    console.log("Authenticated user:", user);
                    await fetchFromApi('/companies', 'POST');
                    router.push('/');
                } else {
                    throw new Error("No tokens in auth session");
                }
            } catch (error) {
                console.error("Authentication error:", error);
                if (error instanceof Error) {
                    console.error("Error message:", error.message);
                    console.error("Error stack:", error.stack);

                    // UserAlreadyAuthenticatedException の処理
                    if (error.message.includes("There is already a signed in user")) {
                        console.log("User is already authenticated, signing out and retrying");
                        await signOut();
                        // リロードして認証プロセスを再開
                        window.location.reload();
                        return;
                    }
                }
                router.push('/');
            }
        }

        void handleAuthCallback();
    }, [router]);

    return (<div>Authenticating...</div>);
}
