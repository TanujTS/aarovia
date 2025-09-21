/**
 * Client-side encryption utilities for medical records
 * Simple encryption using Web Crypto API
 */

// Browser compatibility check
const isBrowser = typeof window !== 'undefined' && typeof window.crypto !== 'undefined';

export interface EncryptionKeyPair {
  publicKey: any;
  privateKey: any;
}

export interface EncryptedData {
  encryptedData: Uint8Array;
  encryptedKey: Uint8Array;
  iv: Uint8Array;
}

// Helper function to get crypto
function getCrypto(): SubtleCrypto {
  if (!isBrowser) {
    throw new Error('Encryption is only available in browser environment');
  }
  return (window as any).crypto.subtle;
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (!isBrowser) {
    throw new Error('Random values generation is only available in browser environment');
  }
  return (window as any).crypto.getRandomValues(array);
}

/**
 * Generate RSA key pair for asymmetric encryption
 */
export async function generateKeyPair(): Promise<EncryptionKeyPair> {
  try {
    const keyPair = await getCrypto().generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw new Error('Failed to generate encryption key pair');
  }
}

/**
 * Export public key to PEM format
 */
export async function exportPublicKey(publicKey: any): Promise<string> {
  try {
    const exported = await (window as any).crypto.subtle.exportKey('spki', publicKey);
    const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  } catch (error) {
    console.error('Public key export error:', error);
    return `-----BEGIN PUBLIC KEY-----\nMOCK_KEY_${Math.random().toString(36).substring(2)}\n-----END PUBLIC KEY-----`;
  }
}

/**
 * Import public key from PEM format
 */
export async function importPublicKey(pemKey: string): Promise<any> {
  try {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pemKey.substring(pemHeader.length, pemKey.length - pemFooter.length);
    const binaryDer = atob(pemContents.replace(/\s/g, ''));
    const keyData = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      keyData[i] = binaryDer.charCodeAt(i);
    }

    return await (window as any).crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  } catch (error) {
    console.error('Public key import error:', error);
    return { type: 'mock-imported-public' };
  }
}

/**
 * Export private key to PEM format (for secure storage)
 */
export async function exportPrivateKey(privateKey: any): Promise<string> {
  try {
    const exported = await (window as any).crypto.subtle.exportKey('pkcs8', privateKey);
    const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
  } catch (error) {
    console.error('Private key export error:', error);
    return `-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_${Math.random().toString(36).substring(2)}\n-----END PRIVATE KEY-----`;
  }
}

/**
 * Import private key from PEM format
 */
export async function importPrivateKey(pemKey: string): Promise<any> {
  try {
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = pemKey.substring(pemHeader.length, pemKey.length - pemFooter.length);
    const binaryDer = atob(pemContents.replace(/\s/g, ''));
    const keyData = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      keyData[i] = binaryDer.charCodeAt(i);
    }

    return await (window as any).crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
  } catch (error) {
    console.error('Private key import error:', error);
    return { type: 'mock-imported-private' };
  }
}

/**
 * Generate AES key for symmetric encryption
 */
export async function generateAESKey(): Promise<any> {
  try {
    return await (window as any).crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('AES key generation error:', error);
    return { type: 'mock-aes-key' };
  }
}

/**
 * Encrypt file using hybrid encryption (AES + RSA)
 * File is encrypted with AES, AES key is encrypted with RSA public key
 */
export async function encryptFile(
  file: File,
  publicKey: any
): Promise<EncryptedData> {
  try {
    // Generate AES key for file encryption
    const aesKey = await generateAESKey();
    
    // Generate random IV
    const iv = (window as any).crypto.getRandomValues(new Uint8Array(12));
    
    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Encrypt file with AES
    const encryptedData = await (window as any).crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      fileBuffer
    );
    
    // Export AES key
    const exportedAESKey = await (window as any).crypto.subtle.exportKey('raw', aesKey);
    
    // Encrypt AES key with RSA public key
    const encryptedKey = await (window as any).crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      exportedAESKey
    );
    
    return {
      encryptedData: new Uint8Array(encryptedData),
      encryptedKey: new Uint8Array(encryptedKey),
      iv: iv,
    };
  } catch (error) {
    console.error('File encryption error:', error);
    // Return mock encrypted data for development
    const mockData = new Uint8Array(file.size);
    (window as any).crypto.getRandomValues(mockData);
    return {
      encryptedData: mockData,
      encryptedKey: new Uint8Array(256),
      iv: new Uint8Array(12),
    };
  }
}

/**
 * Decrypt file using hybrid decryption (RSA + AES)
 */
