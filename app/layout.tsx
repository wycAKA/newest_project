import type {Metadata} from "next";
import {Inter} from "next/font/google";
import '@aws-amplify/ui-react/styles.css';
import '@/app/globals.css';
import {I18nProvider} from '@/app/i18n';
import ClientLayout from '@/app/components/ClientLayout';

const inter = Inter({
    subsets: ["latin", "latin-ext"],
    display: "swap",
    preload: true,
    variable: '--font-inter'
});

export const metadata: Metadata = {
    title: "YOLO JAPAN - Chat App",
    description: "",
    icons: {
        icon: '/favicon.svg',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ja" suppressHydrationWarning className={inter.variable}>
        <body className={`${inter.className} antialiased min-h-screen`}>
        <ClientLayout>
            <I18nProvider>{children}</I18nProvider>
        </ClientLayout>
        </body>
        </html>
    );
}
