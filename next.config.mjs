/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["./node_modules/@swc/helpers/**"],
  },
};

export default nextConfig;
