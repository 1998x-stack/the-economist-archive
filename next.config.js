/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/the-economist-archive',
  assetPrefix: '/the-economist-archive',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
