/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // There are no next/image consumers; do not expose an unused image optimizer.
  images: { unoptimized: true },
  // HTTP headers and the canonical redirect live in deployment/apache.htaccess.
};

export default nextConfig;
