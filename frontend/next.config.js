/* eslint-disable */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// Read version from package.json
const { version } = require('./package.json');

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },
  
  // Basic optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/app/dashboard',
        permanent: false,
      },
    ];
  },
  
  // API proxy for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

module.exports = withMDX(nextConfig);