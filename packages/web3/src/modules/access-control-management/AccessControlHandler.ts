/**
 * Access Control Handler
 * 
 * Handles all interactions with the AccessControl smart contract including
 * granting/revoking access permissions, checking access rights, and managing
 * patient-provider relationships.
 */

import { ethers } from 'ethers';
import {
  AccessControlConfig,
  AccessRequest,
  GeneralAccessRequest,
  AccessRevocationRequest,
  AccessCheckResult,
  ProvidersWithAccessResult,
  PatientsGrantedAccessResult,
  AccessGrantResult,
  AccessRevokeResult,
  AccessControlError,
  AccessControlException,
  Role,
  RecordType,
  AccessGrantedEvent,
  AccessRevokedEvent,
  GeneralAccessGrantedEvent,
  GeneralAccessRevokedEvent
} from '../../types/access-control-types';

// =============================================
// ACCESS CONTROL CONTRACT ABI
// =============================================

const ACCESS_CONTROL_ABI = [
  // Role management
  'function assignRole(address _user, uint8 _role) external',
  'function getRole(address _user) external view returns (uint8)',
  
  // Main access control functions
  'function grantAccessToRecord(bytes32 _recordId, address _providerAddress, uint256 _durationInSeconds) external',
  'function revokeAccessToRecord(bytes32 _recordId, address _providerAddress) external',
  'function grantGeneralAccessToProvider(bytes32 _patientId, address _providerAddress, uint256 _durationInSeconds) external',
  'function revokeGeneralAccessToProvider(bytes32 _patientId, address _providerAddress) external',
  'function checkAccess(bytes32 _recordId, address _accessorAddress) external view returns (bool)',
  'function getProvidersWithAccess(bytes32 _patientId) external view returns (address[])',
  'function getPatientsGrantedAccessTo(address _providerAddress) external view returns (bytes32[])',
  
  // Legacy consent functions
  'function grantConsent(bytes32 _patientId, address _grantedTo, uint8 _consentType, uint8[] _allowedRecordTypes, uint256 _expiryTimestamp) external',
  'function revokeConsent(bytes32 _patientId, address _revokeFrom) external',
  'function isConsentValid(bytes32 _patientId, address _grantedTo) external view returns (bool)',
  
  // Admin functions
  'function addAdmin(address _admin) external',
  'function removeAdmin(address _admin) external',
  'function isAdmin(address _user) external view returns (bool)',
  
  // Emergency access
  'function grantEmergencyAccess(address _provider) external',
  'function revokeEmergencyAccess(address _provider) external',
  'function hasEmergencyAccess(address _provider) external view returns (bool)',
  
  // Events
  'event AccessGranted(bytes32 indexed recordId, bytes32 indexed patientId, address indexed providerAddress, uint256 expiryTimestamp)',
  'event AccessRevoked(bytes32 indexed recordId, bytes32 indexed patientId, address indexed providerAddress)',
  'event GeneralAccessGranted(bytes32 indexed patientId, address indexed providerAddress, uint256 expiryTimestamp)',
  'event GeneralAccessRevoked(bytes32 indexed patientId, address indexed providerAddress)',
  'event RoleAssigned(address indexed user, uint8 role)',
  'event ConsentGranted(bytes32 indexed patientId, address indexed grantedTo, uint8 consentType)',
  'event ConsentRevoked(bytes32 indexed patientId, address indexed revokedFrom)'
];

// =============================================
// ACCESS CONTROL HANDLER CLASS
// =============================================

export class AccessControlHandler {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private contractAddress: string;
  private config: AccessControlConfig;

  constructor(config: AccessControlConfig, signer?: ethers.Signer) {
    this.config = config;
    this.contractAddress = config.contractAddress;
    
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    
    // Initialize contract with signer or provider
    this.contract = new ethers.Contract(
      this.contractAddress,
      ACCESS_CONTROL_ABI,
      signer || this.provider
    );
  }

  // =============================================
  // RECORD-SPECIFIC ACCESS MANAGEMENT
  // =============================================

