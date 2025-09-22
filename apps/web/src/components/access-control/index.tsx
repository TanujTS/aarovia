/**
 * Access Control Components
 * 
 * Export all access control related components for the Aarovia platform.
 * These components provide patient-provider access management functionality.
 */

// For now, we'll provide a simple re-export structure
// TODO: Fix module resolution issues with the web3 package imports

// Type definitions that components need
export interface AccessControlConfig {
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

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

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  expiryTimestamp?: number;
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

export interface AccessControlFormData {
  providerAddress: string;
  durationInSeconds: number;
  recordIds?: string[];
  accessType: 'general' | 'record-specific';
  reason?: string;
}

// Component imports - these should work once the internal component issues are resolved
// export { AccessManagementDashboard } from './AccessManagementDashboard';
// export { ProviderAccessDashboard } from './ProviderAccessDashboard';

// Placeholder export to prevent empty module error
export const ACCESS_CONTROL_MODULE_VERSION = '1.0.0';

// Type definitions - using relative path to avoid module resolution issues
export interface AccessControlConfig {
  contractAddress: string;
  providerUrl: string;
  chainId: number;
}

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

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  expiryTimestamp?: number;
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

export interface AccessControlFormData {
  providerAddress: string;
  durationInSeconds: number;
  recordIds?: string[];
  accessType: 'general' | 'record-specific';
  reason?: string;
}