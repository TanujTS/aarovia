/**
 * Patient Management Validation Utilities
 * 
 * Validation functions for patient data, profile updates, and IPFS CID verification.
 */

import { PatientProfile } from '../../types/medical-data-types.js';
import {
  PatientDetailsIPFS,
  PatientRegistrationRequest,
  PatientProfileUpdateRequest,
  PatientManagementError
} from './types.js';

// =============================================
// VALIDATION RESULT TYPES
// =============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// =============================================
// PATIENT PROFILE VALIDATION
// =============================================

/**
 * Validate patient profile data
 * @param profile - Patient profile to validate
 * @returns Validation result with errors if any
 */
export function validatePatientProfile(profile: Partial<PatientProfile>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields validation
  if (!profile.first_name || profile.first_name.trim().length === 0) {
    errors.push({
      field: 'first_name',
      message: 'First name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!profile.last_name || profile.last_name.trim().length === 0) {
    errors.push({
      field: 'last_name',
      message: 'Last name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!profile.date_of_birth || profile.date_of_birth.trim().length === 0) {
    errors.push({
      field: 'date_of_birth',
      message: 'Date of birth is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!profile.gender || profile.gender.trim().length === 0) {
    errors.push({
      field: 'gender',
      message: 'Gender is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate date of birth format
  if (profile.date_of_birth && !isValidDateFormat(profile.date_of_birth)) {
    errors.push({
      field: 'date_of_birth',
      message: 'Date of birth must be in YYYY-MM-DD format',
      code: 'INVALID_FORMAT'
    });
  }

  // Validate email format if provided
  if (profile.contact_info?.email && !isValidEmail(profile.contact_info.email)) {
    errors.push({
      field: 'contact_info.email',
      message: 'Invalid email format',
      code: 'INVALID_FORMAT'
    });
  }

  // Validate phone number format if provided
  if (profile.contact_info?.phone_number && !isValidPhoneNumber(profile.contact_info.phone_number)) {
    errors.push({
      field: 'contact_info.phone_number',
      message: 'Invalid phone number format',
      code: 'INVALID_FORMAT'
    });
  }

  // Validate gender options
  const validGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
  if (profile.gender && !validGenders.includes(profile.gender.toUpperCase())) {
    errors.push({
      field: 'gender',
      message: 'Gender must be one of: Male, Female, Other, Prefer not to say',
      code: 'INVALID_VALUE'
    });
  }

  // Validate blood type if provided
  const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (profile.blood_type && !validBloodTypes.includes(profile.blood_type)) {
    errors.push({
      field: 'blood_type',
      message: 'Invalid blood type',
      code: 'INVALID_VALUE'
    });
  }

  // Validate address if provided
  if (profile.contact_info?.address) {
    const addressErrors = validateAddress(profile.contact_info.address);
    errors.push(...addressErrors);
  }

  // Validate emergency contact if provided
  if (profile.emergency_contact) {
    const emergencyContactErrors = validateEmergencyContact(profile.emergency_contact);
    errors.push(...emergencyContactErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate patient registration request
 * @param request - Registration request to validate
 * @returns Validation result
 */
export function validatePatientRegistrationRequest(request: PatientRegistrationRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate patient data
  const profileValidation = validatePatientProfile(request.patient_data);
  errors.push(...profileValidation.errors);

  // Validate encryption key format if provided
  if (request.encryption_key && !isValidEncryptionKey(request.encryption_key)) {
    errors.push({
      field: 'encryption_key',
      message: 'Invalid encryption key format',
      code: 'INVALID_FORMAT'
    });
  }

  // Validate privacy settings if provided
  if (request.privacy_settings) {
    const privacyErrors = validatePrivacySettings(request.privacy_settings);
    errors.push(...privacyErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate patient profile update request
 * @param request - Update request to validate
 * @returns Validation result
 */
export function validatePatientProfileUpdateRequest(request: PatientProfileUpdateRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate updated data (partial validation)
  if (Object.keys(request.updated_data).length === 0) {
    errors.push({
      field: 'updated_data',
      message: 'At least one field must be provided for update',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate specific fields if they're being updated
  const partialValidation = validatePatientProfile(request.updated_data);
  errors.push(...partialValidation.errors);

  // Validate encryption key format if provided
  if (request.encryption_key && !isValidEncryptionKey(request.encryption_key)) {
    errors.push({
      field: 'encryption_key',
      message: 'Invalid encryption key format',
      code: 'INVALID_FORMAT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================
// IPFS DATA VALIDATION
// =============================================

/**
 * Validate IPFS CID format
 * @param cid - IPFS CID to validate
 * @returns True if valid CID format
 */
export function validateIPFSCID(cid: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!cid || cid.trim().length === 0) {
    errors.push({
      field: 'cid',
      message: 'IPFS CID is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (!isValidIPFSCID(cid)) {
    errors.push({
      field: 'cid',
      message: 'Invalid IPFS CID format',
      code: 'INVALID_FORMAT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate patient IPFS data structure
 * @param data - IPFS data to validate
 * @returns Validation result
 */
export function validatePatientIPFSData(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'data',
      message: 'Patient IPFS data must be an object',
      code: 'INVALID_TYPE'
    });
    return { isValid: false, errors };
  }

  // Validate base patient profile
  const profileValidation = validatePatientProfile(data);
  errors.push(...profileValidation.errors);

  // Validate IPFS metadata
  if (!data.ipfs_metadata) {
    errors.push({
      field: 'ipfs_metadata',
      message: 'IPFS metadata is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const metadataErrors = validateIPFSMetadata(data.ipfs_metadata);
    errors.push(...metadataErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// =============================================
// HELPER VALIDATION FUNCTIONS
// =============================================

/**
 * Validate address information
 */
function validateAddress(address: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!address.street || address.street.trim().length === 0) {
    errors.push({
      field: 'contact_info.address.street',
      message: 'Street address is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push({
      field: 'contact_info.address.city',
      message: 'City is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!address.country || address.country.trim().length === 0) {
    errors.push({
      field: 'contact_info.address.country',
      message: 'Country is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate zip code format (basic validation)
  if (address.zip_code && !isValidZipCode(address.zip_code)) {
    errors.push({
      field: 'contact_info.address.zip_code',
      message: 'Invalid zip code format',
      code: 'INVALID_FORMAT'
    });
  }

  return errors;
}

/**
 * Validate emergency contact information
 */
function validateEmergencyContact(contact: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contact.name || contact.name.trim().length === 0) {
    errors.push({
      field: 'emergency_contact.name',
      message: 'Emergency contact name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!contact.relationship || contact.relationship.trim().length === 0) {
    errors.push({
      field: 'emergency_contact.relationship',
      message: 'Emergency contact relationship is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!contact.phone_number || !isValidPhoneNumber(contact.phone_number)) {
    errors.push({
      field: 'emergency_contact.phone_number',
      message: 'Valid emergency contact phone number is required',
      code: 'INVALID_FORMAT'
    });
  }

  return errors;
}

/**
 * Validate privacy settings
 */
function validatePrivacySettings(settings: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (settings.privacy_level) {
    const validLevels = ['public', 'private', 'selective'];
    if (!validLevels.includes(settings.privacy_level)) {
      errors.push({
        field: 'privacy_settings.privacy_level',
        message: 'Privacy level must be public, private, or selective',
        code: 'INVALID_VALUE'
      });
    }
  }

  return errors;
}

/**
 * Validate IPFS metadata structure
 */
function validateIPFSMetadata(metadata: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!metadata.uploaded_at || !isValidDateFormat(metadata.uploaded_at)) {
    errors.push({
      field: 'ipfs_metadata.uploaded_at',
      message: 'Valid upload timestamp is required',
      code: 'INVALID_FORMAT'
    });
  }

  if (!metadata.version || metadata.version.trim().length === 0) {
    errors.push({
      field: 'ipfs_metadata.version',
      message: 'Version is required',
      code: 'REQUIRED_FIELD'
    });
  }

  const validEncryptionStatuses = ['encrypted', 'plain'];
  if (!metadata.encryption_status || !validEncryptionStatuses.includes(metadata.encryption_status)) {
    errors.push({
      field: 'ipfs_metadata.encryption_status',
      message: 'Encryption status must be encrypted or plain',
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

// =============================================
// FORMAT VALIDATION UTILITIES
// =============================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  // Basic phone number validation (can be enhanced for specific formats)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validate date format (YYYY-MM-DD or ISO string)
 */
function isValidDateFormat(date: string): boolean {
  // Accept both YYYY-MM-DD and ISO string formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  
  if (dateRegex.test(date) || isoRegex.test(date)) {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }
  
  return false;
}

/**
 * Validate zip code format
 */
function isValidZipCode(zipCode: string): boolean {
  // Basic zip code validation (can be enhanced for different countries)
  const zipRegex = /^[\d\w\s\-]{3,10}$/;
  return zipRegex.test(zipCode);
}

/**
 * Validate IPFS CID format
 */
function isValidIPFSCID(cid: string): boolean {
  const cidRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[A-Za-z0-9]{46})$/;
  return cidRegex.test(cid);
}

/**
 * Validate encryption key format (hex string)
 */
function isValidEncryptionKey(key: string): boolean {
  // Validate 32-byte hex string (64 characters)
  const keyRegex = /^[a-fA-F0-9]{64}$/;
  return keyRegex.test(key);
}

// =============================================
// SANITIZATION UTILITIES
// =============================================

/**
 * Sanitize patient profile data
 * @param profile - Patient profile to sanitize
 * @returns Sanitized patient profile
 */
export function sanitizePatientProfile(profile: PatientProfile): PatientProfile {
  return {
    ...profile,
    first_name: profile.first_name?.trim(),
    last_name: profile.last_name?.trim(),
    date_of_birth: profile.date_of_birth?.trim(),
    gender: profile.gender?.trim().toUpperCase(),
    blood_type: profile.blood_type?.trim().toUpperCase(),
    contact_info: profile.contact_info ? {
      ...profile.contact_info,
      email: profile.contact_info.email?.trim().toLowerCase(),
      phone_number: profile.contact_info.phone_number?.trim(),
      address: profile.contact_info.address ? {
        ...profile.contact_info.address,
        street: profile.contact_info.address.street?.trim(),
        city: profile.contact_info.address.city?.trim(),
        state_province: profile.contact_info.address.state_province?.trim(),
        zip_code: profile.contact_info.address.zip_code?.trim(),
        country: profile.contact_info.address.country?.trim()
      } : profile.contact_info.address
    } : profile.contact_info
  };
}