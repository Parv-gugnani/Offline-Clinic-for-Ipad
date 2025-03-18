/** @type {import('next').NextConfig} */

// Using dynamic import to avoid ESLint error
const nextPWA = async () => {
  const withPWA = (await import('next-pwa')).default({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  });

  return withPWA;
};

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      resolveAlias: {
        // Add any aliases if needed
      }
    }
  }
};

// Using CommonJS module.exports
module.exports = async () => {
  const withPWA = await nextPWA();
  return withPWA(nextConfig);
};
