//entry control
/**
 * Patient Management Module
 * 
 * Complete patient management solution with blockchain and IPFS integration
 * for the Aarovia medical records platform.
 */

// =============================================
// MAIN SERVICE CLASS
// =============================================
export { PatientService, createPatientService, createReadOnlyPatientService } from './PatientService';

// =============================================
// CONTRACT INTERACTION
// =============================================
export { PatientRegistryContract, PATIENT_REGISTRY_ABI } from './PatientRegistryContract';

// =============================================
// IPFS DATA HANDLING
// =============================================
export { 
  PatientIPFSHandler,
  uploadPatientDetailsToIPFS,
  fetchPatientDetailsFromIPFS
} from './PatientIPFSHandler';

// =============================================
// VALIDATION UTILITIES
// =============================================
export {
  validatePatientProfile,
  validatePatientRegistrationRequest,
  validatePatientProfileUpdateRequest,
  validateIPFSCID,
  validatePatientIPFSData,
  sanitizePatientProfile
} from './validation';

// =============================================
// TYPE DEFINITIONS
// =============================================
export type {
  // Contract types
  PatientProfileContract,
  PatientRegistrationParams,
  PatientProfileUpdateParams,
  
  // Event types
  PatientRegisteredEvent,
  PatientProfileUpdatedEvent,
  
  // IPFS types
  PatientDetailsIPFS,
  PatientRegistrationRequest,
  PatientProfileUpdateRequest,
  
  // Service response types
  PatientRegistrationResponse,
  PatientProfileUpdateResponse,
  PatientProfileResponse,
  
  // Utility types
  PatientLookupParams,
  BatchPatientOperation,
  PatientManagementConfig,
  
  // Error types
  PatientManagementException
} from './types';

export { PatientManagementError } from './types';

export type {
  ValidationResult,
  ValidationError
} from './validation';

// =============================================
// MODULE INFORMATION
// =============================================
export const PATIENT_MANAGEMENT_VERSION = '1.0.0';
export const MODULE_NAME = 'patient-management';

/**
 * Patient Management Module Features:
 * 
 * ✅ Patient Registration with IPFS & Blockchain
 * ✅ Profile Updates with Version Control
 * ✅ Complete Data Retrieval (Blockchain + IPFS)
 * ✅ Comprehensive Validation
 * ✅ Batch Operations Support
 * ✅ Event Monitoring
 * ✅ Data Integrity Verification
 * ✅ Gas Cost Estimation
 * ✅ Encryption Support
 * ✅ Error Handling & Logging
 */