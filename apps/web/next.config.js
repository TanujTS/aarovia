/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@aarovia/types',
    '@aarovia/web3'
  ],
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '1',
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.infura.io/v3/your-key',
  },
};

module.exports = nextConfig;
