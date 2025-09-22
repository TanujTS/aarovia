/**
 * Patient Management Module - Type Definitions
 * 
 * Defines all TypeScript interfaces and types for patient management
 * including blockchain interactions and IPFS data structures.
 */

import { PatientProfile } from '../../types/medical-data-types.js';

// =============================================
// BLOCKCHAIN CONTRACT TYPES
// =============================================

/**
 * Patient profile structure as stored on the blockchain
 */
export interface PatientProfileContract {
  patientId: string;
  patientWallet: string;
  medicalProfileCID: string;
  isActive: boolean;
  registrationTimestamp: number;
}

/**
 * Patient registration parameters for blockchain transaction
 */
export interface PatientRegistrationParams {
  patientDetailsCID: string;
  patientWallet?: string; // Optional, will use connected wallet if not provided
}

/**
 * Patient profile update parameters for blockchain transaction
 */
export interface PatientProfileUpdateParams {
  newPatientDetailsCID: string;
  patientWallet?: string; // Optional, will use connected wallet if not provided
}

// =============================================
// BLOCKCHAIN EVENT TYPES
// =============================================

/**
 * PatientRegistered event emitted by PatientRegistry.sol
 */
export interface PatientRegisteredEvent {
  patientWallet: string;
  patientId: string;
  patientDetailsCID: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

/**
 * PatientProfileUpdated event emitted by PatientRegistry.sol
 */
export interface PatientProfileUpdatedEvent {
  patientWallet: string;
  patientId: string;
  newPatientDetailsCID: string;
  previousCID: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

// =============================================
// IPFS DATA TYPES
// =============================================

/**
 * Patient details structure for IPFS storage
 * This extends the base PatientProfile with additional metadata
 */
export interface PatientDetailsIPFS extends PatientProfile {
  // Metadata added during IPFS storage
  ipfs_metadata: {
    uploaded_at: string;
    version: string;
    encryption_status: 'encrypted' | 'plain';
    file_size: number;
    content_hash: string;
  };
  
  // Optional additional fields for patient dashboard
  preferences?: {
    privacy_level: 'public' | 'private' | 'selective';
    notification_settings: {
      email_notifications: boolean;
      sms_notifications: boolean;
      push_notifications: boolean;
    };
    data_sharing_consent: {
      research_participation: boolean;
      anonymous_analytics: boolean;
      third_party_sharing: boolean;
    };
  };
}

/**
 * Patient registration request (before IPFS upload)
 */
export interface PatientRegistrationRequest {
  patient_data: Omit<PatientProfile, 'patient_id'>;
  encryption_key?: string;
  privacy_settings?: PatientDetailsIPFS['preferences'];
}

/**
 * Patient profile update request (before IPFS upload)
 */
export interface PatientProfileUpdateRequest {
  updated_data: Partial<PatientProfile>;
  encryption_key?: string;
  privacy_settings?: Partial<PatientDetailsIPFS['preferences']>;
}

// =============================================
// SERVICE RESPONSE TYPES
// =============================================

/**
 * Response from patient registration operation
 */
export interface PatientRegistrationResponse {
  success: boolean;
  patient_id: string;
  patient_wallet: string;
  ipfs_cid: string;
  transaction_hash: string;
  block_number: number;
  gas_used: string;
  registration_timestamp: number;
  error?: string;
}

/**
 * Response from patient profile update operation
 */
export interface PatientProfileUpdateResponse {
  success: boolean;
  patient_id: string;
  patient_wallet: string;
  new_ipfs_cid: string;
  previous_cid: string;
  transaction_hash: string;
  block_number: number;
  gas_used: string;
  update_timestamp: number;
  error?: string;
}

/**
 * Response from patient profile retrieval operation
 */
export interface PatientProfileResponse {
  success: boolean;
  patient_profile: PatientDetailsIPFS | null;
  blockchain_data: PatientProfileContract | null;
  ipfs_cid: string;
  last_updated: number;
  error?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

/**
 * Patient search/lookup parameters
 */
export interface PatientLookupParams {
  patient_wallet?: string;
  patient_id?: string;
  include_ipfs_data?: boolean;
}

/**
 * Batch patient operations
 */
export interface BatchPatientOperation {
  operation_type: 'register' | 'update' | 'retrieve';
  patients: (PatientRegistrationRequest | PatientProfileUpdateRequest | PatientLookupParams)[];
}

/**
 * Patient management configuration
 */
export interface PatientManagementConfig {
  contract_address: string;
  ipfs_gateway: string;
  encryption_enabled: boolean;
  auto_backup: boolean;
  event_listening: boolean;
  gas_limit: number;
  confirmation_blocks: number;
}

// =============================================
// ERROR TYPES
// =============================================

export enum PatientManagementError {
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  PATIENT_ALREADY_EXISTS = 'PATIENT_ALREADY_EXISTS',
  INVALID_PATIENT_DATA = 'INVALID_PATIENT_DATA',
  IPFS_UPLOAD_FAILED = 'IPFS_UPLOAD_FAILED',
  IPFS_FETCH_FAILED = 'IPFS_FETCH_FAILED',
  BLOCKCHAIN_TRANSACTION_FAILED = 'BLOCKCHAIN_TRANSACTION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface PatientManagementException {
  code: PatientManagementError;
  message: string;
  details?: any;
  timestamp: number;
}