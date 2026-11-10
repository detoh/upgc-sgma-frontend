/** @type {import('next').NextConfig} */
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  allowedDevOrigins: [
    'http://localhost:3001',
    'http://192.168.1.131:3001',
    'https://spindle-other-impotency.ngrok-free.dev',
  ],
};

module.exports = nextConfig;