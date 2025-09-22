/**
 * Medical Record Management Types
 * 
 * Complete type definitions for medical record upload, metadata management,
 * file handling, and IPFS operations in the Aarovia medical platform.
 */

import { ethers } from 'ethers';

// =============================================
// CORE MEDICAL RECORD TYPES
// =============================================

/**
 * Medical record types supported by the system
 */
export enum MedicalRecordType {
  LAB_RESULT = 'LAB_RESULT',
  IMAGING_REPORT = 'IMAGING_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  CONSULTATION_NOTES = 'CONSULTATION_NOTES',
  SURGERY_RECORD = 'SURGERY_RECORD',
  MENTAL_HEALTH_RECORD = 'MENTAL_HEALTH_RECORD',
  GENETIC_TEST_RECORD = 'GENETIC_TEST_RECORD',
  VACCINATION_RECORD = 'VACCINATION_RECORD',
  ALLERGY_RECORD = 'ALLERGY_RECORD',
  MEDICATION_LIST = 'MEDICATION_LIST',
  VITAL_SIGNS = 'VITAL_SIGNS',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  REFERRAL = 'REFERRAL',
  INSURANCE_CLAIM = 'INSURANCE_CLAIM',
  OTHER = 'OTHER'
}

/**
 * File types for medical record attachments
 */
export enum MedicalFileType {
  PDF = 'PDF',
  IMAGE_JPEG = 'IMAGE_JPEG',
  IMAGE_PNG = 'IMAGE_PNG',
  DICOM = 'DICOM',
  X_RAY = 'X_RAY',
  MRI = 'MRI',
  CT_SCAN = 'CT_SCAN',
  ULTRASOUND = 'ULTRASOUND',
  ECG = 'ECG',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  CSV = 'CSV',
  JSON = 'JSON',
  XML = 'XML',
  OTHER = 'OTHER'
}

/**
 * Medical record sensitivity levels
 */
export enum RecordSensitivityLevel {
  PUBLIC = 0,
  STANDARD = 1,
  SENSITIVE = 2,
  HIGHLY_SENSITIVE = 3,
  RESTRICTED = 4
}

/**
 * Medical record metadata as stored on blockchain
 */
export interface MedicalRecordMetadata {
  recordId: string;
  patientId: string;
  providerId: string;
  recordType: MedicalRecordType;
  recordTitle: string;
  recordCID: string;
  isSensitive: boolean;
  sensitivityLevel: RecordSensitivityLevel;
  uploadTimestamp: number;
  lastUpdated: number;
  isActive: boolean;
  accessCount: number;
  fileCount: number;
  totalSize: number;
}

// =============================================
// MEDICAL RECORD CONTENT TYPES
// =============================================

/**
 * Medical record file attachment (already uploaded)
 */
export interface MedicalRecordAttachment {
  fileName: string;
  fileType: MedicalFileType;
  mimeType: string;
  fileCID: string;
  fileSize: number;
  uploadDate: string;
  description?: string;
  thumbnailCID?: string;
  checksumHash: string;
}

/**
 * Medical file for upload (before IPFS upload)
 */
export interface MedicalFileUpload {
  fileName: string;
  fileType: MedicalFileType;
  mimeType: string;
  content: Buffer;
  size: number;
  description?: string;
}

/**
 * Complete medical record data for IPFS storage
 */
export interface MedicalRecordIPFSData {
  recordId: string;
  recordType: MedicalRecordType;
  recordTitle: string;
  recordDescription?: string;
  patientId: string;
  providerId: string;
  createdDate: string;
  lastUpdated: string;
  
  // Clinical data
  clinicalData: {
    symptoms?: string[];
    diagnosis?: string[];
    treatments?: string[];
    medications?: {
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
      endDate?: string;
    }[];
    vitalSigns?: {
      temperature?: number;
      bloodPressure?: string;
      heartRate?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
    };
    labResults?: {
      testName: string;
      value: string;
      normalRange: string;
      unit: string;
      flagged: boolean;
    }[];
    notes?: string;
  };
  
  // File attachments
  attachments: MedicalRecordAttachment[];
  
  // Security and compliance
  securityInfo: {
    encryptionLevel: RecordSensitivityLevel;
    accessRestrictions: string[];
    complianceFlags: string[];
    auditTrail: {
      action: string;
      timestamp: string;
      userId: string;
      ipAddress?: string;
    }[];
  };
  
