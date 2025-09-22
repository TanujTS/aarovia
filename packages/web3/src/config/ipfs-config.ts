/**
 * IPFS/Filecoin Configuration for Medical Records Platform
 */

import { StorageProvider, StorageConfig } from '../ipfs.js';

// Environment-based configuration
export interface IPFSEnvironmentConfig {
  development: StorageConfig[];
  staging: StorageConfig[];
  production: StorageConfig[];
}

// Default IPFS configurations for different environments
export const IPFS_CONFIGS: IPFSEnvironmentConfig = {
  development: [
    {
      provider: StorageProvider.IPFS,
      apiUrl: 'http://127.0.0.1:5001',
      gatewayUrl: 'http://127.0.0.1:8080/ipfs/',
    },
    {
      provider: StorageProvider.INFURA,
      apiUrl: 'https://ipfs.infura.io:5001',
      gatewayUrl: 'https://ipfs.io/ipfs/',
      projectId: process.env.INFURA_PROJECT_ID,
      secretKey: process.env.INFURA_SECRET_KEY,
    }
  ],
  staging: [
    {
      provider: StorageProvider.PINATA,
      apiUrl: 'https://api.pinata.cloud',
      gatewayUrl: 'https://gateway.pinata.cloud/ipfs/',
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
    },
    {
      provider: StorageProvider.INFURA,
      apiUrl: 'https://ipfs.infura.io:5001',
      gatewayUrl: 'https://ipfs.io/ipfs/',
      projectId: process.env.INFURA_PROJECT_ID,
      secretKey: process.env.INFURA_SECRET_KEY,
    }
  ],
  production: [
    {
      provider: StorageProvider.PINATA,
      apiUrl: 'https://api.pinata.cloud',
      gatewayUrl: 'https://gateway.pinata.cloud/ipfs/',
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
    },
    {
      provider: StorageProvider.WEB3_STORAGE,
      apiUrl: 'https://api.web3.storage',
      gatewayUrl: 'https://w3s.link/ipfs/',
      apiKey: process.env.WEB3_STORAGE_TOKEN,
    }
  ]
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  MEDICAL_IMAGE: 50 * 1024 * 1024,      // 50MB for medical images
  DOCUMENT_PDF: 20 * 1024 * 1024,       // 20MB for PDF documents
  LAB_RESULT: 10 * 1024 * 1024,         // 10MB for lab results
  PRESCRIPTION: 5 * 1024 * 1024,        // 5MB for prescriptions
  JSON_METADATA: 1 * 1024 * 1024,       // 1MB for JSON metadata
  DEFAULT: 10 * 1024 * 1024             // 10MB default
};

