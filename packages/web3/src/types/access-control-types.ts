/**
 * Access Control Types
 * 
 * TypeScript interfaces and types for the AccessControl smart contract
 * and related access management functionality.
 */

// =============================================
// ENUMS (matching smart contract)
// =============================================

export enum RecordType {
  General = 0,
  Diagnostic = 1,
  Prescription = 2,
  LabResult = 3,
  Imaging = 4,
  Surgery = 5,
  Mental = 6,
  Genetic = 7
}

export enum Role {
  None = 0,
  Patient = 1,
  Doctor = 2,
  Nurse = 3,
  Lab = 4,
  Pharmacy = 5,
  Emergency = 6,
  Admin = 7
}

export enum ConsentType {
  Full = 0,      // Full access to all record details
  Limited = 1,   // Limited access (metadata only)
  Emergency = 2, // Emergency access override
  Research = 3   // Research access (anonymized)
}

// =============================================
// BASIC INTERFACES
// =============================================

export interface AccessControlConfig {
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

export interface AccessRequest {
  recordId: string;
  providerAddress: string;
  durationInSeconds: number;
  reason?: string;
}

export interface GeneralAccessRequest {
  patientId: string;
  providerAddress: string;
  durationInSeconds: number;
  reason?: string;
}

export interface AccessRevocationRequest {
  recordId?: string;
  patientId?: string;
  providerAddress: string;
  reason?: string;
}

// =============================================
// CONSENT MANAGEMENT
// =============================================

export interface Consent {
  patientId: string;
  grantedTo: string;
  consentType: ConsentType;
  allowedRecordTypes: RecordType[];
  expiryTimestamp: number;
  isActive: boolean;
  createdAt: number;
}

export interface ConsentRequest {
  patientId: string;
  grantedTo: string;
  consentType: ConsentType;
  allowedRecordTypes: RecordType[];
  expiryTimestamp: number;
}

// =============================================
// ACCESS CONTROL RESPONSES
// =============================================

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  expiryTimestamp?: number;
}

export interface ProvidersWithAccessResult {
  providers: string[];
  totalCount: number;
}

export interface PatientsGrantedAccessResult {
  patients: string[];
  totalCount: number;
}

export interface AccessGrantResult {
  success: boolean;
  transactionHash: string;
  expiryTimestamp: number;
  error?: string;
}

export interface AccessRevokeResult {
  success: boolean;
  transactionHash: string;
  error?: string;
}

// =============================================
// PROVIDER ACCESS MANAGEMENT
// =============================================

export interface ProviderAccessInfo {
  providerAddress: string;
  expiryTimestamp: number;
  grantedAt: number;
  isActive: boolean;
  accessType: 'general' | 'record-specific';
  recordIds?: string[];
}

export interface PatientAccessInfo {
  patientId: string;
  expiryTimestamp: number;
  grantedAt: number;
  isActive: boolean;
  accessType: 'general' | 'record-specific';
  recordIds?: string[];
}

// =============================================
// FRONTEND UI TYPES
// =============================================

export interface AccessManagementUIState {
  isLoading: boolean;
  error: string | null;
  selectedProvider: string | null;
  selectedPatient: string | null;
  providersWithAccess: ProviderAccessInfo[];
  patientsWithAccess: PatientAccessInfo[];
}

export interface AccessControlFormData {
  providerAddress: string;
  durationInSeconds: number;
  recordIds?: string[];
  accessType: 'general' | 'record-specific';
  reason?: string;
}

// =============================================
// EVENT TYPES (matching smart contract events)
// =============================================

export interface AccessGrantedEvent {
  recordId: string;
  patientId: string;
  providerAddress: string;
  expiryTimestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface AccessRevokedEvent {
  recordId: string;
  patientId: string;
  providerAddress: string;
  blockNumber: number;
  transactionHash: string;
}

export interface GeneralAccessGrantedEvent {
  patientId: string;
  providerAddress: string;
  expiryTimestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface GeneralAccessRevokedEvent {
  patientId: string;
  providerAddress: string;
  blockNumber: number;
  transactionHash: string;
}

// =============================================
// ERROR TYPES
// =============================================

export enum AccessControlError {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_DURATION = 'INVALID_DURATION',
  ACCESS_NOT_FOUND = 'ACCESS_NOT_FOUND',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class AccessControlException extends Error {
  constructor(
    public errorType: AccessControlError,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AccessControlException';
  }
}

// =============================================
// VALIDATION TYPES
// =============================================

export interface AccessValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AccessControlValidationRules {
  requireValidAddress: boolean;
  requirePositiveDuration: boolean;
  requireValidRecordId: boolean;
  maxDurationDays?: number;
  allowedRoles?: Role[];
}

// =============================================
// PAGINATION AND FILTERING
// =============================================

export interface AccessListFilter {
  patientId?: string;
  providerAddress?: string;
  isActive?: boolean;
  accessType?: 'general' | 'record-specific';
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginatedAccessResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =============================================
// AUDIT AND LOGGING
// =============================================

export interface AccessAuditLog {
  id: string;
  action: 'grant' | 'revoke' | 'check';
  patientId: string;
  providerAddress: string;
  recordId?: string;
  timestamp: number;
  transactionHash?: string;
  result: 'success' | 'failure';
  reason?: string;
  userAddress: string;
}

export interface AccessAnalytics {
  totalAccessRequests: number;
  grantedRequests: number;
  revokedRequests: number;
  activeAccesses: number;
  topProviders: { address: string; accessCount: number }[];
  accessTrends: { date: string; count: number }[];
}