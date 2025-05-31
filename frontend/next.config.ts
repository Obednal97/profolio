import withMDX from '@next/mdx';
import type { NextConfig } from 'next';

const withMDXConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
    // Note: providerImportSource is no longer needed in MDX v3
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  typescript: {
    // Allow production builds to successfully complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default withMDXConfig(nextConfig);