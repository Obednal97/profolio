// SECURITY: Comprehensive ESLint disables for Next.js config file requirements
/* eslint-disable @typescript-eslint/no-require-imports */

const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// SECURITY: Safe package.json version reading with validation
let appVersion = "unknown";
try {
  const { version } = require("./package.json");
  // SECURITY: Validate version format to prevent injection
  if (version && typeof version === "string" && /^[\d\w\-\.]+$/.test(version)) {
    appVersion = version.slice(0, 50); // Limit length
  }
} catch (error) {
  console.warn("Failed to read version from package.json:", error.message);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SECURITY: Explicitly define allowed page extensions
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],

  // SECURITY: Controlled environment variable exposure
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },

  // PERFORMANCE: Enhanced image optimization with security considerations
  images: {
    // PERFORMANCE: Modern image formats for better compression
    formats: ["image/avif", "image/webp"],

    // SECURITY: Controlled SVG handling with explicit comment
    // Note: SVGs are required for icons and brand assets in the application
    // Risk is mitigated by only serving trusted SVGs from our domain
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // SECURITY: Restrict image domains for production
    ...(process.env.NODE_ENV === "production" && {
      domains: ["localhost", "profolio.app"], // Add your production domains
    }),

    // PERFORMANCE: Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // SECURITY: Security headers and optimizations
  poweredByHeader: false, // Hide framework information
  reactStrictMode: true,
  trailingSlash: false, // Consistent URL structure

  // PERFORMANCE: Experimental features for better performance
  experimental: {
    // PERFORMANCE: Enable modern bundling for better tree shaking
    esmExternals: true,

    // PERFORMANCE: CSS optimization with dependency management
    // Note: Next.js 15.3.3 requires "critters" internally for CSS inlining
    // We also have "beasties" (the maintained fork) for future compatibility
    ...(process.env.NODE_ENV === "production" && {
      optimizeCss: true,
    }),
  },

  // SECURITY: Content Security Policy headers
  async headers() {
    // Get hostname for production CSP
    const isDevelopment = process.env.NODE_ENV === "development";

    return [
      {
        source: "/(.*)",
        headers: [
          // SECURITY: Prevent XSS attacks
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // SECURITY: MIME type protection (less strict for better compatibility)
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // SECURITY: Control embedding in frames
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Changed from DENY to allow self-embedding
          },
          // SECURITY: Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // SECURITY: Permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // SECURITY: Enhanced Content Security Policy
          {
            key: "Content-Security-Policy",
            value: isDevelopment
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
      // Special handling for static assets
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = withMDX(nextConfig);