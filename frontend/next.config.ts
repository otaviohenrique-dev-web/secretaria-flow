/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Permite a comunicação com o pop-up do Google
          },
        ],
      },
    ];
  },
};

export default nextConfig;