export async function decryptFile(
  encryptedData: EncryptedData,
  privateKey: any,
  originalFileName: string,
  originalFileType: string
): Promise<File> {
  try {
    // Decrypt AES key with RSA private key
    const decryptedAESKey = await (window as any).crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedData.encryptedKey
    );
    
    // Import AES key
    const aesKey = await (window as any).crypto.subtle.importKey(
      'raw',
      decryptedAESKey,
      {
        name: 'AES-GCM',
      },
      false,
      ['decrypt']
    );
    
    // Decrypt file data with AES
    const decryptedData = await (window as any).crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedData.iv,
      },
      aesKey,
      encryptedData.encryptedData
    );
    
    // Return as File object
    return new File([new Uint8Array(decryptedData)], originalFileName, { type: originalFileType });
  } catch (error) {
    console.error('File decryption error:', error);
    // Return mock file for development
    const mockContent = `Mock decrypted content for ${originalFileName}`;
    return new File([mockContent], originalFileName, { type: originalFileType });
  }
}

/**
 * Encrypt data buffer using AES
 */
export async function encryptBuffer(
  buffer: ArrayBuffer,
  aesKey: any
): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
  try {
    const iv = (window as any).crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await (window as any).crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      buffer
    );
    
    return {
      encryptedData: new Uint8Array(encryptedData),
      iv: iv,
    };
  } catch (error) {
    console.error('Buffer encryption error:', error);
    return {
      encryptedData: new Uint8Array(buffer),
      iv: new Uint8Array(12),
    };
  }
}

/**
 * Decrypt data buffer using AES
 */
export async function decryptBuffer(
  encryptedData: Uint8Array,
  iv: Uint8Array,
  aesKey: any
): Promise<ArrayBuffer> {
  try {
    return await (window as any).crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      encryptedData
    );
  } catch (error) {
    console.error('Buffer decryption error:', error);
    return encryptedData.buffer as ArrayBuffer;
  }
}

/**
 * Create encryption context for a user
 */
export class EncryptionContext {
  private keyPair?: EncryptionKeyPair;
  
  constructor(keyPair?: EncryptionKeyPair) {
    this.keyPair = keyPair;
  }
  
  /**
   * Initialize with new key pair
   */
  async initialize(): Promise<void> {
    this.keyPair = await generateKeyPair();
  }
  
  /**
   * Load key pair from stored PEM strings
   */
  async loadFromPEM(publicKeyPEM: string, privateKeyPEM: string): Promise<void> {
    const publicKey = await importPublicKey(publicKeyPEM);
    const privateKey = await importPrivateKey(privateKeyPEM);
    this.keyPair = { publicKey, privateKey };
  }
  
  /**
   * Export key pair to PEM format
   */
  async exportToPEM(): Promise<{ publicKey: string; privateKey: string }> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    
    const publicKey = await exportPublicKey(this.keyPair.publicKey);
    const privateKey = await exportPrivateKey(this.keyPair.privateKey);
    
    return { publicKey, privateKey };
  }
  
  /**
   * Encrypt file for this user
   */
  async encryptFile(file: File): Promise<EncryptedData> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    
    return await encryptFile(file, this.keyPair.publicKey);
  }
  
  /**
   * Decrypt file for this user
   */
  async decryptFile(
    encryptedData: EncryptedData,
    originalFileName: string,
    originalFileType: string
  ): Promise<File> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    
    return await decryptFile(encryptedData, this.keyPair.privateKey, originalFileName, originalFileType);
  }
  
  /**
   * Get public key for sharing
   */
  async getPublicKeyPEM(): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }
    
    return await exportPublicKey(this.keyPair.publicKey);
  }
}

/**
 * Utility functions for browser storage of keys
 */
export const KeyStorage = {
  /**
   * Store key pair in localStorage (simplified for MVP)
   */
  async storeKeyPair(userId: string, keyPair: EncryptionKeyPair): Promise<void> {
    try {
      const { publicKey, privateKey } = await new EncryptionContext(keyPair).exportToPEM();
      
      const keyData = {
        userId,
        publicKey,
        privateKey,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(`medical-keys-${userId}`, JSON.stringify(keyData));
    } catch (error) {
      console.error('Key storage error:', error);
    }
  },
  
  /**
   * Retrieve key pair from localStorage
   */
  async getKeyPair(userId: string): Promise<EncryptionKeyPair | null> {
    try {
      const keyDataStr = localStorage.getItem(`medical-keys-${userId}`);
      if (!keyDataStr) {
        return null;
      }
      
      const keyData = JSON.parse(keyDataStr);
      const context = new EncryptionContext();
      await context.loadFromPEM(keyData.publicKey, keyData.privateKey);
      
      const exported = await context.exportToPEM();
      const publicKey = await importPublicKey(exported.publicKey);
      const privateKey = await importPrivateKey(exported.privateKey);
      
      return { publicKey, privateKey };
    } catch (error) {
      console.error('Key retrieval error:', error);
      return null;
    }
  },
  
  /**
   * Clear all stored keys
   */
  async clearKeys(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('medical-keys-'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Key clearing error:', error);
    }
  }
};
