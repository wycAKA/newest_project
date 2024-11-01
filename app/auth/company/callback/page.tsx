"use client";

import "@/lib/amplify/config";
import { signInWithRedirect } from "@aws-amplify/auth";
import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { ReactElement, useEffect } from "react";
import { fetchFromApi } from "@/app/utils/api";

export const dynamic = 'force-dynamic';

function CallbackWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        async function handleAuthCallback() {
            try {
                const existingSession = await fetchAuthSession();
                if (existingSession.tokens) {
                    router.push('/');
                    return;
                }

                await signInWithRedirect();
                const authSession = await fetchAuthSession();

                if (authSession.tokens) {
                    await getCurrentUser();
                    await fetchFromApi('/companies', 'POST');
                    router.push('/');
                }
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
