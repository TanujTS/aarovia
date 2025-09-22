/**
 * Provider Data Validation
 * 
 * Comprehensive validation utilities for provider registration, profile updates,
 * and data integrity checks in the Aarovia medical platform.
 */

import {
  ProviderType,
  ProviderRegistrationRequest,
  ProviderProfileUpdateRequest,
  ProviderDetailsIPFS,
  ProviderPersonalInfo,
  ProviderProfessionalInfo,
  ProviderPracticeInfo,
  ProviderServiceInfo,
  ValidationResult
} from './types';

// =============================================
// VALIDATION CONSTANTS
// =============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-\(\)]{10,}$/;
const ZIP_CODE_REGEX = /^\d{5}(-\d{4})?$/;
const LICENSE_NUMBER_REGEX = /^[A-Z0-9]{6,20}$/;
const NPI_NUMBER_REGEX = /^\d{10}$/;
const DEA_NUMBER_REGEX = /^[A-Z]{2}\d{7}$/;

const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const COMMON_MEDICAL_SPECIALTIES = [
  'Internal Medicine', 'Family Medicine', 'Pediatrics', 'Cardiology',
  'Dermatology', 'Emergency Medicine', 'Neurology', 'Psychiatry',
  'Radiology', 'Surgery', 'Orthopedics', 'Oncology', 'Anesthesiology',
  'Pathology', 'Ophthalmology', 'Otolaryngology', 'Urology',
  'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Rheumatology',
  'Nephrology', 'Hematology', 'Infectious Disease', 'Allergy and Immunology'
];

// =============================================
// MAIN VALIDATION FUNCTIONS
// =============================================

/**
 * Validate provider registration request
 * @param request - Provider registration request to validate
 * @returns Validation result with errors and warnings
 */
