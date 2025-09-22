/**
 * Medical Record Management Module
 * 
 * A comprehensive blockchain-based medical record management system with IPFS storage,
 * end-to-end encryption, and HIPAA compliance features.
 * 
 * @author Aarovia Development Team
 * @version 1.0.0
 * 
 * Features:
 * - Secure medical record upload and retrieval
 * - IPFS-based decentralized file storage
 * - Ethereum smart contract integration
 * - End-to-end encryption for sensitive data
 * - Comprehensive validation and compliance checks
 * - File type support for all major medical formats
 * - Audit trails and access control
 * 
 * Usage:
 * ```typescript
 * import { MedicalRecordService, MedicalRecordType } from '@aarovia/web3/medical-record-management';
 * 
 * const service = new MedicalRecordService(
 *   signer,
 *   config,
 *   pinataJWT,
 *   pinataGateway,
 *   encryptionKey
 * );
 * 
 * // Upload a medical record
 * const result = await service.uploadMedicalRecord({
 *   patientId: '0x123...',
 *   providerId: '0x456...',
 *   recordType: MedicalRecordType.LAB_RESULT,
 *   recordTitle: 'Blood Test Results',
 *   files: [{ file: fileBuffer, fileName: 'results.pdf', fileType: 'PDF' }],
 *   isSensitive: true
 * });
 * ```
 */

// =============================================
// MAIN SERVICE EXPORTS
// =============================================

export { default as MedicalRecordService } from './MedicalRecordService';
export { MedicalRecordsContract, MEDICAL_RECORDS_ABI } from './MedicalRecordsContract';
export { default as MedicalRecordIPFSHandler } from './MedicalRecordIPFSHandler';
export { default as MedicalRecordValidator } from './validation';

// =============================================
// TYPE IMPORTS AND EXPORTS
// =============================================

// Import types for internal use
import {
  MedicalRecordType,
  MedicalFileType,
  RecordSensitivityLevel,
  MedicalRecordManagementError,
  MedicalRecordManagementConfig
} from './types';

// Core enums
export {
  MedicalRecordType,
  MedicalFileType,
  RecordSensitivityLevel,
  MedicalRecordManagementError
} from './types';

// Main interfaces
export type {
  MedicalRecordMetadata,
  MedicalRecordIPFSData,
  MedicalRecordAttachment,
  MedicalFileUpload,
  MedicalRecordManagementConfig
} from './types';

// Request/Response interfaces
export type {
  MedicalRecordUploadRequest,
  MedicalRecordUpdateRequest,
  MedicalRecordSearchParams,
  MedicalRecordUploadResponse,
  MedicalRecordRetrievalResponse,
  MedicalRecordListResponse,
  MedicalFileRetrievalResponse
} from './types';

// Contract interaction types
export type {
  MedicalRecordContractUploadParams,
  RecordCIDUpdateParams,
  RecordUploadedEvent,
  RecordCIDUpdatedEvent,
  RecordAccessedEvent
} from './types';

// Validation types
export type {
  ValidationResult,
  FileValidationResult,
  GasEstimationResult
} from './types';

// IPFS types
export type {
  IPFSUploadResult,
  IPFSRetrievalResult,
  IPFSUploadOptions,
  IPFSRetrievalOptions,
  FileProcessingOptions,
  EncryptionResult,
  CompressionResult
} from './types';

// Utility types
export type {
  EncryptionMetadata,
  CompressionMetadata,
  MedicalRecordStatistics,
  HIPAAComplianceMetadata,
  RecordAccessPermissions,
  AuditLogEntry
} from './types';

// Exception handling
export { MedicalRecordManagementException } from './types';

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Create a default medical record management configuration
 */
export function createDefaultConfig(contractAddress: string): MedicalRecordManagementConfig {
  return {
    contractAddress,
    ipfsGateway: 'https://gateway.pinata.cloud',
    encryptionEnabled: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFilesPerRecord: 20,
    allowedFileTypes: [
      MedicalFileType.PDF,
      MedicalFileType.IMAGE_JPEG,
      MedicalFileType.IMAGE_PNG,
      MedicalFileType.DICOM,
      MedicalFileType.X_RAY,
      MedicalFileType.MRI,
      MedicalFileType.CT_SCAN,
      MedicalFileType.ULTRASOUND,
      MedicalFileType.ECG,
      MedicalFileType.DOCUMENT,
      MedicalFileType.AUDIO,
      MedicalFileType.VIDEO,
      MedicalFileType.CSV,
      MedicalFileType.JSON,
      MedicalFileType.XML
    ],
    compressionEnabled: true,
    thumbnailGeneration: false,
    auditLogging: true,
    gasLimit: 500000,
    confirmationBlocks: 2
  };
}

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate if a string is a valid IPFS CID
 */