  /**
   * Grant access to a specific record for a provider
   * @param request - Access request details
   * @returns Access grant result
   */
  async grantAccessToRecord(request: AccessRequest): Promise<AccessGrantResult> {
    try {
      console.log('Granting record access:', request);

      // Validate request
      this.validateAccessRequest(request);

      // Convert record ID to bytes32
      const recordIdBytes32 = this.stringToBytes32(request.recordId);

      // Call contract function
      const tx = await this.contract.grantAccessToRecord(
        recordIdBytes32,
        request.providerAddress,
        request.durationInSeconds
      );

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      
      const expiryTimestamp = request.durationInSeconds === 0 
        ? 0 
        : Math.floor(Date.now() / 1000) + request.durationInSeconds;

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        expiryTimestamp
      };
    } catch (error: any) {
      console.error('Failed to grant record access:', error);
      return {
        success: false,
        transactionHash: '',
        expiryTimestamp: 0,
        error: error.message
      };
    }
  }

  /**
   * Revoke access to a specific record
   * @param request - Revocation request details
   * @returns Access revoke result
   */
  async revokeAccessToRecord(request: AccessRevocationRequest): Promise<AccessRevokeResult> {
    try {
      console.log('Revoking record access:', request);

      if (!request.recordId) {
        throw new AccessControlException(
          AccessControlError.VALIDATION_ERROR,
          'Record ID is required for record-specific revocation'
        );
      }

      // Convert record ID to bytes32
      const recordIdBytes32 = this.stringToBytes32(request.recordId);

      // Call contract function
      const tx = await this.contract.revokeAccessToRecord(
        recordIdBytes32,
        request.providerAddress
      );

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error: any) {
      console.error('Failed to revoke record access:', error);
      return {
        success: false,
        transactionHash: '',
        error: error.message
      };
    }
  }

  // =============================================
  // GENERAL PROVIDER ACCESS MANAGEMENT
  // =============================================

  /**
   * Grant general access to a provider for all patient records
   * @param request - General access request details
   * @returns Access grant result
   */
  async grantGeneralAccessToProvider(request: GeneralAccessRequest): Promise<AccessGrantResult> {
    try {
      console.log('Granting general provider access:', request);

      // Validate request
      this.validateGeneralAccessRequest(request);

      // Convert patient ID to bytes32
      const patientIdBytes32 = this.stringToBytes32(request.patientId);

      // Call contract function
      const tx = await this.contract.grantGeneralAccessToProvider(
        patientIdBytes32,
        request.providerAddress,
        request.durationInSeconds
      );

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();
      
      const expiryTimestamp = request.durationInSeconds === 0 
        ? 0 
        : Math.floor(Date.now() / 1000) + request.durationInSeconds;

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        expiryTimestamp
      };
    } catch (error: any) {
      console.error('Failed to grant general provider access:', error);
      return {
        success: false,
        transactionHash: '',
        expiryTimestamp: 0,
        error: error.message
      };
    }
  }

  /**
   * Revoke general access from a provider
   * @param request - Revocation request details
   * @returns Access revoke result
   */
  async revokeGeneralAccessToProvider(request: AccessRevocationRequest): Promise<AccessRevokeResult> {
    try {
      console.log('Revoking general provider access:', request);

      if (!request.patientId) {
        throw new AccessControlException(
          AccessControlError.VALIDATION_ERROR,
          'Patient ID is required for general access revocation'
        );
      }

      // Convert patient ID to bytes32
      const patientIdBytes32 = this.stringToBytes32(request.patientId);

      // Call contract function
      const tx = await this.contract.revokeGeneralAccessToProvider(
        patientIdBytes32,
        request.providerAddress
      );

      console.log('Transaction submitted:', tx.hash);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error: any) {
      console.error('Failed to revoke general provider access:', error);
      return {
        success: false,
        transactionHash: '',
        error: error.message
      };
    }
  }

  // =============================================
  // ACCESS CHECKING
  // =============================================

  /**
   * Check if an accessor has access to a specific record
   * @param recordId - Record identifier
   * @param accessorAddress - Address of the accessor
   * @returns Access check result
   */
  async checkAccess(recordId: string, accessorAddress: string): Promise<AccessCheckResult> {
    try {
      console.log(`Checking access for record ${recordId} by ${accessorAddress}`);

      // Validate inputs
      if (!this.isValidAddress(accessorAddress)) {
        throw new AccessControlException(
          AccessControlError.INVALID_ADDRESS,
          'Invalid accessor address'
        );
      }

      // Convert record ID to bytes32
      const recordIdBytes32 = this.stringToBytes32(recordId);

      // Call contract function
      const hasAccess = await this.contract.checkAccess(recordIdBytes32, accessorAddress);

      return {
        hasAccess,
        reason: hasAccess ? 'Access granted' : 'Access denied'
      };
    } catch (error: any) {
      console.error('Failed to check access:', error);
      return {
        hasAccess: false,
        reason: `Error checking access: ${error.message}`
      };
    }
  }

  // =============================================
  // PROVIDER AND PATIENT QUERIES
  // =============================================

  /**
   * Get list of providers with access to a patient's records
   * @param patientId - Patient identifier
   * @returns Providers with access result
   */
  async getProvidersWithAccess(patientId: string): Promise<ProvidersWithAccessResult> {
    try {
      console.log(`Getting providers with access for patient ${patientId}`);

      // Convert patient ID to bytes32
      const patientIdBytes32 = this.stringToBytes32(patientId);

      // Call contract function
      const providers = await this.contract.getProvidersWithAccess(patientIdBytes32);

      return {
        providers: providers.map((addr: string) => addr),
        totalCount: providers.length
      };
    } catch (error: any) {
      console.error('Failed to get providers with access:', error);
      throw new AccessControlException(
        AccessControlError.CONTRACT_ERROR,
        `Failed to get providers with access: ${error.message}`,
        { patientId }
      );
    }
  }

  /**
   * Get list of patients who have granted access to a provider
   * @param providerAddress - Provider's address
   * @returns Patients granted access result
   */
  async getPatientsGrantedAccessTo(providerAddress: string): Promise<PatientsGrantedAccessResult> {
    try {
      console.log(`Getting patients who granted access to provider ${providerAddress}`);

      // Validate provider address
      if (!this.isValidAddress(providerAddress)) {
        throw new AccessControlException(
          AccessControlError.INVALID_ADDRESS,
          'Invalid provider address'
        );
      }

      // Call contract function
      const patients = await this.contract.getPatientsGrantedAccessTo(providerAddress);

      return {
        patients: patients.map((id: string) => this.bytes32ToString(id)),
        totalCount: patients.length
      };
    } catch (error: any) {
      console.error('Failed to get patients granted access:', error);
      throw new AccessControlException(
        AccessControlError.CONTRACT_ERROR,
        `Failed to get patients granted access: ${error.message}`,
        { providerAddress }
      );
    }
  }

  // =============================================
  // ROLE MANAGEMENT
  // =============================================

  /**
   * Assign a role to a user
   * @param userAddress - User's address
   * @param role - Role to assign
   * @returns Transaction hash
   */
  async assignRole(userAddress: string, role: Role): Promise<string> {
    try {
      console.log(`Assigning role ${role} to ${userAddress}`);

      if (!this.isValidAddress(userAddress)) {
        throw new AccessControlException(
          AccessControlError.INVALID_ADDRESS,
          'Invalid user address'
        );
      }

      const tx = await this.contract.assignRole(userAddress, role);
      const receipt = await tx.wait();
      
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('Failed to assign role:', error);
      throw new AccessControlException(
        AccessControlError.CONTRACT_ERROR,
        `Failed to assign role: ${error.message}`,
        { userAddress, role }
      );
    }
  }

  /**
   * Get the role of a user
   * @param userAddress - User's address
   * @returns User's role
   */
  async getRole(userAddress: string): Promise<Role> {
    try {
      if (!this.isValidAddress(userAddress)) {
        throw new AccessControlException(
          AccessControlError.INVALID_ADDRESS,
          'Invalid user address'
        );
      }

      const role = await this.contract.getRole(userAddress);
      return role as Role;
    } catch (error: any) {
      console.error('Failed to get role:', error);
      throw new AccessControlException(
        AccessControlError.CONTRACT_ERROR,
        `Failed to get role: ${error.message}`,
        { userAddress }
      );
    }
  }

  // =============================================
  // EVENT LISTENING
  // =============================================

  /**
   * Listen for AccessGranted events
   * @param callback - Callback function to handle events
   */
  onAccessGranted(callback: (event: AccessGrantedEvent) => void): void {
    this.contract.on('AccessGranted', (recordId, patientId, providerAddress, expiryTimestamp, event) => {
      const accessEvent: AccessGrantedEvent = {
        recordId: this.bytes32ToString(recordId),
        patientId: this.bytes32ToString(patientId),
        providerAddress,
        expiryTimestamp: Number(expiryTimestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      };
      callback(accessEvent);
    });
  }

  /**
   * Listen for AccessRevoked events
   * @param callback - Callback function to handle events
   */
  onAccessRevoked(callback: (event: AccessRevokedEvent) => void): void {
    this.contract.on('AccessRevoked', (recordId, patientId, providerAddress, event) => {
      const accessEvent: AccessRevokedEvent = {
        recordId: this.bytes32ToString(recordId),
        patientId: this.bytes32ToString(patientId),
        providerAddress,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      };
      callback(accessEvent);
    });
  }

  /**
   * Listen for GeneralAccessGranted events
   * @param callback - Callback function to handle events
   */
  onGeneralAccessGranted(callback: (event: GeneralAccessGrantedEvent) => void): void {
    this.contract.on('GeneralAccessGranted', (patientId, providerAddress, expiryTimestamp, event) => {
      const accessEvent: GeneralAccessGrantedEvent = {
        patientId: this.bytes32ToString(patientId),
        providerAddress,
        expiryTimestamp: Number(expiryTimestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      };
      callback(accessEvent);
    });
  }

  /**
   * Listen for GeneralAccessRevoked events
   * @param callback - Callback function to handle events
   */
  onGeneralAccessRevoked(callback: (event: GeneralAccessRevokedEvent) => void): void {
    this.contract.on('GeneralAccessRevoked', (patientId, providerAddress, event) => {
      const accessEvent: GeneralAccessRevokedEvent = {
        patientId: this.bytes32ToString(patientId),
        providerAddress,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      };
      callback(accessEvent);
    });
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Validate access request
   * @param request - Access request to validate
   */
  private validateAccessRequest(request: AccessRequest): void {
    if (!request.recordId) {
      throw new AccessControlException(
        AccessControlError.VALIDATION_ERROR,
        'Record ID is required'
      );
    }

    if (!this.isValidAddress(request.providerAddress)) {
      throw new AccessControlException(
        AccessControlError.INVALID_ADDRESS,
        'Invalid provider address'
      );
    }

    if (request.durationInSeconds < 0) {
      throw new AccessControlException(
        AccessControlError.INVALID_DURATION,
        'Duration cannot be negative'
      );
    }
  }

  /**
   * Validate general access request
   * @param request - General access request to validate
   */
  private validateGeneralAccessRequest(request: GeneralAccessRequest): void {
    if (!request.patientId) {
      throw new AccessControlException(
        AccessControlError.VALIDATION_ERROR,
        'Patient ID is required'
      );
    }

    if (!this.isValidAddress(request.providerAddress)) {
      throw new AccessControlException(
        AccessControlError.INVALID_ADDRESS,
        'Invalid provider address'
      );
    }

    if (request.durationInSeconds < 0) {
      throw new AccessControlException(
        AccessControlError.INVALID_DURATION,
        'Duration cannot be negative'
      );
    }
  }

  /**
   * Check if address is valid
   * @param address - Address to validate
   * @returns Boolean indicating validity
   */
  private isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Convert string to bytes32
   * @param str - String to convert
   * @returns Bytes32 representation
   */
  private stringToBytes32(str: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  /**
   * Convert bytes32 to string (simplified for display)
   * @param bytes32 - Bytes32 to convert
   * @returns String representation
   */
  private bytes32ToString(bytes32: string): string {
    // For now, we'll return the hex string directly
    // In a real implementation, you might want to decode this properly
    return bytes32;
  }

  /**
   * Create an AccessControl exception
   * @param errorType - Type of error
   * @param message - Error message
   * @param context - Additional context
   * @returns AccessControl exception
   */
  private createException(
    errorType: AccessControlError,
    message: string,
    context?: any
  ): AccessControlException {
    return new AccessControlException(errorType, message, context);
  }
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Create an AccessControlHandler instance with configuration
 * @param config - Access control configuration
 * @param signer - Optional ethers signer
 * @returns AccessControlHandler instance
 */
export function createAccessControlHandler(
  config: AccessControlConfig,
  signer?: ethers.Signer
): AccessControlHandler {
  return new AccessControlHandler(config, signer);
}

/**
 * Grant access to a record (convenience function)
 * @param handler - AccessControlHandler instance
 * @param recordId - Record ID
 * @param providerAddress - Provider address
 * @param durationInSeconds - Duration in seconds
 * @returns Access grant result
 */
export async function grantRecordAccess(
  handler: AccessControlHandler,
  recordId: string,
  providerAddress: string,
  durationInSeconds: number
): Promise<AccessGrantResult> {
  return await handler.grantAccessToRecord({
    recordId,
    providerAddress,
    durationInSeconds
  });
}

/**
 * Check record access (convenience function)
 * @param handler - AccessControlHandler instance
 * @param recordId - Record ID
 * @param accessorAddress - Accessor address
 * @returns Access check result
 */
export async function checkRecordAccess(
  handler: AccessControlHandler,
  recordId: string,
  accessorAddress: string
): Promise<AccessCheckResult> {
  return await handler.checkAccess(recordId, accessorAddress);
}