/**
 * IPFS/Filecoin integration utilities for medical record storage
 * Supports JSON objects, binary files, encryption, and multiple storage providers
 */

import { create } from 'ipfs-http-client';
import CryptoJS from 'crypto-js';

// Storage provider types
export enum StorageProvider {
  IPFS = 'ipfs',
  PINATA = 'pinata',
  WEB3_STORAGE = 'web3-storage',
  INFURA = 'infura'
}

// File types for medical records
export enum FileType {
  MEDICAL_RECORD_JSON = 'medical-record-json',
  PROVIDER_PROFILE_JSON = 'provider-profile-json',
  PATIENT_PROFILE_JSON = 'patient-profile-json',
  INSTITUTION_PROFILE_JSON = 'institution-profile-json',
  ENCOUNTER_RECORD = 'encounter-record',
  LAB_RESULT = 'lab-result',
  IMAGING_REPORT = 'imaging-report',
  PRESCRIPTION = 'prescription',
  MENTAL_HEALTH_RECORD = 'mental-health-record',
  SURGERY_RECORD = 'surgery-record',
  GENETIC_TEST_RECORD = 'genetic-test-record',
  MEDICAL_IMAGE = 'medical-image',
  DOCUMENT_PDF = 'document-pdf',
  DICOM_IMAGE = 'dicom-image',
  X_RAY_IMAGE = 'x-ray-image',
  CONSULTATION_NOTES = 'consultation-notes',
  SCANNED_DOCUMENT = 'scanned-document',
  BINARY_FILE = 'binary-file'
}

// Enhanced interfaces
export interface IPFSFile {
  path: string;
  content: Uint8Array;
  size: number;
  mimeType?: string;
  encrypted?: boolean;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
  provider: StorageProvider;
  encrypted: boolean;
  fileType: FileType;
  timestamp: number;
}

export interface StorageConfig {
  provider: StorageProvider;
  apiKey?: string;
  secretKey?: string;
  projectId?: string;
  apiUrl?: string;
  gatewayUrl?: string;
}

// Import comprehensive medical data types
import {
  PatientProfile,
  ProviderProfile,
  MedicalRecord,
  EncounterRecord,
  LabResultRecord,
  ImagingReportRecord,
  PrescriptionRecord,
  MentalHealthRecord,
  SurgeryRecord,
  GeneticTestRecord,
  RawMedicalFile,
  InstitutionProfile
} from './types/medical-data-types.js';

// Legacy interface for backward compatibility
export interface MedicalRecordMetadata {
  recordId: string;
  patientId: string;
  providerId: string;
  recordType: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isSensitive: boolean;
  attachments?: {
    cid: string;
    filename: string;
    mimeType: string;
    size: number;
    encrypted: boolean;
  }[];
  version: string;
}

// Default storage configurations
const DEFAULT_CONFIGS: Record<StorageProvider, Partial<StorageConfig>> = {
  [StorageProvider.IPFS]: {
    apiUrl: 'http://127.0.0.1:5001',
    gatewayUrl: 'https://ipfs.io/ipfs/'
  },
  [StorageProvider.INFURA]: {
    apiUrl: 'https://ipfs.infura.io:5001',
    gatewayUrl: 'https://ipfs.io/ipfs/'
  },
  [StorageProvider.PINATA]: {
    apiUrl: 'https://api.pinata.cloud',
    gatewayUrl: 'https://gateway.pinata.cloud/ipfs/'
  },
  [StorageProvider.WEB3_STORAGE]: {
    apiUrl: 'https://api.web3.storage',
    gatewayUrl: 'https://w3s.link/ipfs/'
  }
};

/**
 * Enhanced IPFS client with multiple provider support
 */
export class IPFSClient {
  private config: StorageConfig;
  private ipfsClient?: any;

  constructor(config: StorageConfig) {
    this.config = { ...DEFAULT_CONFIGS[config.provider], ...config };
    
    if (config.provider === StorageProvider.IPFS || config.provider === StorageProvider.INFURA) {
      this.ipfsClient = create({
        url: this.config.apiUrl,
        headers: this.config.projectId ? {
          authorization: `Basic ${Buffer.from(`${this.config.projectId}:${this.config.secretKey}`).toString('base64')}`
        } : undefined
      });
    }
  }

