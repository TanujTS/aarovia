/**
 * Provider IPFS Handler
 * 
 * Handles all IPFS operations for provider data including secure upload,
 * retrieval, encryption, and data validation for the Aarovia platform.
 */

import {
  ProviderRegistrationRequest,
  ProviderProfileUpdateRequest,
  ProviderDetailsIPFS,
  ProviderIPFSUploadResult,
  ProviderManagementError,
  ProviderManagementException,
  ValidationResult
} from './types';

// Import IPFS client and medical types
import { IPFSClient } from '../../ipfs';
import { ProviderProfile } from '../../types/medical-data-types';
import { loadSecurityConfig } from '../../config/security-config';

// =============================================
// IPFS RESULT INTERFACES
// =============================================

interface IPFSUploadResult {
  hash: string;
  size: number;
  timestamp: number;
}



// =============================================
// PROVIDER IPFS HANDLER CLASS
// =============================================

export class ProviderIPFSHandler {
  private ipfsClient: IPFSClient;
  private encryptionEnabled: boolean;

  constructor(ipfsClient?: IPFSClient) {
    // Use provided client or create new one with security config
    if (ipfsClient) {
      this.ipfsClient = ipfsClient;
    } else {
      const config = loadSecurityConfig();
      this.ipfsClient = new IPFSClient({
        pinata: {
          apiKey: config.pinata.apiKey,
          secretKey: config.pinata.secretKey
        }
      } as any);
    }
    
    this.encryptionEnabled = true; // Always encrypt provider data
  }

  // =============================================
  // PROVIDER REGISTRATION IPFS OPERATIONS
  // =============================================

