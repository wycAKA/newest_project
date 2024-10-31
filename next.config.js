/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Amplifyのホスティング用の設定
    generateBuildId: async () => {
        return 'build'
    },
    // トレーシング設定を追加
    experimental: {
        outputFileTracingRoot: undefined,
        outputFileTracingIncludes: {
            '/**/*': ['node_modules/**/*'],
        },
    }
};

module.exports = nextConfig;
