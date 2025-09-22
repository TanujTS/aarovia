/**
 * Patient Management Service
 * 
 * Main service class that orchestrates patient registration, profile updates,
 * and data retrieval with both blockchain and IPFS integration.
 */

import { ethers } from 'ethers';
import { PatientRegistryContract } from './PatientRegistryContract';
import { PatientIPFSHandler } from './PatientIPFSHandler';
import { validatePatientRegistrationRequest, validatePatientProfileUpdateRequest } from './validation';
import {
  PatientRegistrationRequest,
  PatientProfileUpdateRequest,
  PatientLookupParams,
  PatientRegistrationResponse,
  PatientProfileUpdateResponse,
  PatientProfileResponse,
  PatientManagementConfig,
  PatientManagementError,
  PatientManagementException,
  PatientProfileContract,
  PatientDetailsIPFS
} from './types';

// =============================================
// PATIENT SERVICE CLASS
// =============================================

export class PatientService {
  private contractHandler: PatientRegistryContract;
  private ipfsHandler: PatientIPFSHandler;
  private config: PatientManagementConfig;

  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    config?: Partial<PatientManagementConfig>
  ) {
    // Initialize contract handler
    this.contractHandler = new PatientRegistryContract(contractAddress, signerOrProvider);

    // Initialize IPFS handler
    this.ipfsHandler = new PatientIPFSHandler();

    // Set configuration with defaults
    this.config = {
      contract_address: contractAddress,
      ipfs_gateway: 'https://gateway.pinata.cloud/ipfs/',
      encryption_enabled: true,
      auto_backup: true,
      event_listening: true,
      gas_limit: 500000,
      confirmation_blocks: 2,
      ...config
    };
  }

  // =============================================
  // PATIENT REGISTRATION
  // =============================================

  /**
   * Register a new patient with both IPFS and blockchain storage
   * @param request - Patient registration request
   * @returns Registration response with transaction details
   */
  async registerPatient(request: PatientRegistrationRequest): Promise<PatientRegistrationResponse> {
    try {
      console.log('Starting patient registration process...');

      // Validate registration request
      const validation = validatePatientRegistrationRequest(request);
      if (!validation.isValid) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Registration request validation failed',
          { errors: validation.errors }
        );
      }

      // Step 1: Upload patient data to IPFS
      console.log('Uploading patient data to IPFS...');
      const ipfsResult = await this.ipfsHandler.uploadPatientRegistration(request);

      // Step 2: Register patient on blockchain with IPFS CID
      console.log('Registering patient on blockchain...');
      const blockchainResult = await this.contractHandler.registerPatient({
        patientDetailsCID: ipfsResult.cid
      });

      // Wait for transaction confirmation
      const receipt = await blockchainResult.transaction.wait(this.config.confirmation_blocks);

      return {
        success: true,
        patient_id: blockchainResult.patientId,
        patient_wallet: await this.contractHandler.getSignerAddress() || '',
        ipfs_cid: ipfsResult.cid,
        transaction_hash: blockchainResult.transaction.hash,
        block_number: receipt.blockNumber,
        gas_used: receipt.gasUsed.toString(),
        registration_timestamp: Date.now()
      };

    } catch (error) {
      console.error('Patient registration failed:', error);
      return {
        success: false,
        patient_id: '',
        patient_wallet: '',
        ipfs_cid: '',
        transaction_hash: '',
        block_number: 0,
        gas_used: '0',
        registration_timestamp: Date.now(),
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Register multiple patients in batch
   * @param requests - Array of patient registration requests
   * @returns Array of registration responses
   */
  async batchRegisterPatients(
    requests: PatientRegistrationRequest[]
  ): Promise<PatientRegistrationResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.registerPatient(request))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          patient_id: '',
          patient_wallet: '',
          ipfs_cid: '',
          transaction_hash: '',
          block_number: 0,
          gas_used: '0',
          registration_timestamp: Date.now(),
          error: result.reason?.message || 'Registration failed'
        };
      }
    });
  }

  // =============================================
  // PATIENT PROFILE UPDATES
  // =============================================

  /**
   * Update patient profile with new data
   * @param request - Profile update request
   * @returns Update response with transaction details
   */
  async updatePatientProfile(request: PatientProfileUpdateRequest): Promise<PatientProfileUpdateResponse> {
    try {
      console.log('Starting patient profile update process...');

      // Validate update request
      const validation = validatePatientProfileUpdateRequest(request);
      if (!validation.isValid) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Profile update request validation failed',
          { errors: validation.errors }
        );
      }

      // Get current patient profile to find current CID
      const signerAddress = await this.contractHandler.getSignerAddress();
      if (!signerAddress) {
        throw this.createException(
          PatientManagementError.INSUFFICIENT_PERMISSIONS,
          'No signer available for profile update'
        );
      }

      const currentProfile = await this.contractHandler.getPatientProfile(signerAddress);
      if (!currentProfile) {
        throw this.createException(
          PatientManagementError.PATIENT_NOT_FOUND,
          'Patient profile not found on blockchain'
        );
      }

      // Step 1: Update patient data on IPFS
      console.log('Updating patient data on IPFS...');
      const ipfsResult = await this.ipfsHandler.updatePatientProfileOnIPFS(
        currentProfile.medicalProfileCID,
        request,
        request.encryption_key
      );

      // Step 2: Update CID on blockchain
      console.log('Updating patient profile CID on blockchain...');
      const blockchainResult = await this.contractHandler.updatePatientProfileCID({
        newPatientDetailsCID: ipfsResult.new_cid
      });

      // Wait for transaction confirmation
      const receipt = await blockchainResult.wait(this.config.confirmation_blocks);

      return {
        success: true,
        patient_id: currentProfile.patientId,
        patient_wallet: signerAddress,
        new_ipfs_cid: ipfsResult.new_cid,
        previous_cid: ipfsResult.previous_cid,
        transaction_hash: blockchainResult.hash,
        block_number: receipt.blockNumber,
        gas_used: receipt.gasUsed.toString(),
        update_timestamp: Date.now()
      };

    } catch (error) {
      console.error('Patient profile update failed:', error);
      return {
        success: false,
        patient_id: '',
        patient_wallet: '',
        new_ipfs_cid: '',
        previous_cid: '',
        transaction_hash: '',
        block_number: 0,
        gas_used: '0',
        update_timestamp: Date.now(),
        error: error.message || 'Profile update failed'
      };
    }
  }

  // =============================================
  // PATIENT PROFILE RETRIEVAL
  // =============================================

  /**
   * Get complete patient profile (blockchain + IPFS data)
   * @param params - Patient lookup parameters
   * @returns Complete patient profile response
   */
  async getPatientProfile(params: PatientLookupParams): Promise<PatientProfileResponse> {
    try {
      console.log('Retrieving patient profile...');

      // Determine patient address
      let patientAddress: string;
      if (params.patient_wallet) {
        patientAddress = params.patient_wallet;
      } else if (params.patient_id) {
        // In a real implementation, you might need a mapping from patient_id to wallet
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Patient lookup by ID not yet implemented. Please provide patient_wallet.'
        );
      } else {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Either patient_wallet or patient_id must be provided'
        );
      }

      // Step 1: Get blockchain data
      console.log('Fetching blockchain data...');
      const blockchainData = await this.contractHandler.getPatientProfile(patientAddress);
      if (!blockchainData) {
        return {
          success: false,
          patient_profile: null,
          blockchain_data: null,
          ipfs_cid: '',
          last_updated: 0,
          error: 'Patient not found on blockchain'
        };
      }

      // Step 2: Get IPFS data if requested
      let ipfsData: PatientDetailsIPFS | null = null;
      if (params.include_ipfs_data !== false) {
        console.log('Fetching IPFS data...');
        try {
          ipfsData = await this.ipfsHandler.fetchPatientProfileByWallet(
            blockchainData.medicalProfileCID,
            patientAddress
          );
        } catch (error) {
          console.warn('Failed to fetch IPFS data:', error.message);
          // Continue without IPFS data rather than failing completely
        }
      }

      return {
        success: true,
        patient_profile: ipfsData,
        blockchain_data: blockchainData,
        ipfs_cid: blockchainData.medicalProfileCID,
        last_updated: blockchainData.registrationTimestamp
      };

    } catch (error) {
      console.error('Patient profile retrieval failed:', error);
      return {
        success: false,
        patient_profile: null,
        blockchain_data: null,
        ipfs_cid: '',
        last_updated: 0,
        error: error.message || 'Profile retrieval failed'
      };
    }
  }

  /**
   * Get patient profiles for multiple addresses
   * @param addresses - Array of patient wallet addresses
   * @returns Array of patient profile responses
   */
  async getBatchPatientProfiles(addresses: string[]): Promise<PatientProfileResponse[]> {
    const results = await Promise.allSettled(
      addresses.map(address => this.getPatientProfile({ 
        patient_wallet: address, 
        include_ipfs_data: true 
      }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          patient_profile: null,
          blockchain_data: null,
          ipfs_cid: '',
          last_updated: 0,
          error: result.reason?.message || 'Profile retrieval failed'
        };
      }
    });
  }

  // =============================================
  // EVENT MONITORING
  // =============================================

  /**
   * Start listening for patient registration events
   * @param callback - Function to call when patient is registered
   * @returns Cleanup function to stop listening
   */
  startPatientRegistrationMonitoring(
    callback: (event: any) => void
  ): () => void {
    if (!this.config.event_listening) {
      console.warn('Event listening is disabled in configuration');
      return () => {};
    }

    return this.contractHandler.onPatientRegistered((event) => {
      console.log('Patient registered event:', event);
      callback(event);
    });
  }

  /**
   * Start listening for patient profile update events
   * @param callback - Function to call when profile is updated
   * @returns Cleanup function to stop listening
   */
  startPatientUpdateMonitoring(
    callback: (event: any) => void
  ): () => void {
    if (!this.config.event_listening) {
      console.warn('Event listening is disabled in configuration');
      return () => {};
    }

    return this.contractHandler.onPatientProfileUpdated((event) => {
      console.log('Patient profile updated event:', event);
      callback(event);
    });
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Verify patient data integrity between blockchain and IPFS
   * @param patientAddress - Patient wallet address
   * @returns Verification result
   */
  async verifyPatientDataIntegrity(patientAddress: string): Promise<{
    isValid: boolean;
    blockchainCID: string;
    ipfsDataExists: boolean;
    lastVerified: number;
  }> {
    try {
      const blockchainData = await this.contractHandler.getPatientProfile(patientAddress);
      if (!blockchainData) {
        return {
          isValid: false,
          blockchainCID: '',
          ipfsDataExists: false,
          lastVerified: Date.now()
        };
      }

      // Try to fetch IPFS data to verify it exists
      try {
        await this.ipfsHandler.fetchPatientProfileByWallet(
          blockchainData.medicalProfileCID,
          patientAddress
        );
        
        return {
          isValid: true,
          blockchainCID: blockchainData.medicalProfileCID,
          ipfsDataExists: true,
          lastVerified: Date.now()
        };
      } catch (error) {
        return {
          isValid: false,
          blockchainCID: blockchainData.medicalProfileCID,
          ipfsDataExists: false,
          lastVerified: Date.now()
        };
      }
    } catch (error) {
      return {
        isValid: false,
        blockchainCID: '',
        ipfsDataExists: false,
        lastVerified: Date.now()
      };
    }
  }

  /**
   * Estimate gas cost for patient registration
   * @param request - Registration request
   * @returns Estimated gas cost
   */
  async estimateRegistrationCost(request: PatientRegistrationRequest): Promise<{
    gasEstimate: string;
    estimatedCostETH: string;
    estimatedCostUSD?: string;
  }> {
    try {
      // Upload to IPFS first to get the CID
      const ipfsResult = await this.ipfsHandler.uploadPatientRegistration(request);
      
      // Estimate gas for blockchain transaction
      const gasEstimate = await this.contractHandler.estimateRegistrationGas(ipfsResult.cid);
      
      // Get current gas price (this would need to be implemented)
      const gasPrice = ethers.parseUnits('20', 'gwei'); // Example: 20 gwei
      const estimatedCost = gasEstimate * gasPrice;
      
      return {
        gasEstimate: gasEstimate.toString(),
        estimatedCostETH: ethers.formatEther(estimatedCost),
        // estimatedCostUSD: would need price oracle integration
      };
    } catch (error) {
      throw this.createException(
        PatientManagementError.BLOCKCHAIN_TRANSACTION_FAILED,
        'Failed to estimate registration cost',
        { originalError: error }
      );
    }
  }

  /**
   * Get service configuration
   */
  getConfiguration(): PatientManagementConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfiguration(newConfig: Partial<PatientManagementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

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
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Create a PatientService instance with default configuration
 * @param contractAddress - PatientRegistry contract address
 * @param signer - Ethereum signer
 * @returns Configured PatientService instance
 */
export function createPatientService(
  contractAddress: string,
  signer: ethers.Signer
): PatientService {
  return new PatientService(contractAddress, signer);
}

/**
 * Create a read-only PatientService instance
 * @param contractAddress - PatientRegistry contract address
 * @param provider - Ethereum provider
 * @returns Read-only PatientService instance
 */
export function createReadOnlyPatientService(
  contractAddress: string,
  provider: ethers.Provider
): PatientService {
  return new PatientService(contractAddress, provider);
}