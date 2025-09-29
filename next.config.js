/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')(
  './i18n.config.ts'
);

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = withNextIntl(nextConfig)