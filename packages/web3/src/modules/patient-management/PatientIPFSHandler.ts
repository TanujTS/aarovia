/**
 * Patient IPFS Data Handlers
 * 
 * Functions for uploadPatientDetailsToIPFS and fetch      // Upload to IPFS with encryption
      const uploadResult = await this.ipfsClient.uploadPatientProfile(
        ipfsData,
        this.encryptionEnabled
      );

      return {
        cid: uploadResult.hash,
        encryption_key: finalEncryptionKey,
        file_size: ipfsData.ipfs_metadata.file_size,
        upload_timestamp: Date.now()
      };sFromIPFS
 * with proper encryption, validation, and error handling.
 */

import { IPFSClient } from '../../ipfs.js';
import { loadSecurityConfig } from '../../config/security-config.js';
import {
  PatientDetailsIPFS,
  PatientRegistrationRequest,
  PatientProfileUpdateRequest,
  PatientManagementError,
  PatientManagementException
} from './types.js';
import { PatientProfile } from '../../types/medical-data-types.js';
import { validatePatientProfile } from './validation';

// =============================================
// IPFS PATIENT DATA HANDLER CLASS
// =============================================

export class PatientIPFSHandler {
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
    
    this.encryptionEnabled = true; // Always encrypt patient data
  }

  // =============================================
  // PATIENT DATA UPLOAD TO IPFS
  // =============================================

  /**
   * Upload patient details to IPFS with encryption
   * @param patient_data - Patient profile data to upload
   * @param encryption_key - Optional encryption key (auto-generated if not provided)
   * @returns IPFS CID and metadata
   */
  async uploadPatientDetailsToIPFS(
    patient_data: PatientProfile,
    encryption_key?: string
  ): Promise<{
    cid: string;
    encryption_key: string;
    file_size: number;
    upload_timestamp: number;
  }> {
    try {
      // Validate patient data
      const validationResult = validatePatientProfile(patient_data);
      if (!validationResult.isValid) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Patient data validation failed',
          { errors: validationResult.errors }
        );
      }

      // Generate encryption key if not provided
      const finalEncryptionKey = encryption_key || this.generateEncryptionKey();

      // Prepare IPFS data structure
      const ipfsData: PatientDetailsIPFS = {
        ...patient_data,
        ipfs_metadata: {
          uploaded_at: new Date().toISOString(),
          version: '1.0',
          encryption_status: 'encrypted',
          file_size: 0, // Will be calculated after JSON stringification
          content_hash: '' // Will be calculated after JSON stringification
        }
      };

      // Calculate content hash and file size
      const jsonString = JSON.stringify(ipfsData, null, 2);
      ipfsData.ipfs_metadata.file_size = Buffer.byteLength(jsonString, 'utf8');
      ipfsData.ipfs_metadata.content_hash = await this.calculateContentHash(jsonString);

      // Upload to IPFS with encryption
      const uploadResult = await this.ipfsClient.uploadPatientProfile(
        ipfsData,
        this.encryptionEnabled
      );

      return {
        cid: uploadResult.hash,
        encryption_key: finalEncryptionKey,
        file_size: ipfsData.ipfs_metadata.file_size,
        upload_timestamp: Date.now()
      };

    } catch (error) {
      throw this.handleIPFSError(error, 'uploadPatientDetailsToIPFS');
    }
  }

  /**
   * Upload patient registration data (convenience method)
   * @param registrationRequest - Patient registration request
   * @returns IPFS upload result
   */
  async uploadPatientRegistration(
    registrationRequest: PatientRegistrationRequest
  ): Promise<{
    cid: string;
    encryption_key: string;
    file_size: number;
    upload_timestamp: number;
  }> {
    // Generate patient ID for the profile
    const patientId = this.generatePatientId();
    const patientProfile: PatientProfile = {
      ...registrationRequest.patient_data,
      patient_id: patientId
    } as PatientProfile;

    return await this.uploadPatientDetailsToIPFS(
      patientProfile,
      registrationRequest.encryption_key
    );
  }

  // =============================================
  // PATIENT DATA FETCH FROM IPFS
  // =============================================

  /**
   * Fetch patient details from IPFS with decryption
   * @param medicalProfileCID - IPFS CID of the patient profile
   * @param encryption_key - Encryption key for decryption
   * @returns Decrypted patient profile data
   */
  async fetchPatientDetailsFromIPFS(
    medicalProfileCID: string,
    encryption_key?: string
  ): Promise<PatientDetailsIPFS> {
    try {
      // Validate CID format
      if (!this.isValidIPFSCID(medicalProfileCID)) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Invalid IPFS CID format',
          { cid: medicalProfileCID }
        );
      }

      // Fetch and decrypt data from IPFS
      const patientData = await this.ipfsClient.downloadJSON<PatientDetailsIPFS>(
        medicalProfileCID,
        this.encryptionEnabled,
        encryption_key
      );

      // Validate retrieved data structure
      if (!this.isValidPatientIPFSData(patientData)) {
        throw this.createException(
          PatientManagementError.IPFS_FETCH_FAILED,
          'Retrieved data does not match expected patient profile structure',
          { cid: medicalProfileCID }
        );
      }

      return patientData as PatientDetailsIPFS;

    } catch (error) {
      throw this.handleIPFSError(error, 'fetchPatientDetailsFromIPFS');
    }
  }

  /**
   * Fetch patient profile with automatic decryption key handling
   * @param medicalProfileCID - IPFS CID of the patient profile
   * @param patientWallet - Patient's wallet address (for key derivation)
   * @returns Decrypted patient profile data
   */
  async fetchPatientProfileByWallet(
    medicalProfileCID: string,
    patientWallet: string
  ): Promise<PatientDetailsIPFS> {
    try {
      // In a real implementation, you might derive the encryption key from the wallet
      // For now, we'll attempt to fetch without a key first (for backwards compatibility)
      try {
        return await this.fetchPatientDetailsFromIPFS(medicalProfileCID);
      } catch (error) {
        // If decryption fails, you might need to implement key derivation
        // or prompt the user for their encryption key
        throw this.createException(
          PatientManagementError.ENCRYPTION_ERROR,
          'Failed to decrypt patient data. Encryption key may be required.',
          { cid: medicalProfileCID, wallet: patientWallet }
        );
      }
    } catch (error) {
      throw this.handleIPFSError(error, 'fetchPatientProfileByWallet');
    }
  }

  // =============================================
  // PATIENT PROFILE UPDATE
  // =============================================

  /**
   * Update patient profile on IPFS
   * @param currentCID - Current IPFS CID
   * @param updateRequest - Profile update request
   * @param encryption_key - Encryption key
   * @returns New IPFS CID and metadata
   */
  async updatePatientProfileOnIPFS(
    currentCID: string,
    updateRequest: PatientProfileUpdateRequest,
    encryption_key?: string
  ): Promise<{
    new_cid: string;
    previous_cid: string;
    encryption_key: string;
    file_size: number;
    update_timestamp: number;
  }> {
    try {
      // Fetch current profile
      const currentProfile = await this.fetchPatientDetailsFromIPFS(currentCID, encryption_key);

      // Merge updates with current profile
      const updatedProfile: PatientDetailsIPFS = {
        ...currentProfile,
        ...updateRequest.updated_data,
        ipfs_metadata: {
          ...currentProfile.ipfs_metadata,
          uploaded_at: new Date().toISOString(),
          version: this.incrementVersion(currentProfile.ipfs_metadata.version)
        }
      };

      // Add privacy settings if provided
      if (updateRequest.privacy_settings) {
        updatedProfile.preferences = {
          ...currentProfile.preferences,
          ...updateRequest.privacy_settings
        };
      }

      // Upload updated profile
      const uploadResult = await this.uploadPatientDetailsToIPFS(
        updatedProfile,
        encryption_key || updateRequest.encryption_key
      );

      return {
        new_cid: uploadResult.cid,
        previous_cid: currentCID,
        encryption_key: uploadResult.encryption_key,
        file_size: uploadResult.file_size,
        update_timestamp: uploadResult.upload_timestamp
      };

    } catch (error) {
      throw this.handleIPFSError(error, 'updatePatientProfileOnIPFS');
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Batch upload multiple patient profiles
   * @param patients - Array of patient registration requests
   * @returns Array of upload results
   */
  async batchUploadPatients(
    patients: PatientRegistrationRequest[]
  ): Promise<Array<{
    patient_id: string;
    cid: string;
    encryption_key: string;
    success: boolean;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      patients.map(async (patient, index) => {
        const uploadResult = await this.uploadPatientRegistration(patient);
        const patientId = this.generatePatientId();
        return {
          patient_id: patientId,
          cid: uploadResult.cid,
          encryption_key: uploadResult.encryption_key,
          success: true
        };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          patient_id: `patient_${index}_failed`,
          cid: '',
          encryption_key: '',
          success: false,
          error: result.reason?.message || 'Upload failed'
        };
      }
    });
  }

  /**
   * Verify IPFS data integrity
   * @param cid - IPFS CID to verify
   * @param expectedHash - Expected content hash
   * @returns Verification result
   */
  async verifyPatientDataIntegrity(
    cid: string,
    expectedHash: string,
    encryption_key?: string
  ): Promise<{
    isValid: boolean;
    actualHash: string;
    expectedHash: string;
  }> {
    try {
      const data = await this.fetchPatientDetailsFromIPFS(cid, encryption_key);
      const actualHash = await this.calculateContentHash(JSON.stringify(data));
      
      return {
        isValid: actualHash === expectedHash,
        actualHash,
        expectedHash
      };
    } catch (error) {
      return {
        isValid: false,
        actualHash: '',
        expectedHash
      };
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Generate encryption key for patient data
   */
  private generateEncryptionKey(): string {
    // Generate a 32-byte random key for AES-256
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique patient ID
   */
  private generatePatientId(): string {
    return `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate content hash for integrity verification
   */
  private async calculateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Increment version string
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  }

  /**
   * Validate IPFS CID format
   */
  private isValidIPFSCID(cid: string): boolean {
    const cidRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[A-Za-z0-9]{46})$/;
    return cidRegex.test(cid);
  }

  /**
   * Validate patient IPFS data structure
   */
  private isValidPatientIPFSData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.patient_id &&
      data.first_name &&
      data.last_name &&
      data.ipfs_metadata &&
      data.ipfs_metadata.uploaded_at &&
      data.ipfs_metadata.version
    );
  }

  /**
   * Create a standardized exception
   */
  private createException(
    code: PatientManagementError,
    message: string,
    details?: any
  ): PatientManagementException {
    return {
      code,
      message,
      details,
      timestamp: Date.now()
    };
  }

  /**
   * Handle IPFS errors and convert to standardized exceptions
   */
  private handleIPFSError(error: any, functionName: string): never {
    console.error(`PatientIPFSHandler.${functionName} error:`, error);

    if (error.code && Object.values(PatientManagementError).includes(error.code)) {
      throw error; // Re-throw our custom exceptions
    }

    if (error.message?.includes('CID not found')) {
      throw this.createException(
        PatientManagementError.IPFS_FETCH_FAILED,
        'Patient data not found on IPFS',
        { function: functionName, originalError: error }
      );
    }

    if (error.message?.includes('encryption') || error.message?.includes('decrypt')) {
      throw this.createException(
        PatientManagementError.ENCRYPTION_ERROR,
        'Failed to encrypt/decrypt patient data',
        { function: functionName, originalError: error }
      );
    }

    // Generic IPFS error
    throw this.createException(
      PatientManagementError.IPFS_UPLOAD_FAILED,
      `IPFS operation failed in ${functionName}: ${error.message}`,
      { function: functionName, originalError: error }
    );
  }
}

// =============================================
// STANDALONE UTILITY FUNCTIONS
// =============================================

/**
 * Upload patient details to IPFS (standalone function)
 * @param patient_data - Patient profile data
 * @param encryption_key - Optional encryption key
 * @returns IPFS CID and metadata
 */
export async function uploadPatientDetailsToIPFS(
  patient_data: PatientProfile,
  encryption_key?: string
): Promise<{
  cid: string;
  encryption_key: string;
  file_size: number;
  upload_timestamp: number;
}> {
  const handler = new PatientIPFSHandler();
  return await handler.uploadPatientDetailsToIPFS(patient_data, encryption_key);
}

/**
 * Fetch patient details from IPFS (standalone function)
 * @param medicalProfileCID - IPFS CID
 * @param encryption_key - Encryption key
 * @returns Patient profile data
 */
export async function fetchPatientDetailsFromIPFS(
  medicalProfileCID: string,
  encryption_key?: string
): Promise<PatientDetailsIPFS> {
  const handler = new PatientIPFSHandler();
  return await handler.fetchPatientDetailsFromIPFS(medicalProfileCID, encryption_key);
}