// SECURITY: Comprehensive ESLint disables for Next.js config file requirements
/* eslint-disable @typescript-eslint/no-require-imports */

const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// 🚀 PERFORMANCE: Bundle analyzer available when needed
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

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

  // CONTAINER: Emit a self-contained server bundle for Docker images.
  // Gated on DOCKER_BUILD so `pnpm build` and `pnpm start` keep behaving
  // exactly as before outside of a container build.
  // outputFileTracingRoot must point at the pnpm workspace root, otherwise
  // Next traces from frontend/ and misses hoisted dependencies.
  ...(process.env.DOCKER_BUILD === "true" && {
    output: "standalone",
    outputFileTracingRoot: require("path").join(__dirname, "../"),
  }),

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

    // SECURITY: Restrict remote image sources in production.
    // `domains` was deprecated in Next 16 in favour of `remotePatterns`, which
    // also constrains protocol and path rather than just the hostname.
    ...(process.env.NODE_ENV === "production" && {
      remotePatterns: [
        { protocol: "https", hostname: "profolio.app" },
        { protocol: "http", hostname: "localhost" },
      ],
    }),

    // PERFORMANCE: Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // SECURITY: Security headers and optimizations
  poweredByHeader: false, // Hide framework information
  reactStrictMode: true, // Enable strict mode for better error detection
  trailingSlash: false, // Consistent URL structure

  // Build configuration.
  // The `eslint` key was removed in Next 16 - linting is no longer part of
  // `next build` and runs via the ESLint CLI instead (see package.json).
  typescript: {
    // Development: Use looser tsconfig for faster iteration
    // Production: Strict checking in CI/CD
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
    // Use dev config in development for faster builds
    ...(process.env.NODE_ENV === 'development' && {
      tsconfigPath: './tsconfig.dev.json',
    }),
  },

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
    return [
      {
        source: "/(.*)",
        headers: [
          // SECURITY: Prevent XSS attacks
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // SECURITY: Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // SECURITY: Control embedding in frames
          {
            key: "X-Frame-Options",
            value: "DENY",
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
        ],
      },
    ];
  },

  // DEVELOPMENT: Development-specific configuration
  ...(process.env.NODE_ENV === "development" && {
    // PERFORMANCE: Disable ETags in development to prevent caching issues
    generateEtags: false,

    // DEVELOPMENT: Allow cross-origin access for development
    allowedDevOrigins: ["192.168.1.69:3000"],
  }),

  // PERFORMANCE: Production optimizations
  ...(process.env.NODE_ENV === "production" && {
    // PERFORMANCE: Enable compression
    compress: true,
  }),

  // NAVIGATION: Application redirects
  async redirects() {
    return [
      {
        source: "/app",
        destination: "/app/dashboard",
        permanent: false, // Use temporary redirect for flexibility
      },
      // SECURITY: Redirect old auth routes to new structure
      {
        source: "/login",
        destination: "/auth/signIn",
        permanent: true,
      },
    ];
  },

  // API PROXY: Conditional backend proxy configuration
  // SECURITY: Only enable when explicitly configured and in development
  ...(process.env.ENABLE_API_PROXY === "true" &&
    process.env.NODE_ENV === "development" && {
      async rewrites() {
        // SECURITY: Validate backend URL before proxying
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

        // SECURITY: Basic URL validation
        if (
          !backendUrl.startsWith("http://localhost:") &&
          !backendUrl.startsWith("https://localhost:")
        ) {
          console.warn(
            "⚠️  Backend URL not localhost - proxy disabled for security"
          );
          return [];
        }

        return [
          {
            source: "/api/:path*",
            destination: `${backendUrl}/api/:path*`,
          },
        ];
      },
    }),

  // Bundle splitting is Turbopack's responsibility as of Next 16.
  //
  // A hand-tuned webpack `splitChunks` config used to live here, creating named
  // vendor/framer-motion/recharts/firebase/react chunks. Next 16 builds with
  // Turbopack, which ignores webpack config entirely, so it was dead weight
  // that only looked meaningful. Turbopack does this chunking automatically.
  //
  // Note the old named chunks were never reachable anyway: webpack emits
  // hashed filenames, so the `/_next/static/chunks/framer-motion.js` paths in
  // usePagePreloader never matched a real asset.
};

// QUALITY: Export with proper error handling
module.exports = withMDX(nextConfig);
