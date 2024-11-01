"use client";

import { signInWithRedirect } from "@aws-amplify/auth";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { ReactElement, useEffect } from "react";
import { fetchFromApi } from "@/app/utils/api";
import {configureAmplify} from "@/app/utils/amplifyConfig";

export const dynamic = 'force-dynamic';

function CallbackWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // Amplifyの設定をコンポーネント内で行う
        configureAmplify('company');
    }, []);

    useEffect(() => {
        async function handleAuthCallback() {
            try {
                console.log("Handling auth callback...");

                const existingSession = await fetchAuthSession();
                console.log("Existing session:", existingSession);
                if (existingSession.tokens) {
                    console.log("existingSession.tokens is truthy");
                    router.push('/');
                    return;
                }

                await signInWithRedirect();
                const authSession = await fetchAuthSession();
                console.log("Auth session:", authSession);

                if (authSession.tokens) {
                    console.log("authSession.tokens is truthy");
                    await getCurrentUser();
                    await fetchFromApi('/companies', 'POST');
                    router.push('/');
                }

                console.log("Redirecting to sign in...");
            } catch (error) {
                console.error("Authentication error:", error);

                if (error instanceof Error && error.message.includes("There is already a signed in user")) {
                    await signOut();
                    window.location.reload();
                    return;
                }

                router.push('/');
            }
        }

        void handleAuthCallback();
    }, [router]);

    return <>{children}</>;
}

export default function AuthCallback(): ReactElement {
    return (
        <CallbackWrapper>
            <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Authenticating...
                    </h2>
                </div>
            </div>
        </CallbackWrapper>
    );
}
