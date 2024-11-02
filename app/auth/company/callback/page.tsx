"use client";

import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { ReactElement, useEffect } from "react";
import { fetchFromApi } from "@/app/utils/api";
import {configureAmplify} from "@/app/utils/amplifyConfig";
import Layout from "@/app/components/Layout";

export const dynamic = 'force-dynamic';

function CallbackWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        async function handleAuthCallback() {
            try {
                configureAmplify('company');
                const existingSession = await fetchAuthSession();
                console.log(existingSession);

                if (!existingSession.tokens) {
                    window.location.href = `${process.env.NEXT_PUBLIC_COMPANY_POOL_SIGNIN_URL}/?redirect_uri=${process.env.NEXT_PUBLIC_DOMAIN_URL}/auth/company/callback`;
                    return;
                }

                await fetchFromApi('/companies', 'POST');
                router.push('/users/channels');
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
        <Layout>
            <CallbackWrapper>
                <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Authenticating...
                        </h2>
                    </div>
                </div>
            </CallbackWrapper>
        </Layout>
    );
}
