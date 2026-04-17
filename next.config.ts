/** @type {import('next').NextConfig} */
const nextConfig = {
  // Farcaster Mini Apps run in iframes — allow embedding
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },

  // Next.js 16 uses Turbopack by default — empty config silences warning
  turbopack: {},
};

export default nextConfig;
