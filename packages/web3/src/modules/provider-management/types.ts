/**
 * Provider Management Types
 * 
 * Complete type definitions for provider registration, verification,
 * and management operations in the Aarovia medical platform.
 */

import { ethers } from 'ethers';

// =============================================
// CORE PROVIDER TYPES
// =============================================

/**
 * Provider types supported by the system
 */
export enum ProviderType {
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  SPECIALIST = 'SPECIALIST',
  HOSPITAL = 'HOSPITAL',
  CLINIC = 'CLINIC',
  LAB = 'LAB',
  PHARMACY = 'PHARMACY',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER'
}

/**
 * Provider verification status
 */
export enum ProviderVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Provider profile as stored on blockchain
 */
export interface ProviderProfileContract {
  providerWallet: string;
  providerId: string;
  providerDetailsCID: string;
  providerType: ProviderType;
  isVerified: boolean;
  verificationTimestamp: number;
  registrationTimestamp: number;
  isActive: boolean;
}

// =============================================
// PROVIDER REGISTRATION TYPES
// =============================================

/**
 * Personal information for provider registration
 */
export interface ProviderPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  profilePicture?: string;
  languages?: string[];
}

/**
 * Professional credentials and information
 */
export interface ProviderProfessionalInfo {
  licenseNumber: string;
  licenseState: string;
  licenseExpiryDate: string;
  medicalSchool?: string;
  graduationYear?: number;
  residencyProgram?: string;
  boardCertifications?: string[];
  specialties: string[];
  yearsOfExperience: number;
  npiNumber?: string; // National Provider Identifier
  deaNumber?: string; // DEA registration number
}

/**
 * Practice/workplace information
 */
export interface ProviderPracticeInfo {
  practiceName: string;
  practiceAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  practicePhone: string;
  practiceEmail?: string;
  practiceWebsite?: string;
  hospitalAffiliations?: string[];
  acceptedInsurances?: string[];
  telemedicineAvailable: boolean;
}

/**
 * Service and availability information
 */
export interface ProviderServiceInfo {
  servicesOffered: string[];
  consultationFee?: number;
  acceptingNewPatients: boolean;
  availableHours?: {
    monday?: { start: string; end: string; };
    tuesday?: { start: string; end: string; };
    wednesday?: { start: string; end: string; };
    thursday?: { start: string; end: string; };
    friday?: { start: string; end: string; };
    saturday?: { start: string; end: string; };
    sunday?: { start: string; end: string; };
  };
  emergencyAvailable: boolean;
}

/**
 * Complete provider data for IPFS storage
 */
export interface ProviderDetailsIPFS {
  personalInfo: ProviderPersonalInfo;
  professionalInfo: ProviderProfessionalInfo;
  practiceInfo: ProviderPracticeInfo;
  serviceInfo: ProviderServiceInfo;
  additionalNotes?: string;
  lastUpdated: string;
  version: string;
}

// =============================================
// REQUEST/RESPONSE TYPES
// =============================================

/**
 * Provider registration request
 */
export interface ProviderRegistrationRequest {
  providerType: ProviderType;
  personalInfo: ProviderPersonalInfo;
  professionalInfo: ProviderProfessionalInfo;
  practiceInfo: ProviderPracticeInfo;
  serviceInfo: ProviderServiceInfo;
  additionalNotes?: string;
}

/**
 * Provider profile update request
 */
export interface ProviderProfileUpdateRequest {
  personalInfo?: Partial<ProviderPersonalInfo>;
  professionalInfo?: Partial<ProviderProfessionalInfo>;
  practiceInfo?: Partial<ProviderPracticeInfo>;
  serviceInfo?: Partial<ProviderServiceInfo>;
  additionalNotes?: string;
}

/**
 * Provider lookup parameters
 */
export interface ProviderLookupParams {
  providerAddress?: string;
  providerId?: string;
  licenseNumber?: string;
  npiNumber?: string;
}

/**
 * Provider verification request (admin only)
 */
export interface ProviderVerificationRequest {
  providerAddress: string;
  verificationStatus: ProviderVerificationStatus;
  verificationNotes?: string;
  verifiedBy: string;
}

// =============================================
// RESPONSE TYPES
// =============================================

/**
 * Provider registration response
 */