  /**
   * Upload any file type to IPFS with encryption support
   */
  async uploadFile(
    file: File,
    fileType: FileType,
    encrypt: boolean = false,
    encryptionKey?: string
  ): Promise<IPFSUploadResult> {
    try {
      let processedFile = file;
      
      // Encrypt file if required
      if (encrypt) {
        if (!encryptionKey) {
          encryptionKey = this.generateEncryptionKey();
        }
        processedFile = await this.encryptFile(file, encryptionKey);
      }

      let result: any;
      
      switch (this.config.provider) {
        case StorageProvider.IPFS:
        case StorageProvider.INFURA:
          result = await this.uploadToIPFSNode(processedFile);
          break;
        case StorageProvider.PINATA:
          result = await this.uploadToPinata(processedFile);
          break;
        case StorageProvider.WEB3_STORAGE:
          result = await this.uploadToWeb3Storage(processedFile);
          break;
        default:
          throw new Error(`Unsupported storage provider: ${this.config.provider}`);
      }

      return {
        hash: result.hash,
        size: result.size,
        url: `${this.config.gatewayUrl}${result.hash}`,
        provider: this.config.provider,
        encrypted: encrypt,
        fileType,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Upload JSON object to IPFS
   */
  async uploadJSON(
    jsonData: any,
    fileType: FileType,
    encrypt: boolean = false,
    encryptionKey?: string
  ): Promise<IPFSUploadResult> {
    const jsonString = JSON.stringify(jsonData, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], `${fileType}.json`, { type: 'application/json' });
    
    return this.uploadFile(jsonFile, fileType, encrypt, encryptionKey);
  }

  /**
   * Upload patient profile
   */
  async uploadPatientProfile(
    profile: PatientProfile,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(profile, FileType.PATIENT_PROFILE_JSON, encrypt);
  }

  /**
   * Upload provider profile
   */
  async uploadProviderProfile(
    profile: ProviderProfile,
    encrypt: boolean = false
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(profile, FileType.PROVIDER_PROFILE_JSON, encrypt);
  }

  /**
   * Upload institution profile
   */
  async uploadInstitutionProfile(
    profile: InstitutionProfile,
    encrypt: boolean = false
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(profile, FileType.PROVIDER_PROFILE_JSON, encrypt);
  }

  /**
   * Upload encounter record
   */
  async uploadEncounterRecord(
    record: EncounterRecord,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload lab result record
   */
  async uploadLabResultRecord(
    record: LabResultRecord,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.LAB_RESULT, encrypt);
  }

  /**
   * Upload imaging report record
   */
  async uploadImagingReportRecord(
    record: ImagingReportRecord,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload prescription record
   */
  async uploadPrescriptionRecord(
    record: PrescriptionRecord,
    encrypt: boolean = false // Prescriptions are often semi-public
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.PRESCRIPTION, encrypt);
  }

  /**
   * Upload mental health record
   */
  async uploadMentalHealthRecord(
    record: MentalHealthRecord,
    encrypt: boolean = true // Mental health records are highly sensitive
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload surgery record
   */
  async uploadSurgeryRecord(
    record: SurgeryRecord,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload genetic test record
   */
  async uploadGeneticTestRecord(
    record: GeneticTestRecord,
    encrypt: boolean = true // Genetic data is highly sensitive
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload any medical record type
   */
  async uploadMedicalRecord(
    record: MedicalRecord,
    encrypt: boolean = true
  ): Promise<IPFSUploadResult> {
    return this.uploadJSON(record, FileType.MEDICAL_RECORD_JSON, encrypt);
  }

  /**
   * Upload raw medical file with metadata
   */
  async uploadRawMedicalFile(
    file: File,
    metadata: RawMedicalFile,
    encrypt: boolean = true
  ): Promise<{
    fileCID: string;
    metadataCID: string;
    fileUploadResult: IPFSUploadResult;
    metadataUploadResult: IPFSUploadResult;
  }> {
    // Upload the actual file
    const fileUploadResult = await this.uploadFile(
      file,
      this.getFileTypeFromCategory(metadata.file_category),
      encrypt
    );

    // Update metadata with file info
    const completeMetadata: RawMedicalFile = {
      ...metadata,
      file_size: file.size,
      upload_date: new Date().toISOString(),
      mime_type: file.type
    };

    // Upload the metadata
    const metadataUploadResult = await this.uploadJSON(
      completeMetadata,
      FileType.MEDICAL_RECORD_JSON,
      encrypt
    );

    return {
      fileCID: fileUploadResult.hash,
      metadataCID: metadataUploadResult.hash,
      fileUploadResult,
      metadataUploadResult
    };
  }

  /**
   * Download and decrypt file from IPFS
   */
  async downloadFile(
    hash: string,
    encrypted: boolean = false,
    encryptionKey?: string
  ): Promise<Blob> {
    try {
      const response = await fetch(`${this.config.gatewayUrl}${hash}`);
      
      if (!response.ok) {
        throw new Error(`IPFS download failed: ${response.statusText}`);
      }

      let blob = await response.blob();
      
      if (encrypted && encryptionKey) {
        blob = await this.decryptFile(blob, encryptionKey);
      }

      return blob;
    } catch (error) {
      console.error('IPFS download error:', error);
      throw error;
    }
  }

  /**
   * Download JSON data from IPFS
   */
  async downloadJSON<T = any>(
    hash: string,
    encrypted: boolean = false,
    encryptionKey?: string
  ): Promise<T> {
    const blob = await this.downloadFile(hash, encrypted, encryptionKey);
    const text = await blob.text();
    return JSON.parse(text);
  }

  /**
   * Pin content to ensure persistence
   */
  async pinContent(hash: string): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case StorageProvider.IPFS:
          if (this.ipfsClient) {
            await this.ipfsClient.pin.add(hash);
            return true;
          }
          break;
        case StorageProvider.PINATA:
          return this.pinToPinata(hash);
        default:
          console.warn(`Pinning not implemented for ${this.config.provider}`);
          return false;
      }
      return false;
    } catch (error) {
      console.error('Pinning error:', error);
      return false;
    }
  }

  // Private methods for different providers
  private async uploadToIPFSNode(file: File): Promise<{ hash: string; size: number }> {
    if (!this.ipfsClient) {
      throw new Error('IPFS client not initialized');
    }

    const fileBuffer = await file.arrayBuffer();
    const result = await this.ipfsClient.add({
      path: file.name,
      content: new Uint8Array(fileBuffer)
    });

    return {
      hash: result.cid.toString(),
      size: result.size
    };
  }

  private async uploadToPinata(file: File): Promise<{ hash: string; size: number }> {
    if (!this.config.apiKey || !this.config.secretKey) {
      throw new Error('Pinata API credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'medical-record',
        timestamp: Date.now().toString()
      }
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': this.config.apiKey,
        'pinata_secret_api_key': this.config.secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const result = await response.json() as { IpfsHash: string; PinSize: number };
    return {
      hash: result.IpfsHash,
      size: result.PinSize
    };
  }

  private async uploadToWeb3Storage(file: File): Promise<{ hash: string; size: number }> {
    // This would use the @web3-storage/w3up-client
    // For now, throw an error as it needs proper setup
    throw new Error('Web3.Storage upload not implemented - requires proper client setup');
  }

  private async pinToPinata(hash: string): Promise<boolean> {
    if (!this.config.apiKey || !this.config.secretKey) {
      return false;
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.config.apiKey,
        'pinata_secret_api_key': this.config.secretKey,
      },
      body: JSON.stringify({
        hashToPin: hash,
        pinataMetadata: {
          name: `medical-record-${hash}`,
        },
      }),
    });

    return response.ok;
  }

  // Encryption methods
  private async encryptFile(file: File, encryptionKey: string): Promise<File> {
    const fileBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
    const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey).toString();
    
    const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });
    return new File([encryptedBlob], `${file.name}.encrypted`, { type: 'application/octet-stream' });
  }

  private async decryptFile(encryptedBlob: Blob, encryptionKey: string): Promise<Blob> {
    const encryptedText = await encryptedBlob.text();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, encryptionKey);
    const decryptedArray = this.wordArrayToUint8Array(decrypted);
    
    return new Blob([decryptedArray]);
  }

  private wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
    const arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    const length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
    const uInt8Array = new Uint8Array(length);
    let index = 0;
    let word;
    let i;

    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  }

  private generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private getFileTypeFromCategory(category: RawMedicalFile['file_category']): FileType {
    switch (category) {
      case 'X_RAY':
      case 'MEDICAL_IMAGE':
        return FileType.MEDICAL_IMAGE;
      case 'LAB_REPORT':
        return FileType.LAB_RESULT;
      case 'CONSULTATION_NOTES':
      case 'SCANNED_DOCUMENT':
        return FileType.DOCUMENT_PDF;
      default:
        return FileType.BINARY_FILE;
    }
  }
}