// Allowed MIME types for different file categories
export const ALLOWED_MIME_TYPES = {
  MEDICAL_IMAGES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'application/dicom'  // DICOM medical images
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ],
  DATA: [
    'application/json',
    'application/xml',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

// Security settings
export const SECURITY_CONFIG = {
  ENCRYPT_SENSITIVE_DATA: true,
  ENCRYPT_MEDICAL_IMAGES: true,
  ENCRYPT_LAB_RESULTS: true,
  ENCRYPT_PRESCRIPTIONS: false, // Usually semi-public
  ENCRYPT_PROVIDER_PROFILES: false, // Usually public information
  DEFAULT_ENCRYPTION: true,
  
  // Key rotation settings (in milliseconds)
  ENCRYPTION_KEY_ROTATION_INTERVAL: 30 * 24 * 60 * 60 * 1000, // 30 days
  
  // Backup settings
  ENABLE_MULTIPLE_PROVIDERS: true,
  MIN_BACKUP_COPIES: 2,
  
  // Pinning settings
  AUTO_PIN_MEDICAL_RECORDS: true,
  AUTO_PIN_CRITICAL_DATA: true,
  PIN_EXPIRY_DAYS: 365 // 1 year
};

// Performance settings
export const PERFORMANCE_CONFIG = {
  CONCURRENT_UPLOADS: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  TIMEOUT: 30000, // 30 seconds
  
  // Compression settings
  ENABLE_COMPRESSION: true,
  COMPRESSION_THRESHOLD: 1024 * 1024, // 1MB - compress files larger than this
  
  // Caching
  ENABLE_GATEWAY_CACHE: true,
  CACHE_TTL: 3600 // 1 hour
};

// Get configuration for current environment
export function getIPFSConfig(): StorageConfig[] {
  const env = process.env.NODE_ENV || 'development';
  return IPFS_CONFIGS[env as keyof IPFSEnvironmentConfig] || IPFS_CONFIGS.development;
}

// Get primary storage provider configuration
export function getPrimaryStorageConfig(): StorageConfig {
  const configs = getIPFSConfig();
  return configs[0]; // First config is primary
}

// Get backup storage providers
export function getBackupStorageConfigs(): StorageConfig[] {
  const configs = getIPFSConfig();
  return configs.slice(1); // All configs except the first
}

// Validate environment variables
export function validateEnvironmentConfig(): {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
} {
  const missingVars: string[] = [];
  const warnings: string[] = [];
  
  const configs = getIPFSConfig();
  
  for (const config of configs) {
    switch (config.provider) {
      case StorageProvider.PINATA:
        if (!config.apiKey) missingVars.push('PINATA_API_KEY');
        if (!config.secretKey) missingVars.push('PINATA_SECRET_KEY');
        break;
        
      case StorageProvider.INFURA:
        if (!config.projectId) missingVars.push('INFURA_PROJECT_ID');
        if (!config.secretKey) missingVars.push('INFURA_SECRET_KEY');
        break;
        
      case StorageProvider.WEB3_STORAGE:
        if (!config.apiKey) missingVars.push('WEB3_STORAGE_TOKEN');
        break;
        
      case StorageProvider.IPFS:
        if (config.apiUrl?.includes('127.0.0.1')) {
          warnings.push('Using local IPFS node - ensure it\'s running');
        }
        break;
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings
  };
}

// Helper function to get file size limit for a specific file type
export function getFileSizeLimit(mimeType: string): number {
  if (ALLOWED_MIME_TYPES.MEDICAL_IMAGES.includes(mimeType)) {
    return FILE_SIZE_LIMITS.MEDICAL_IMAGE;
  }
  
  if (ALLOWED_MIME_TYPES.DOCUMENTS.includes(mimeType)) {
    return FILE_SIZE_LIMITS.DOCUMENT_PDF;
  }
  
  if (mimeType === 'application/json') {
    return FILE_SIZE_LIMITS.JSON_METADATA;
  }
  
  return FILE_SIZE_LIMITS.DEFAULT;
}

// Helper function to check if file type is allowed
export function isFileTypeAllowed(mimeType: string): boolean {
  const allAllowedTypes = [
    ...ALLOWED_MIME_TYPES.MEDICAL_IMAGES,
    ...ALLOWED_MIME_TYPES.DOCUMENTS,
    ...ALLOWED_MIME_TYPES.DATA
  ];
  
  return allAllowedTypes.includes(mimeType);
}

// Helper function to determine if file should be encrypted
export function shouldEncryptFile(fileType: string, isSensitive: boolean = false): boolean {
  if (isSensitive || SECURITY_CONFIG.DEFAULT_ENCRYPTION) {
    return true;
  }
  
  switch (fileType) {
    case 'medical-image':
      return SECURITY_CONFIG.ENCRYPT_MEDICAL_IMAGES;
    case 'lab-result':
      return SECURITY_CONFIG.ENCRYPT_LAB_RESULTS;
    case 'prescription':
      return SECURITY_CONFIG.ENCRYPT_PRESCRIPTIONS;
    case 'provider-profile':
      return SECURITY_CONFIG.ENCRYPT_PROVIDER_PROFILES;
    default:
      return SECURITY_CONFIG.DEFAULT_ENCRYPTION;
  }
}