export function validateProviderRegistrationRequest(
  request: ProviderRegistrationRequest
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate provider type
  if (!request.providerType || !Object.values(ProviderType).includes(request.providerType)) {
    errors.push('Valid provider type is required');
  }

  // Validate personal information
  const personalValidation = validateProviderPersonalInfo(request.personalInfo);
  errors.push(...personalValidation.errors);
  warnings.push(...personalValidation.warnings);

  // Validate professional information
  const professionalValidation = validateProviderProfessionalInfo(request.professionalInfo);
  errors.push(...professionalValidation.errors);
  warnings.push(...professionalValidation.warnings);

  // Validate practice information
  const practiceValidation = validateProviderPracticeInfo(request.practiceInfo);
  errors.push(...practiceValidation.errors);
  warnings.push(...practiceValidation.warnings);

  // Validate service information
  const serviceValidation = validateProviderServiceInfo(request.serviceInfo);
  errors.push(...serviceValidation.errors);
  warnings.push(...serviceValidation.warnings);

  // Cross-field validation
  const crossValidation = validateCrossFieldConstraints(request);
  errors.push(...crossValidation.errors);
  warnings.push(...crossValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate provider profile update request
 * @param request - Provider profile update request to validate
 * @returns Validation result with errors and warnings
 */
export function validateProviderProfileUpdateRequest(
  request: ProviderProfileUpdateRequest
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate personal information if provided
  if (request.personalInfo) {
    const personalValidation = validateProviderPersonalInfo(request.personalInfo, true);
    errors.push(...personalValidation.errors);
    warnings.push(...personalValidation.warnings);
  }

  // Validate professional information if provided
  if (request.professionalInfo) {
    const professionalValidation = validateProviderProfessionalInfo(request.professionalInfo, true);
    errors.push(...professionalValidation.errors);
    warnings.push(...professionalValidation.warnings);
  }

  // Validate practice information if provided
  if (request.practiceInfo) {
    const practiceValidation = validateProviderPracticeInfo(request.practiceInfo, true);
    errors.push(...practiceValidation.errors);
    warnings.push(...practiceValidation.warnings);
  }

  // Validate service information if provided
  if (request.serviceInfo) {
    const serviceValidation = validateProviderServiceInfo(request.serviceInfo, true);
    errors.push(...serviceValidation.errors);
    warnings.push(...serviceValidation.warnings);
  }

  // Ensure at least one field is being updated
  if (!request.personalInfo && !request.professionalInfo && 
      !request.practiceInfo && !request.serviceInfo && !request.additionalNotes) {
    errors.push('At least one field must be updated in profile update request');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================
// INDIVIDUAL SECTION VALIDATION
// =============================================

/**
 * Validate provider personal information
 * @param personalInfo - Personal information to validate
 * @param isPartial - Whether this is a partial update (optional fields allowed)
 * @returns Validation result
 */
export function validateProviderPersonalInfo(
  personalInfo: Partial<ProviderPersonalInfo>,
  isPartial: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields (only check if not partial update)
  if (!isPartial) {
    if (!personalInfo.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!personalInfo.lastName?.trim()) {
      errors.push('Last name is required');
    }
    if (!personalInfo.email?.trim()) {
      errors.push('Email address is required');
    }
    if (!personalInfo.phoneNumber?.trim()) {
      errors.push('Phone number is required');
    }
  }

  // Validate first name
  if (personalInfo.firstName) {
    if (personalInfo.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }
    if (personalInfo.firstName.trim().length > 50) {
      errors.push('First name must be less than 50 characters');
    }
    if (!/^[a-zA-Z\s'-]+$/.test(personalInfo.firstName.trim())) {
      errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }

  // Validate last name
  if (personalInfo.lastName) {
    if (personalInfo.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }
    if (personalInfo.lastName.trim().length > 50) {
      errors.push('Last name must be less than 50 characters');
    }
    if (!/^[a-zA-Z\s'-]+$/.test(personalInfo.lastName.trim())) {
      errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }

  // Validate email
  if (personalInfo.email) {
    if (!EMAIL_REGEX.test(personalInfo.email.trim())) {
      errors.push('Invalid email address format');
    }
    if (personalInfo.email.trim().length > 100) {
      errors.push('Email address must be less than 100 characters');
    }
  }

  // Validate phone number
  if (personalInfo.phoneNumber) {
    if (!PHONE_REGEX.test(personalInfo.phoneNumber.trim())) {
      errors.push('Invalid phone number format');
    }
  }

  // Validate date of birth
  if (personalInfo.dateOfBirth) {
    const dob = new Date(personalInfo.dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else {
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        errors.push('Provider must be at least 18 years old');
      }
      if (age > 100) {
        warnings.push('Please verify date of birth - provider appears to be over 100 years old');
      }
    }
  }

  // Validate languages
  if (personalInfo.languages && personalInfo.languages.length > 10) {
    warnings.push('Large number of languages listed - please verify accuracy');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate provider professional information
 * @param professionalInfo - Professional information to validate
 * @param isPartial - Whether this is a partial update
 * @returns Validation result
 */
export function validateProviderProfessionalInfo(
  professionalInfo: Partial<ProviderProfessionalInfo>,
  isPartial: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields (only check if not partial update)
  if (!isPartial) {
    if (!professionalInfo.licenseNumber?.trim()) {
      errors.push('License number is required');
    }
    if (!professionalInfo.licenseState?.trim()) {
      errors.push('License state is required');
    }
    if (!professionalInfo.licenseExpiryDate?.trim()) {
      errors.push('License expiry date is required');
    }
    if (!professionalInfo.specialties || professionalInfo.specialties.length === 0) {
      errors.push('At least one medical specialty is required');
    }
    if (professionalInfo.yearsOfExperience === undefined || professionalInfo.yearsOfExperience < 0) {
      errors.push('Years of experience is required and must be non-negative');
    }
  }

  // Validate license number
  if (professionalInfo.licenseNumber) {
    if (!LICENSE_NUMBER_REGEX.test(professionalInfo.licenseNumber.trim())) {
      errors.push('Invalid license number format (must be 6-20 alphanumeric characters)');
    }
  }

  // Validate license state
  if (professionalInfo.licenseState) {
    if (!VALID_STATES.includes(professionalInfo.licenseState.trim().toUpperCase())) {
      errors.push('Invalid license state (must be valid US state abbreviation)');
    }
  }

  // Validate license expiry date
  if (professionalInfo.licenseExpiryDate) {
    const expiryDate = new Date(professionalInfo.licenseExpiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid license expiry date format');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        errors.push('License has expired');
      } else if (expiryDate.getTime() - today.getTime() < 90 * 24 * 60 * 60 * 1000) {
        warnings.push('License expires within 90 days');
      }
    }
  }

  // Validate specialties
  if (professionalInfo.specialties) {
    if (professionalInfo.specialties.length > 5) {
      warnings.push('Large number of specialties - consider focusing on primary specialties');
    }
    professionalInfo.specialties.forEach(specialty => {
      if (!specialty.trim()) {
        errors.push('Specialty cannot be empty');
      }
      if (!COMMON_MEDICAL_SPECIALTIES.includes(specialty.trim())) {
        warnings.push(`Uncommon specialty "${specialty}" - please verify spelling`);
      }
    });
  }

  // Validate years of experience
  if (professionalInfo.yearsOfExperience !== undefined) {
    if (professionalInfo.yearsOfExperience > 60) {
      warnings.push('Very high years of experience - please verify accuracy');
    }
  }

  // Validate graduation year
  if (professionalInfo.graduationYear) {
    const currentYear = new Date().getFullYear();
    if (professionalInfo.graduationYear < 1950 || professionalInfo.graduationYear > currentYear) {
      errors.push('Invalid graduation year');
    }
  }

  // Validate NPI number
  if (professionalInfo.npiNumber) {
    if (!NPI_NUMBER_REGEX.test(professionalInfo.npiNumber.trim())) {
      errors.push('Invalid NPI number format (must be 10 digits)');
    }
  }

  // Validate DEA number
  if (professionalInfo.deaNumber) {
    if (!DEA_NUMBER_REGEX.test(professionalInfo.deaNumber.trim())) {
      errors.push('Invalid DEA number format (must be 2 letters followed by 7 digits)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate provider practice information
 * @param practiceInfo - Practice information to validate
 * @param isPartial - Whether this is a partial update
 * @returns Validation result
 */
export function validateProviderPracticeInfo(
  practiceInfo: Partial<ProviderPracticeInfo>,
  isPartial: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields (only check if not partial update)
  if (!isPartial) {
    if (!practiceInfo.practiceName?.trim()) {
      errors.push('Practice name is required');
    }
    if (!practiceInfo.practiceAddress) {
      errors.push('Practice address is required');
    }
    if (!practiceInfo.practicePhone?.trim()) {
      errors.push('Practice phone number is required');
    }
  }

  // Validate practice name
  if (practiceInfo.practiceName) {
    if (practiceInfo.practiceName.trim().length < 2) {
      errors.push('Practice name must be at least 2 characters long');
    }
    if (practiceInfo.practiceName.trim().length > 100) {
      errors.push('Practice name must be less than 100 characters');
    }
  }

  // Validate practice address
  if (practiceInfo.practiceAddress) {
    const address = practiceInfo.practiceAddress;
    
    if (!address.street?.trim()) {
      errors.push('Street address is required');
    }
    if (!address.city?.trim()) {
      errors.push('City is required');
    }
    if (!address.state?.trim()) {
      errors.push('State is required');
    } else if (!VALID_STATES.includes(address.state.trim().toUpperCase())) {
      errors.push('Invalid state (must be valid US state abbreviation)');
    }
    if (!address.zipCode?.trim()) {
      errors.push('ZIP code is required');
    } else if (!ZIP_CODE_REGEX.test(address.zipCode.trim())) {
      errors.push('Invalid ZIP code format');
    }
    if (!address.country?.trim()) {
      errors.push('Country is required');
    }
  }

  // Validate practice phone
  if (practiceInfo.practicePhone) {
    if (!PHONE_REGEX.test(practiceInfo.practicePhone.trim())) {
      errors.push('Invalid practice phone number format');
    }
  }

  // Validate practice email
  if (practiceInfo.practiceEmail) {
    if (!EMAIL_REGEX.test(practiceInfo.practiceEmail.trim())) {
      errors.push('Invalid practice email address format');
    }
  }

  // Validate practice website
  if (practiceInfo.practiceWebsite) {
    try {
      new URL(practiceInfo.practiceWebsite.trim());
    } catch {
      errors.push('Invalid practice website URL format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate provider service information
 * @param serviceInfo - Service information to validate
 * @param isPartial - Whether this is a partial update
 * @returns Validation result
 */
export function validateProviderServiceInfo(
  serviceInfo: Partial<ProviderServiceInfo>,
  isPartial: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields (only check if not partial update)
  if (!isPartial) {
    if (!serviceInfo.servicesOffered || serviceInfo.servicesOffered.length === 0) {
      errors.push('At least one service must be offered');
    }
    if (serviceInfo.acceptingNewPatients === undefined) {
      errors.push('New patient acceptance status must be specified');
    }
    if (serviceInfo.emergencyAvailable === undefined) {
      errors.push('Emergency availability status must be specified');
    }
  }

  // Validate services offered
  if (serviceInfo.servicesOffered) {
    if (serviceInfo.servicesOffered.length > 20) {
      warnings.push('Large number of services listed - consider grouping similar services');
    }
    serviceInfo.servicesOffered.forEach(service => {
      if (!service.trim()) {
        errors.push('Service name cannot be empty');
      }
      if (service.trim().length > 100) {
        errors.push('Service name must be less than 100 characters');
      }
    });
  }

  // Validate consultation fee
  if (serviceInfo.consultationFee !== undefined) {
    if (serviceInfo.consultationFee < 0) {
      errors.push('Consultation fee cannot be negative');
    }
    if (serviceInfo.consultationFee > 10000) {
      warnings.push('Very high consultation fee - please verify amount');
    }
  }

  // Validate available hours
  if (serviceInfo.availableHours) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    days.forEach(day => {
      const hours = serviceInfo.availableHours?.[day as keyof typeof serviceInfo.availableHours];
      if (hours) {
        if (!timeRegex.test(hours.start)) {
          errors.push(`Invalid start time format for ${day} (use HH:MM format)`);
        }
        if (!timeRegex.test(hours.end)) {
          errors.push(`Invalid end time format for ${day} (use HH:MM format)`);
        }
        if (hours.start >= hours.end) {
          errors.push(`Start time must be before end time for ${day}`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================
// CROSS-FIELD VALIDATION
// =============================================

/**
 * Validate cross-field constraints
 * @param request - Provider registration request
 * @returns Validation result
 */
function validateCrossFieldConstraints(request: ProviderRegistrationRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if provider type matches specialties
  if (request.providerType === ProviderType.NURSE && 
      request.professionalInfo.specialties.some(s => s.includes('Surgery'))) {
    warnings.push('Surgical specialties unusual for nurse practitioner');
  }

  // Check years of experience vs graduation year
  if (request.professionalInfo.graduationYear && request.professionalInfo.yearsOfExperience) {
    const currentYear = new Date().getFullYear();
    const maxPossibleExperience = currentYear - request.professionalInfo.graduationYear;
    if (request.professionalInfo.yearsOfExperience > maxPossibleExperience) {
      errors.push('Years of experience cannot exceed years since graduation');
    }
  }

  // Check if practice and personal contact info are too similar
  if (request.personalInfo.email === request.practiceInfo.practiceEmail) {
    warnings.push('Personal and practice email addresses are the same');
  }

  // Check if provider type matches practice type
  if (request.providerType === ProviderType.HOSPITAL && 
      !request.practiceInfo.practiceName.toLowerCase().includes('hospital')) {
    warnings.push('Provider type is hospital but practice name does not include "hospital"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================
// UTILITY VALIDATION FUNCTIONS
// =============================================

/**
 * Validate IPFS CID format
 * @param cid - Content Identifier to validate
 * @returns Boolean indicating validity
 */
export function validateIPFSCID(cid: string): boolean {
  if (!cid || typeof cid !== 'string') return false;
  
  // Basic CID validation (starts with Qm or baf for v0/v1)
  const cidRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[a-z2-7]{56,59})$/;
  return cidRegex.test(cid);
}

/**
 * Validate provider IPFS data structure
 * @param data - Provider data to validate
 * @returns Validation result
 */
export function validateProviderIPFSData(data: ProviderDetailsIPFS): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required top-level fields
  if (!data.personalInfo) errors.push('Personal information is required');
  if (!data.professionalInfo) errors.push('Professional information is required');
  if (!data.practiceInfo) errors.push('Practice information is required');
  if (!data.serviceInfo) errors.push('Service information is required');
  if (!data.lastUpdated) errors.push('Last updated timestamp is required');
  if (!data.version) errors.push('Version is required');

  // Validate timestamps
  if (data.lastUpdated) {
    const lastUpdated = new Date(data.lastUpdated);
    if (isNaN(lastUpdated.getTime())) {
      errors.push('Invalid last updated timestamp format');
    }
  }

  // Validate version format
  if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
    warnings.push('Non-standard version format (expected semantic versioning)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize provider profile data
 * @param data - Raw provider data
 * @returns Sanitized provider data
 */
export function sanitizeProviderProfile(data: any): Partial<ProviderRegistrationRequest> {
  return {
    providerType: data.providerType,
    personalInfo: {
      firstName: data.personalInfo?.firstName?.trim(),
      lastName: data.personalInfo?.lastName?.trim(),
      email: data.personalInfo?.email?.trim().toLowerCase(),
      phoneNumber: data.personalInfo?.phoneNumber?.trim(),
      dateOfBirth: data.personalInfo?.dateOfBirth,
      profilePicture: data.personalInfo?.profilePicture,
      languages: data.personalInfo?.languages?.map((lang: string) => lang.trim()).filter(Boolean),
    },
    professionalInfo: {
      licenseNumber: data.professionalInfo?.licenseNumber?.trim().toUpperCase(),
      licenseState: data.professionalInfo?.licenseState?.trim().toUpperCase(),
      licenseExpiryDate: data.professionalInfo?.licenseExpiryDate,
      medicalSchool: data.professionalInfo?.medicalSchool?.trim(),
      graduationYear: data.professionalInfo?.graduationYear,
      residencyProgram: data.professionalInfo?.residencyProgram?.trim(),
      boardCertifications: data.professionalInfo?.boardCertifications?.map((cert: string) => cert.trim()).filter(Boolean),
      specialties: data.professionalInfo?.specialties?.map((spec: string) => spec.trim()).filter(Boolean),
      yearsOfExperience: data.professionalInfo?.yearsOfExperience,
      npiNumber: data.professionalInfo?.npiNumber?.trim(),
      deaNumber: data.professionalInfo?.deaNumber?.trim().toUpperCase(),
    },
    practiceInfo: {
      practiceName: data.practiceInfo?.practiceName?.trim(),
      practiceAddress: data.practiceInfo?.practiceAddress ? {
        street: data.practiceInfo.practiceAddress.street?.trim(),
        city: data.practiceInfo.practiceAddress.city?.trim(),
        state: data.practiceInfo.practiceAddress.state?.trim().toUpperCase(),
        zipCode: data.practiceInfo.practiceAddress.zipCode?.trim(),
        country: data.practiceInfo.practiceAddress.country?.trim(),
      } : undefined,
      practicePhone: data.practiceInfo?.practicePhone?.trim(),
      practiceEmail: data.practiceInfo?.practiceEmail?.trim().toLowerCase(),
      practiceWebsite: data.practiceInfo?.practiceWebsite?.trim(),
      hospitalAffiliations: data.practiceInfo?.hospitalAffiliations?.map((aff: string) => aff.trim()).filter(Boolean),
      acceptedInsurances: data.practiceInfo?.acceptedInsurances?.map((ins: string) => ins.trim()).filter(Boolean),
      telemedicineAvailable: data.practiceInfo?.telemedicineAvailable,
    },
    serviceInfo: {
      servicesOffered: data.serviceInfo?.servicesOffered?.map((service: string) => service.trim()).filter(Boolean),
      consultationFee: data.serviceInfo?.consultationFee,
      acceptingNewPatients: data.serviceInfo?.acceptingNewPatients,
      availableHours: data.serviceInfo?.availableHours,
      emergencyAvailable: data.serviceInfo?.emergencyAvailable,
    },
    additionalNotes: data.additionalNotes?.trim(),
  };
}