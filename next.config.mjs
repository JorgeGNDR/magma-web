/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // There are no next/image consumers; do not expose an unused image optimizer.
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/**"],
  },
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "www.magmaestudio.com" }],
      destination: "https://magmaestudio.com/:path*",
      permanent: true,
    }];
  },
  async headers() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "dev.magmaestudio.com" }],
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    }, {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        // Narrow safeguards compatible with Next inline hydration, Draco workers
        // and Spotify. This is not a nonce-based script/XSS policy.
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://formsubmit.co; frame-src https://open.spotify.com" },
      ],
    }];
  },
};

export default nextConfig;