export interface ProviderRegistrationResponse {
  success: boolean;
  provider_id: string;
  provider_wallet: string;
  provider_type: ProviderType;
  ipfs_cid: string;
  transaction_hash: string;
  gas_used: number;
  block_number: number;
  registration_timestamp: number;
  message: string;
  errors?: string[];
}

/**
 * Provider profile update response
 */
export interface ProviderProfileUpdateResponse {
  success: boolean;
  provider_id: string;
  old_ipfs_cid: string;
  new_ipfs_cid: string;
  transaction_hash: string;
  gas_used: number;
  block_number: number;
  update_timestamp: number;
  message: string;
  errors?: string[];
}

/**
 * Provider profile retrieval response
 */
export interface ProviderProfileResponse {
  success: boolean;
  provider_profile: ProviderProfileContract;
  provider_details: ProviderDetailsIPFS;
  verification_status: ProviderVerificationStatus;
  last_updated: number;
  message: string;
  errors?: string[];
}

/**
 * Provider verification response
 */
export interface ProviderVerificationResponse {
  success: boolean;
  provider_address: string;
  provider_id: string;
  verification_status: ProviderVerificationStatus;
  transaction_hash: string;
  verification_timestamp: number;
  verified_by: string;
  message: string;
  errors?: string[];
}

// =============================================
// CONTRACT INTERACTION TYPES
// =============================================

/**
 * Parameters for provider registration contract call
 */
export interface ProviderRegistrationParams {
  providerDetailsCID: string;
  providerType: ProviderType;
}

/**
 * Parameters for provider profile update contract call
 */
export interface ProviderProfileUpdateParams {
  newProviderDetailsCID: string;
}

/**
 * Parameters for provider verification contract call
 */
export interface ProviderVerificationParams {
  providerAddress: string;
}

// =============================================
// EVENT TYPES
// =============================================

/**
 * Provider registered event
 */
export interface ProviderRegisteredEvent {
  providerWallet: string;
  providerId: string;
  providerDetailsCID: string;
  providerType: ProviderType;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

/**
 * Provider profile updated event
 */
export interface ProviderProfileUpdatedEvent {
  providerWallet: string;
  providerId: string;
  oldProviderDetailsCID: string;
  newProviderDetailsCID: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

/**
 * Provider verified event
 */
export interface ProviderVerifiedEvent {
  providerAddress: string;
  providerId: string;
  verifiedBy: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

// =============================================
// CONFIGURATION TYPES
// =============================================

/**
 * Provider management configuration
 */
export interface ProviderManagementConfig {
  contract_address: string;
  ipfs_gateway: string;
  encryption_enabled: boolean;
  auto_backup: boolean;
  verification_required: boolean;
  event_listening: boolean;
  gas_limit: number;
  confirmation_blocks: number;
  admin_addresses: string[];
}

// =============================================
// ERROR TYPES
// =============================================

/**
 * Provider management error types
 */
export enum ProviderManagementError {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  IPFS_ERROR = 'IPFS_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  PROVIDER_ALREADY_EXISTS = 'PROVIDER_ALREADY_EXISTS',
  INVALID_PROVIDER_TYPE = 'INVALID_PROVIDER_TYPE',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

/**
 * Provider management exception class
 */
export class ProviderManagementException extends Error {
  public readonly errorType: ProviderManagementError;
  public readonly context?: any;
  public readonly timestamp: number;

  constructor(
    errorType: ProviderManagementError,
    message: string,
    context?: any
  ) {
    super(message);
    this.name = 'ProviderManagementException';
    this.errorType = errorType;
    this.context = context;
    this.timestamp = Date.now();
  }
}

// =============================================
// UTILITY TYPES
// =============================================

/**
 * Provider search filters
 */
export interface ProviderSearchFilters {
  providerType?: ProviderType;
  specialty?: string;
  location?: {
    state?: string;
    city?: string;
    zipCode?: string;
    radius?: number; // in miles
  };
  acceptingNewPatients?: boolean;
  telemedicineAvailable?: boolean;
  verificationStatus?: ProviderVerificationStatus;
  insuranceAccepted?: string[];
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * IPFS upload result for providers
 */
export interface ProviderIPFSUploadResult {
  cid: string;
  size: number;
  hash: string;
  pinned: boolean;
  timestamp: number;
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