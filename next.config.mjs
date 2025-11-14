/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiBaseUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL
    if (!apiBaseUrl) {
      console.warn('BACKEND_API_URL/NEXT_PUBLIC_API_URL not configured; API rewrites disabled.')
      return []
    }
    
    return [
      // 代理 API，確保尾斜線保留
      // 教師端路由：維持 /api/v2/teacher/* 直通至後端 /api/v2/teacher/*
      { source: '/api/v2/teacher/:path*/', destination: `${apiBaseUrl}/api/v2/teacher/:path*/` },
      { source: '/api/v2/teacher/:path*', destination: `${apiBaseUrl}/api/v2/teacher/:path*/` },
      { source: '/_api/v2/:path*/', destination: `${apiBaseUrl}/api/v2/:path*/` },
      { source: '/_api/v2/:path*', destination: `${apiBaseUrl}/api/v2/:path*/` },
      // 備援：舊路徑
      { source: '/api/v2/:path*/', destination: `${apiBaseUrl}/api/v2/:path*/` },
      { source: '/api/v2/:path*', destination: `${apiBaseUrl}/api/v2/:path*/` },
      // OAuth Google URL 路由
      { source: '/api/oauth/:path*/', destination: `${apiBaseUrl}/api/oauth/:path*/` },
      { source: '/api/oauth/:path*', destination: `${apiBaseUrl}/api/oauth/:path*/` },
      // Onboard（預註冊）與 CSRF 路由
      { source: '/api/onboard/:path*/', destination: `${apiBaseUrl}/api/onboard/:path*/` },
      { source: '/api/onboard/:path*', destination: `${apiBaseUrl}/api/onboard/:path*/` },
      { source: '/api/csrf/', destination: `${apiBaseUrl}/api/csrf/` },
      { source: '/api/csrf', destination: `${apiBaseUrl}/api/csrf/` },
      // 通用 API 路由（放在最後作為備援）
      { source: '/api/:path*/', destination: `${apiBaseUrl}/api/:path*/` },
      { source: '/api/:path*', destination: `${apiBaseUrl}/api/:path*/` },
      // 媒體檔案
      { source: '/media/:path*', destination: `${apiBaseUrl}/media/:path*` },
    ]
  },
  async headers() {
    return [
      {
        source: '/_api/v2/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/api/v2/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

export default nextConfig
