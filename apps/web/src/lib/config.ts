/**
 * Configuration for contract addresses and network settings
 * These values come from environment variables
 */

export const CONTRACT_ADDRESSES = {
  MEDICAL_RECORDS: process.env.NEXT_PUBLIC_MEDICAL_RECORDS_CONTRACT_ADDRESS as `0x${string}`,
  COUNTER: process.env.NEXT_PUBLIC_COUNTER_CONTRACT_ADDRESS as `0x${string}`,
} as const;

export const NETWORK_CONFIG = {
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111, // Default to Sepolia
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || '',
  BLOCK_EXPLORER_URL: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || 'https://sepolia.etherscan.io',
} as const;

export const IPFS_CONFIG = {
  GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
} as const;

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Validation function to ensure required environment variables are set
export function validateConfig() {
  const required = [
    'NEXT_PUBLIC_MEDICAL_RECORDS_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_RPC_URL',
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