/**
 * Legacy function for backward compatibility - now uses enhanced client
 */
export async function uploadToIPFS(
  file: File,
  apiUrl: string = 'https://ipfs.infura.io:5001',
  gatewayUrl: string = 'https://ipfs.io/ipfs/'
): Promise<IPFSUploadResult> {
  const client = new IPFSClient({
    provider: StorageProvider.INFURA,
    apiUrl,
    gatewayUrl
  });
  
  return client.uploadFile(file, FileType.BINARY_FILE, false);
}

/**
 * Legacy functions for backward compatibility
 */

/**
 * Download file from IPFS (legacy function)
 */
export async function downloadFromIPFS(
  hash: string,
  gatewayUrl: string = 'https://ipfs.io/ipfs/'
): Promise<Blob> {
  const client = new IPFSClient({
    provider: StorageProvider.IPFS,
    gatewayUrl
  });
  
  return client.downloadFile(hash, false);
}

/**
 * Pin file to IPFS using Pinata (legacy function)
 */
export async function pinToIPFS(
  hash: string,
  pinataApiKey?: string,
  pinataSecretKey?: string
): Promise<boolean> {
  if (!pinataApiKey || !pinataSecretKey) {
    console.warn('Pinata credentials not provided, skipping pinning');
    return false;
  }

  const client = new IPFSClient({
    provider: StorageProvider.PINATA,
    apiKey: pinataApiKey,
    secretKey: pinataSecretKey
  });
  
  return client.pinContent(hash);
}