  // Metadata
  metadata: {
    version: string;
    lastModifiedBy: string;
    tags: string[];
    categories: string[];
    language: string;
    timeZone: string;
    location?: {
      facilityName: string;
      address: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

// =============================================
// REQUEST/RESPONSE TYPES
// =============================================

/**
 * Medical record upload request
 */
export interface MedicalRecordUploadRequest {
  patientId: string;
  providerId: string;
  recordType: MedicalRecordType;
  recordTitle: string;
  recordDescription?: string;
  isSensitive: boolean;
  sensitivityLevel: RecordSensitivityLevel;
  
  // Clinical data
  clinicalData: {
    symptoms?: string[];
    diagnosis?: string[];
    treatments?: string[];
    medications?: any[];
    vitalSigns?: any;
    labResults?: any[];
    notes?: string;
  };
  
  // Files to upload
  files: {
    file: File | Buffer;
    fileName: string;
    fileType: MedicalFileType;
    description?: string;
  }[];
  
  // Additional metadata
  tags?: string[];
  categories?: string[];
  location?: {
    facilityName: string;
    address: string;
  };
}

/**
 * Medical record update request
 */
export interface MedicalRecordUpdateRequest {
  recordId: string;
  recordTitle?: string;
  recordDescription?: string;
  clinicalData?: any;
  additionalFiles?: {
    file: File | Buffer;
    fileName: string;
    fileType: MedicalFileType;
    description?: string;
  }[];
  tags?: string[];
  notes?: string;
}

/**
 * Medical record search parameters
 */
export interface MedicalRecordSearchParams {
  patientId?: string;
  providerId?: string;
  recordType?: MedicalRecordType;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  sensitivityLevel?: RecordSensitivityLevel;
  tags?: string[];
  categories?: string[];
  limit?: number;
  offset?: number;
}

// =============================================
// RESPONSE TYPES
// =============================================

/**
 * Medical record upload response
 */
export interface MedicalRecordUploadResponse {
  success: boolean;
  recordId: string;
  patientId: string;
  providerId: string;
  recordCID: string;
  fileCIDs: string[];
  transactionHash: string;
  gasUsed: number;
  blockNumber: number;
  uploadTimestamp: number;
  totalSize: number;
  fileCount: number;
  message: string;
  errors?: string[];
}

/**
 * Medical record retrieval response
 */
export interface MedicalRecordRetrievalResponse {
  success: boolean;
  recordMetadata: MedicalRecordMetadata;
  recordData: MedicalRecordIPFSData;
  retrievedAt: number;
  message: string;
  errors?: string[];
}

/**
 * File retrieval response
 */
export interface MedicalFileRetrievalResponse {
  success: boolean;
  fileName: string;
  fileType: MedicalFileType;
  mimeType: string;
  fileSize: number;
  fileContent: Blob | Buffer;
  checksumVerified: boolean;
  retrievedAt: number;
  message: string;
  errors?: string[];
}

/**
 * Medical record list response
 */
export interface MedicalRecordListResponse {
  success: boolean;
  records: MedicalRecordMetadata[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
  message: string;
  errors?: string[];
}

// =============================================
// CONTRACT INTERACTION TYPES
// =============================================

/**
 * Parameters for medical record upload contract call
 */
export interface MedicalRecordContractUploadParams {
  patientId: string;
  providerId: string;
  recordType: MedicalRecordType;
  recordTitle: string;
  recordCID: string;
  isSensitive: boolean;
}

/**
 * Parameters for record CID update contract call
 */
export interface RecordCIDUpdateParams {
  recordId: string;
  newRecordCID: string;
}

// =============================================
// EVENT TYPES
// =============================================

/**
 * Record uploaded event
 */
export interface RecordUploadedEvent {
  recordId: string;
  patientId: string;
  providerId: string;
  recordType: MedicalRecordType;
  recordCID: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Record CID updated event
 */
export interface RecordCIDUpdatedEvent {
  recordId: string;
  oldRecordCID: string;
  newRecordCID: string;
  updatedBy: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Record accessed event
 */
export interface RecordAccessedEvent {
  recordId: string;
  accessedBy: string;
  accessType: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

// =============================================
// IPFS RESULT TYPES
// =============================================

/**
 * IPFS file upload result
 */
export interface MedicalFileIPFSUploadResult {
  fileCID: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksumHash: string;
  uploadTimestamp: number;
  pinned: boolean;
}

/**
 * IPFS metadata upload result
 */
export interface MedicalRecordMetadataIPFSUploadResult {
  recordCID: string;
  metadataSize: number;
  fileCIDs: string[];
  uploadTimestamp: number;
  pinned: boolean;
  version: string;
}

// =============================================
// CONFIGURATION TYPES
// =============================================

/**
 * Medical record management configuration
 */
export interface MedicalRecordManagementConfig {
  contractAddress: string;
  ipfsGateway: string;
  encryptionEnabled: boolean;
  maxFileSize: number; // in bytes
  maxFilesPerRecord: number;
  allowedFileTypes: MedicalFileType[];
  compressionEnabled: boolean;
  thumbnailGeneration: boolean;
  auditLogging: boolean;
  gasLimit: number;
  confirmationBlocks: number;
}

// =============================================
// ERROR TYPES
// =============================================

/**
 * Medical record management error types
 */
export enum MedicalRecordManagementError {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  IPFS_ERROR = 'IPFS_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PRIVACY_VIOLATION = 'PRIVACY_VIOLATION',
  COMPLIANCE_ERROR = 'COMPLIANCE_ERROR',
  CHECKSUMFAILED = 'CHECKSUM_FAILED'
}

/**
 * Medical record management exception class
 */
export class MedicalRecordManagementException extends Error {
  public readonly errorType: MedicalRecordManagementError;
  public readonly context?: any;
  public readonly timestamp: number;

  constructor(
    errorType: MedicalRecordManagementError,
    message: string,
    context?: any
  ) {
    super(message);
    this.name = 'MedicalRecordManagementException';
    this.errorType = errorType;
    this.context = context;
    this.timestamp = Date.now();
  }
}

// =============================================
// UTILITY TYPES
// =============================================

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileType: MedicalFileType;
  errors: string[];
  warnings: string[];
}

/**
 * Gas estimation result
 */
export interface GasEstimationResult {
  estimatedGas: number;
  gasPrice: bigint;
  totalCost: bigint;
  totalCostETH: string;
}

/**
 * IPFS pin status
 */
export interface IPFSPinStatus {
  cid: string;
  pinned: boolean;
  pinDate?: string;
  size?: number;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  action: string;
  timestamp: string;
  userId: string;
  userRole: string;
  recordId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Medical record access permissions
 */
export interface RecordAccessPermissions {
  recordId: string;
  userId: string;
  userRole: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
  restrictions: string[];
  expiresAt?: string;
  grantedBy: string;
  grantedAt: string;
}

/**
 * Encryption metadata
 */
export interface EncryptionMetadata {
  algorithm: string;
  keyId: string;
  ivParameterSpec?: string;
  encryptedBy: string;
  encryptedAt: string;
  keyRotationDate?: string;
}

/**
 * File compression metadata
 */
export interface CompressionMetadata {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressedAt: string;
}

/**
 * Medical record statistics
 */
export interface MedicalRecordStatistics {
  totalRecords: number;
  recordsByType: Record<MedicalRecordType, number>;
  totalFileSize: number;
  averageFileSize: number;
  mostRecentUpload: string;
  oldestRecord: string;
  accessCount: number;
  storageUsed: string;
}

/**
 * HIPAA compliance metadata
 */
export interface HIPAAComplianceMetadata {
  covered: boolean;
  businessAssociate: boolean;
  minimumNecessary: boolean;
  auditTrailRequired: boolean;
  encryptionRequired: boolean;
  accessLogRequired: boolean;
  retentionPeriod: number; // in years
  disposalMethod: string;
  complianceOfficer: string;
  lastComplianceCheck: string;
}

// =============================================
// IPFS HANDLER TYPES
// =============================================

/**
 * IPFS upload result
 */
export interface IPFSUploadResult {
  success: boolean;
  cid: string;
  size: number;
  fileCount: number;
  uploadDuration: number;
  processedFiles: {
    fileName: string;
    fileType: MedicalFileType;
    size: number;
    checksum: string;
    encrypted: boolean;
    compressed: boolean;
  }[];
  error?: string;
  metadata?: {
    uploadedAt: string;
    pinataResponse?: any;
  };
}

/**
 * IPFS retrieval result
 */
export interface IPFSRetrievalResult<T> {
  success: boolean;
  data: T | null;
  size: number;
  retrievalDuration: number;
  error?: string;
  metadata?: {
    fetchedAt: string;
    cid?: string;
    checksum?: string;
    version?: string;
    fileName?: string;
    originalSize?: number;
    fileType?: MedicalFileType;
    encrypted?: boolean;
    compressed?: boolean;
  };
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  encrypt?: boolean;
  compress?: boolean;
  generateThumbnail?: boolean;
  validateChecksum?: boolean;
}

/**
 * IPFS upload options
 */
export interface IPFSUploadOptions {
  processingOptions?: FileProcessingOptions;
  uploaderAddress?: string;
  metadata?: {
    name?: string;
    keyvalues?: Record<string, string>;
  };
  pinataOptions?: {
    cidVersion?: number;
    wrapWithDirectory?: boolean;
  };
}

/**
 * IPFS retrieval options
 */
export interface IPFSRetrievalOptions {
  decrypt?: boolean;
  decompress?: boolean;
  verifyChecksum?: boolean;
  timeout?: number;
}

/**
 * Encryption result
 */
export interface EncryptionResult {
  encryptedData: Buffer;
  iv: string;
  algorithm: string;
}

/**
 * Decryption result
 */
export interface DecryptionResult {
  decryptedData: Buffer;
  algorithm: string;
}

/**
 * Compression result
 */
export interface CompressionResult {
  compressedData: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: string;
}

/**
 * Checksum result
 */
export interface ChecksumResult {
  checksum: string;
  algorithm: string;
  verified: boolean;
}