  /**
   * Upload provider registration data to IPFS
   * @param request - Provider registration request
   * @returns IPFS upload result with CID
   */
  async uploadProviderRegistration(request: ProviderRegistrationRequest): Promise<ProviderIPFSUploadResult> {
    try {
      console.log('Preparing provider data for IPFS upload...');

      // Convert registration request to medical data format
      const providerProfile: ProviderProfile = {
        name: `${request.personalInfo.firstName} ${request.personalInfo.lastName}`,
        contact_info: {
          phone_number: request.personalInfo.phoneNumber,
          email: request.personalInfo.email,
          address: {
            street: request.practiceInfo.practiceAddress.street,
            city: request.practiceInfo.practiceAddress.city,
            state_province: request.practiceInfo.practiceAddress.state,
            zip_code: request.practiceInfo.practiceAddress.zipCode,
            country: request.practiceInfo.practiceAddress.country,
          }
        },
        specialty: request.professionalInfo.specialties.join(', '),
        license_number: request.professionalInfo.licenseNumber,
        NPI_number: request.professionalInfo.npiNumber || '',
        public_key_for_encryption: undefined, // Can be added later for encryption
      };

      // Upload to IPFS
      console.log('Uploading provider data to IPFS...');
      const ipfsResult = await this.ipfsClient.uploadProviderProfile(
        providerProfile,
        this.encryptionEnabled
      );

      return {
        cid: ipfsResult.hash,
        size: ipfsResult.size || 0,
        hash: ipfsResult.hash,
        pinned: true,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('Provider registration IPFS upload failed:', error);
      throw this.createException(
        ProviderManagementError.IPFS_ERROR,
        `Failed to upload provider registration to IPFS: ${error.message}`,
        { originalError: error, request }
      );
    }
  }

  /**
   * Upload updated provider profile to IPFS
   * @param updateRequest - Provider profile update request
   * @param currentProfile - Current provider profile for merging
   * @returns IPFS upload result with new CID
   */
  async uploadProviderProfileUpdate(
    updateRequest: ProviderProfileUpdateRequest,
    currentProfile: ProviderProfile
  ): Promise<ProviderIPFSUploadResult> {
    try {
      console.log('Preparing provider profile update for IPFS upload...');

      // Create updated provider profile by merging changes
      const updatedProfile: ProviderProfile = {
        ...currentProfile,
        // Update name if personal info changed
        name: updateRequest.personalInfo 
          ? `${updateRequest.personalInfo.firstName || currentProfile.name.split(' ')[0]} ${updateRequest.personalInfo.lastName || currentProfile.name.split(' ')[1]}`
          : currentProfile.name,
        // Update contact info if provided
        contact_info: updateRequest.personalInfo 
          ? {
              ...currentProfile.contact_info,
              phone_number: updateRequest.personalInfo.phoneNumber || currentProfile.contact_info.phone_number,
              email: updateRequest.personalInfo.email || currentProfile.contact_info.email,
            }
          : currentProfile.contact_info,
        // Update specialty if professional info changed
        specialty: updateRequest.professionalInfo?.specialties
          ? updateRequest.professionalInfo.specialties.join(', ')
          : currentProfile.specialty,
        // Update license if changed
        license_number: updateRequest.professionalInfo?.licenseNumber || currentProfile.license_number,
        NPI_number: updateRequest.professionalInfo?.npiNumber || currentProfile.NPI_number,
      };

      // Upload to IPFS
      console.log('Uploading updated provider data to IPFS...');
      const ipfsResult = await this.ipfsClient.uploadProviderProfile(
        updatedProfile,
        this.encryptionEnabled
      );

      return {
        cid: ipfsResult.hash,
        size: ipfsResult.size || 0,
        hash: ipfsResult.hash,
        pinned: true,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('Provider profile update IPFS upload failed:', error);
      throw this.createException(
        ProviderManagementError.IPFS_ERROR,
        `Failed to upload provider profile update to IPFS: ${error.message}`,
        { originalError: error, updateRequest }
      );
    }
  }

  // =============================================
  // PROVIDER DATA RETRIEVAL
  // =============================================

  /**
   * Fetch provider details from IPFS
   * @param cid - IPFS Content Identifier
   * @returns Provider profile data
   */
  async fetchProviderDetails(cid: string): Promise<ProviderProfile> {
    try {
      console.log(`Fetching provider data from IPFS: ${cid}`);

      // Validate CID format
      if (!this.validateIPFSCID(cid)) {
        throw this.createException(
          ProviderManagementError.VALIDATION_ERROR,
          `Invalid IPFS CID format: ${cid}`,
          { cid }
        );
      }

      // Fetch data from IPFS
      const providerData = await this.ipfsClient.downloadJSON<ProviderProfile>(
        cid,
        this.encryptionEnabled
      );
      
      if (!providerData) {
        throw this.createException(
          ProviderManagementError.IPFS_ERROR,
          `Provider data not found for CID: ${cid}`,
          { cid }
        );
      }

      return providerData;
    } catch (error: any) {
      console.error('Provider data IPFS retrieval failed:', error);
      throw this.createException(
        ProviderManagementError.IPFS_ERROR,
        `Failed to fetch provider details from IPFS: ${error.message}`,
        { originalError: error, cid }
      );
    }
  }

  // =============================================
  // DATA VALIDATION
  // =============================================

  // =============================================
  // VALIDATION HELPERS
  // =============================================

  /**
   * Validate IPFS CID format
   * @param cid - Content Identifier to validate
   * @returns Boolean indicating validity
   */
  private validateIPFSCID(cid: string): boolean {
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
  private validateProviderIPFSData(data: ProviderDetailsIPFS): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.personalInfo) {
      errors.push('Personal information is required');
    } else {
      if (!data.personalInfo.firstName) errors.push('First name is required');
      if (!data.personalInfo.lastName) errors.push('Last name is required');
      if (!data.personalInfo.email) errors.push('Email is required');
    }

    if (!data.professionalInfo) {
      errors.push('Professional information is required');
    } else {
      if (!data.professionalInfo.licenseNumber) errors.push('License number is required');
      if (!data.professionalInfo.licenseState) errors.push('License state is required');
      if (!data.professionalInfo.specialties || data.professionalInfo.specialties.length === 0) {
        errors.push('At least one specialty is required');
      }
    }

    if (!data.practiceInfo) {
      errors.push('Practice information is required');
    } else {
      if (!data.practiceInfo.practiceName) errors.push('Practice name is required');
      if (!data.practiceInfo.practiceAddress) errors.push('Practice address is required');
    }

    if (!data.serviceInfo) {
      errors.push('Service information is required');
    }

    if (!data.lastUpdated) errors.push('Last updated timestamp is required');
    if (!data.version) errors.push('Version is required');

    // Check for warnings
    if (data.personalInfo?.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(data.personalInfo.phoneNumber)) {
      warnings.push('Invalid phone number format');
    }

    if (data.personalInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Increment version string (semantic versioning)
   * @param currentVersion - Current version string
   * @returns Incremented version string
   */
  private incrementVersion(currentVersion: string): string {
    try {
      const parts = currentVersion.split('.');
      if (parts.length !== 3) return '1.0.1';
      
      const major = parseInt(parts[0]) || 1;
      const minor = parseInt(parts[1]) || 0;
      const patch = parseInt(parts[2]) || 0;
      
      return `${major}.${minor}.${patch + 1}`;
    } catch {
      return '1.0.1';
    }
  }

  /**
   * Create a provider management exception
   * @param errorType - Type of error
   * @param message - Error message
   * @param context - Additional context
   * @returns Provider management exception
   */
  private createException(
    errorType: ProviderManagementError,
    message: string,
    context?: any
  ): ProviderManagementException {
    return new ProviderManagementException(errorType, message, context);
  }
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Upload provider details to IPFS (convenience function)
 * @param providerData - Provider registration request
 * @returns IPFS upload result
 */
export async function uploadProviderDetailsToIPFS(
  providerData: ProviderRegistrationRequest
): Promise<ProviderIPFSUploadResult> {
  const handler = new ProviderIPFSHandler();
  return await handler.uploadProviderRegistration(providerData);
}

/**
 * Fetch provider details from IPFS (convenience function)
 * @param providerDetailsCID - IPFS Content Identifier
 * @returns Provider details from IPFS
 */
export async function fetchProviderDetailsFromIPFS(
  providerDetailsCID: string
): Promise<ProviderProfile> {
  const handler = new ProviderIPFSHandler();
  return await handler.fetchProviderDetails(providerDetailsCID);
}