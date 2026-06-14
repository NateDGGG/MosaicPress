/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // External content brings in images from arbitrary domains.
    // For a real deploy, prefer an allowlist or your own image proxy.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