export function isValidIPFSCID(cid: string): boolean {
  // Basic CID validation - starts with Qm (CIDv0) or b (CIDv1 base32)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58})$/.test(cid);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Generate a secure random string for encryption keys
 */
export function generateSecureKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a medical record type requires special encryption
 */
export function requiresSpecialEncryption(recordType: MedicalRecordType): boolean {
  const sensitiveTypes = [
    MedicalRecordType.MENTAL_HEALTH_RECORD,
    MedicalRecordType.GENETIC_TEST_RECORD,
    MedicalRecordType.SURGERY_RECORD
  ];
  return sensitiveTypes.includes(recordType);
}

/**
 * Get recommended sensitivity level for a record type
 */
export function getRecommendedSensitivityLevel(recordType: MedicalRecordType): RecordSensitivityLevel {
  switch (recordType) {
    case MedicalRecordType.MENTAL_HEALTH_RECORD:
    case MedicalRecordType.GENETIC_TEST_RECORD:
      return RecordSensitivityLevel.HIGHLY_SENSITIVE;
    
    case MedicalRecordType.SURGERY_RECORD:
    case MedicalRecordType.LAB_RESULT:
    case MedicalRecordType.IMAGING_REPORT:
      return RecordSensitivityLevel.SENSITIVE;
    
    case MedicalRecordType.PRESCRIPTION:
    case MedicalRecordType.CONSULTATION_NOTES:
    case MedicalRecordType.ALLERGY_RECORD:
      return RecordSensitivityLevel.STANDARD;
    
    default:
      return RecordSensitivityLevel.STANDARD;
  }
}

/**
 * Convert medical record type enum to human-readable string
 */
export function medicalRecordTypeToString(recordType: MedicalRecordType): string {
  const typeMap: Record<MedicalRecordType, string> = {
    [MedicalRecordType.LAB_RESULT]: 'Laboratory Result',
    [MedicalRecordType.IMAGING_REPORT]: 'Imaging Report',
    [MedicalRecordType.PRESCRIPTION]: 'Prescription',
    [MedicalRecordType.CONSULTATION_NOTES]: 'Consultation Notes',
    [MedicalRecordType.SURGERY_RECORD]: 'Surgery Record',
    [MedicalRecordType.MENTAL_HEALTH_RECORD]: 'Mental Health Record',
    [MedicalRecordType.GENETIC_TEST_RECORD]: 'Genetic Test Record',
    [MedicalRecordType.VACCINATION_RECORD]: 'Vaccination Record',
    [MedicalRecordType.ALLERGY_RECORD]: 'Allergy Record',
    [MedicalRecordType.MEDICATION_LIST]: 'Medication List',
    [MedicalRecordType.VITAL_SIGNS]: 'Vital Signs',
    [MedicalRecordType.DISCHARGE_SUMMARY]: 'Discharge Summary',
    [MedicalRecordType.REFERRAL]: 'Referral',
    [MedicalRecordType.INSURANCE_CLAIM]: 'Insurance Claim',
    [MedicalRecordType.OTHER]: 'Other'
  };
  return typeMap[recordType] || 'Unknown';
}

/**
 * Convert file type enum to human-readable string
 */
export function medicalFileTypeToString(fileType: MedicalFileType): string {
  const typeMap: Record<MedicalFileType, string> = {
    [MedicalFileType.PDF]: 'PDF Document',
    [MedicalFileType.IMAGE_JPEG]: 'JPEG Image',
    [MedicalFileType.IMAGE_PNG]: 'PNG Image',
    [MedicalFileType.DICOM]: 'DICOM Medical Image',
    [MedicalFileType.X_RAY]: 'X-Ray Image',
    [MedicalFileType.MRI]: 'MRI Scan',
    [MedicalFileType.CT_SCAN]: 'CT Scan',
    [MedicalFileType.ULTRASOUND]: 'Ultrasound Image',
    [MedicalFileType.ECG]: 'Electrocardiogram',
    [MedicalFileType.DOCUMENT]: 'Text Document',
    [MedicalFileType.AUDIO]: 'Audio Recording',
    [MedicalFileType.VIDEO]: 'Video Recording',
    [MedicalFileType.CSV]: 'CSV Data File',
    [MedicalFileType.JSON]: 'JSON Data File',
    [MedicalFileType.XML]: 'XML Data File',
    [MedicalFileType.OTHER]: 'Other File Type'
  };
  return typeMap[fileType] || 'Unknown';
}

/**
 * Get MIME type for medical file type
 */
export function getMimeTypeForFileType(fileType: MedicalFileType): string {
  const mimeMap: Record<MedicalFileType, string> = {
    [MedicalFileType.PDF]: 'application/pdf',
    [MedicalFileType.IMAGE_JPEG]: 'image/jpeg',
    [MedicalFileType.IMAGE_PNG]: 'image/png',
    [MedicalFileType.DICOM]: 'application/dicom',
    [MedicalFileType.X_RAY]: 'application/dicom',
    [MedicalFileType.MRI]: 'application/dicom',
    [MedicalFileType.CT_SCAN]: 'application/dicom',
    [MedicalFileType.ULTRASOUND]: 'application/dicom',
    [MedicalFileType.ECG]: 'application/pdf',
    [MedicalFileType.DOCUMENT]: 'text/plain',
    [MedicalFileType.AUDIO]: 'audio/mpeg',
    [MedicalFileType.VIDEO]: 'video/mp4',
    [MedicalFileType.CSV]: 'text/csv',
    [MedicalFileType.JSON]: 'application/json',
    [MedicalFileType.XML]: 'application/xml',
    [MedicalFileType.OTHER]: 'application/octet-stream'
  };
  return mimeMap[fileType] || 'application/octet-stream';
}

// =============================================
// MODULE CONSTANTS
// =============================================

/**
 * Current version of the medical record management module
 */
export const VERSION = '1.0.0';

/**
 * Default IPFS gateway URL
 */
export const DEFAULT_IPFS_GATEWAY = 'https://gateway.pinata.cloud';

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Maximum files per record
 */
export const MAX_FILES_PER_RECORD = 20;

/**
 * Default gas limit for transactions
 */
export const DEFAULT_GAS_LIMIT = 500000;

/**
 * Supported medical file extensions
 */
export const SUPPORTED_MEDICAL_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.dcm', '.dicom',
  '.mp3', '.wav', '.mp4', '.avi', '.csv', '.json', '.xml'
];

