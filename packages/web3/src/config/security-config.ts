/**
 * Security Configuration Utility
 * Ensures all sensitive data comes from environment variables
 */

export interface SecurityConfig {
  pinata: {
    apiKey: string;
    secretKey: string;
    jwt?: string;
  };
  blockchain: {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
  };
  encryption: {
    defaultKey: string;
  };
}

/**
 * Validate and load security configuration from environment variables
 * Throws detailed errors if required variables are missing
 */
export function loadSecurityConfig(): SecurityConfig {
  const missing: string[] = [];
  
  // Check required Pinata variables
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;
  if (!pinataApiKey) missing.push('PINATA_API_KEY');
  if (!pinataSecretKey) missing.push('PINATA_SECRET_KEY');
  
  // Check required blockchain variables
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!rpcUrl) missing.push('RPC_URL');
  if (!privateKey) missing.push('PRIVATE_KEY');
  if (!contractAddress) missing.push('CONTRACT_ADDRESS');
  
  // Check encryption key
  const encryptionKey = process.env.DEFAULT_ENCRYPTION_KEY;
  if (!encryptionKey) missing.push('DEFAULT_ENCRYPTION_KEY');
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for reference.'
    );
  }
  
  // Validate private key format (after null check)
  if (!privateKey!.startsWith('0x') && privateKey!.length !== 64 && privateKey!.length !== 66) {
    throw new Error('PRIVATE_KEY must be a valid Ethereum private key (64 hex characters, optionally prefixed with 0x)');
  }
  
  // Validate encryption key length (after null check)
  if (encryptionKey!.length < 32) {
    throw new Error('DEFAULT_ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption');
  }
  
  return {
    pinata: {
      apiKey: pinataApiKey!,
      secretKey: pinataSecretKey!,
      jwt: process.env.PINATA_JWT
    },
    blockchain: {
      rpcUrl: rpcUrl!,
      privateKey: privateKey!,
      contractAddress: contractAddress!
    },
    encryption: {
      defaultKey: encryptionKey!
    }
  };
}

/**
 * Load configuration for IPFS-only operations (no blockchain required)
 */
export function loadIPFSConfig() {
  const missing: string[] = [];
  
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;
  if (!pinataApiKey) missing.push('PINATA_API_KEY');
  if (!pinataSecretKey) missing.push('PINATA_SECRET_KEY');
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required IPFS environment variables: ${missing.join(', ')}\n` +
      'Please set your Pinata credentials in the .env file.'
    );
  }
  
  return {
    pinataApiKey,
    pinataSecretKey,
    pinataJWT: process.env.PINATA_JWT
  };
}

/**
 * Check if we're in a development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get safe environment info for logging (without sensitive data)
 */
export function getSafeEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasPinataApiKey: !!process.env.PINATA_API_KEY,
    hasPinataSecretKey: !!process.env.PINATA_SECRET_KEY,
    hasPinataJWT: !!process.env.PINATA_JWT,
    hasRpcUrl: !!process.env.RPC_URL,
    hasPrivateKey: !!process.env.PRIVATE_KEY,
    hasContractAddress: !!process.env.CONTRACT_ADDRESS,
    hasEncryptionKey: !!process.env.DEFAULT_ENCRYPTION_KEY
  };
}

/**
 * Log environment status safely (no sensitive data exposed)
 */
export function logEnvironmentStatus() {
  const info = getSafeEnvInfo();
  console.log('🔐 Environment Configuration Status:');
  console.log(`   NODE_ENV: ${info.nodeEnv || 'not set'}`);
  console.log(`   PINATA_API_KEY: ${info.hasPinataApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   PINATA_SECRET_KEY: ${info.hasPinataSecretKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   PINATA_JWT: ${info.hasPinataJWT ? '✅ Set' : '⚠️  Optional'}`);
  console.log(`   RPC_URL: ${info.hasRpcUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   PRIVATE_KEY: ${info.hasPrivateKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   CONTRACT_ADDRESS: ${info.hasContractAddress ? '✅ Set' : '❌ Missing'}`);
  console.log(`   DEFAULT_ENCRYPTION_KEY: ${info.hasEncryptionKey ? '✅ Set' : '❌ Missing'}`);
}