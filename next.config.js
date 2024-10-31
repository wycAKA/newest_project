/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: true,
    },
    // Amplifyのホスティング用の設定
    generateBuildId: async () => {
        return 'build'
    }
};

module.exports = nextConfig;
