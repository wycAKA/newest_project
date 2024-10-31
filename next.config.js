/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone', // 静的エクスポートを無効化
    images: {
        unoptimized: true,
    },
}

module.exports = nextConfig
