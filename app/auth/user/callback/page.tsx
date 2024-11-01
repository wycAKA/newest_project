"use client";

import "@/lib/amplify/config";
import { signInWithRedirect } from "@aws-amplify/auth";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {fetchFromApi} from "@/app/utils/api";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        async function handleAuthCallback() {
            if (!process.env.NEXT_PUBLIC_SIGN_IN_PATH || !process.env.NEXT_PUBLIC_AUTH_REDIRECT_PATH) {
                return;
            }

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
                    fetchFromApi('/users', 'POST');
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
                router.push(process.env.NEXT_PUBLIC_SIGN_IN_PATH);
            }
        }

        void handleAuthCallback();
    }, [router]);

    return <div>Authenticating...</div>;
}
