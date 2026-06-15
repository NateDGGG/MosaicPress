/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mosaic/core"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
export default nextConfig;