/**
 * HIPAA compliance requirements
 */
export const HIPAA_REQUIREMENTS = {
  ENCRYPTION_REQUIRED: true,
  AUDIT_TRAIL_REQUIRED: true,
  ACCESS_CONTROLS_REQUIRED: true,
  RETENTION_PERIOD_YEARS: 6,
  DISPOSAL_METHOD: 'secure_deletion'
};

// =============================================
// MODULE DOCUMENTATION
// =============================================

/**
 * Medical Record Management Module Documentation
 * 
 * This module provides a complete solution for managing medical records on the blockchain
 * with IPFS storage. It includes:
 * 
 * ## Core Components:
 * 
 * ### MedicalRecordService
 * Main orchestrator class that coordinates all operations:
 * - Upload medical records with files
 * - Retrieve records and files
 * - Update existing records
 * - Search and filter records
 * - Gas estimation and transaction management
 * 
 * ### MedicalRecordsContract
 * Ethereum smart contract interface for:
 * - On-chain metadata storage
 * - Access control management
 * - Event emission and monitoring
 * - Gas optimization
 * 
 * ### MedicalRecordIPFSHandler
 * IPFS storage handler for:
 * - File upload and download
 * - Metadata management
 * - Encryption and compression
 * - Checksum verification
 * 
 * ### MedicalRecordValidator
 * Comprehensive validation system for:
 * - Input sanitization
 * - File type validation
 * - Size and format checks
 * - HIPAA compliance validation
 * 
 * ## Security Features:
 * 
 * - End-to-end encryption for sensitive data
 * - Access control and permissions
 * - Audit trails for all operations
 * - Checksum verification for data integrity
 * - HIPAA compliance checks
 * 
 * ## Supported File Types:
 * 
 * - Medical images (DICOM, X-Ray, MRI, CT, Ultrasound)
 * - Documents (PDF, DOC, TXT)
 * - Media files (Audio, Video)
 * - Data files (CSV, JSON, XML)
 * - Standard images (JPEG, PNG)
 * 
 * ## Usage Examples:
 * 
 * ```typescript
 * // Initialize service
 * const service = new MedicalRecordService(signer, config, pinataJWT, gateway, key);
 * 
 * // Upload a record
 * const uploadResult = await service.uploadMedicalRecord({
 *   patientId: "patient123",
 *   providerId: "provider456",
 *   recordType: MedicalRecordType.LAB_RESULT,
 *   recordTitle: "Blood Test Results",
 *   files: [{ file: fileBuffer, fileName: "results.pdf", fileType: MedicalFileType.PDF }],
 *   isSensitive: true,
 *   sensitivityLevel: RecordSensitivityLevel.SENSITIVE
 * });
 * 
 * // Retrieve a record
 * const record = await service.getMedicalRecord(uploadResult.recordId);
 * 
 * // Download a file
 * const fileData = await service.downloadMedicalFile(recordId, "results.pdf");
 * 
 * // Search patient records
 * const patientRecords = await service.getPatientRecords("patient123", {
 *   recordType: MedicalRecordType.LAB_RESULT,
 *   limit: 10
 * });
 * ```
 * 
 * For more detailed documentation, please refer to the individual class and method documentation.
 */