/**
 * Get IPFS file info (legacy function)
 */
export async function getIPFSFileInfo(
  hash: string,
  apiUrl: string = 'https://ipfs.infura.io:5001'
): Promise<{ size: number; type: string } | null> {
  try {
    const response = await fetch(`${apiUrl}/api/v0/object/stat?arg=${hash}`);
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json() as { CumulativeSize: number };
    
    return {
      size: result.CumulativeSize,
      type: 'application/octet-stream' // IPFS doesn't store MIME types by default
    };
  } catch (error) {
    console.error('IPFS file info error:', error);
    return null;
  }
}

/**
 * Generate encryption key for file
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Utility functions for medical record handling
 */

/**
 * Create a standard medical record metadata object
 */
export function createMedicalRecordMetadata(
  recordId: string,
  patientId: string,
  providerId: string,
  recordType: string,
  title: string,
  isSensitive: boolean = false,
  description?: string
): MedicalRecordMetadata {
  return {
    recordId,
    patientId,
    providerId,
    recordType,
    title,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isSensitive,
    attachments: [],
    version: '1.0'
  };
}

/**
 * Create a standard provider profile object
 */
export function createProviderProfile(
  name: string,
  specialty: string,
  license_number: string,
  NPI_number: string,
  email: string,
  phone: string,
  address: {
    street: string;
    city: string;
    state_province: string;
    zip_code: string;
    country: string;
  }
): ProviderProfile {
  return {
    name,
    contact_info: {
      phone_number: phone,
      email,
      address
    },
    specialty,
    license_number,
    NPI_number
  };
}

/**
 * Create a standard patient profile object
 */
export function createPatientProfile(
  first_name: string,
  last_name: string,
  date_of_birth: string,
  gender: string,
  blood_type: string,
  contact_info: PatientProfile['contact_info'],
  emergency_contact: PatientProfile['emergency_contact'],
  insurance_information: PatientProfile['insurance_information']
): PatientProfile {
  return {
    first_name,
    last_name,
    date_of_birth,
    gender,
    blood_type,
    contact_info,
    emergency_contact,
    insurance_information,
    allergies: [],
    current_medications: [],
    past_medical_history: [],
    family_medical_history: [],
    lifestyle_factors: {
      smoking_status: '',
      alcohol_consumption: '',
      exercise_habits: '',
      dietary_preferences: ''
    }
  };
}

/**
 * Factory function to create IPFS client with common configurations
 */
export function createIPFSClient(provider: StorageProvider, config?: Partial<StorageConfig>): IPFSClient {
  return new IPFSClient({
    provider,
    ...config
  });
}

/**
 * Create Pinata IPFS client
 */
export function createPinataClient(apiKey: string, secretKey: string): IPFSClient {
  return new IPFSClient({
    provider: StorageProvider.PINATA,
    apiKey,
    secretKey
  });
}

/**
 * Create Infura IPFS client
 */
export function createInfuraClient(projectId: string, projectSecret: string): IPFSClient {
  return new IPFSClient({
    provider: StorageProvider.INFURA,
    projectId,
    secretKey: projectSecret
  });
}

/**
 * Validate CID format
 */
export function isValidCID(cid: string): boolean {
  // Basic CID validation - should start with Qm (v0) or b (v1) or f (v1)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|f[0-9a-f]{50,})$/.test(cid);
}

/**
 * Extract file extension from MIME type
 */
export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/json': 'json',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'text/plain': 'txt',
    'application/octet-stream': 'bin'
  };
  
  return mimeToExt[mimeType] || 'unknown';
}
