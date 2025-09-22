/**
 * Medical Records Contract Interface
 * 
 * Handles all blockchain interactions with the MedicalRecords.sol smart contract
 * including record uploads, metadata retrieval, CID updates, and event monitoring.
 */

import { ethers } from 'ethers';
import {
  MedicalRecordType,
  RecordSensitivityLevel,
  MedicalRecordMetadata,
  MedicalRecordContractUploadParams,
  RecordCIDUpdateParams,
  RecordUploadedEvent,
  RecordCIDUpdatedEvent,
  RecordAccessedEvent,
  MedicalRecordManagementError,
  MedicalRecordManagementException,
  GasEstimationResult
} from './types';

// =============================================
// CONTRACT ABI
// =============================================

export const MEDICAL_RECORDS_ABI = [
  // Upload functions
  {
    "inputs": [
      {"internalType": "string", "name": "patientId", "type": "string"},
      {"internalType": "string", "name": "providerId", "type": "string"},
      {"internalType": "string", "name": "recordType", "type": "string"},
      {"internalType": "string", "name": "recordTitle", "type": "string"},
      {"internalType": "string", "name": "recordCID", "type": "string"},
      {"internalType": "bool", "name": "isSensitive", "type": "bool"}
    ],
    "name": "uploadMedicalRecord",
    "outputs": [{"internalType": "bytes32", "name": "recordId", "type": "bytes32"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"internalType": "string", "name": "newRecordCID", "type": "string"}
    ],
    "name": "updateRecordCID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // View functions
  {
    "inputs": [{"internalType": "bytes32", "name": "recordId", "type": "bytes32"}],
    "name": "getRecordMetadata",
    "outputs": [
      {
        "components": [
          {"internalType": "bytes32", "name": "recordId", "type": "bytes32"},
          {"internalType": "string", "name": "patientId", "type": "string"},
          {"internalType": "string", "name": "providerId", "type": "string"},
          {"internalType": "string", "name": "recordType", "type": "string"},
          {"internalType": "string", "name": "recordTitle", "type": "string"},
          {"internalType": "string", "name": "recordCID", "type": "string"},
          {"internalType": "bool", "name": "isSensitive", "type": "bool"},
          {"internalType": "uint8", "name": "sensitivityLevel", "type": "uint8"},
          {"internalType": "uint256", "name": "uploadTimestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "lastUpdated", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "accessCount", "type": "uint256"},
          {"internalType": "uint256", "name": "fileCount", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSize", "type": "uint256"}
        ],
        "internalType": "struct MedicalRecords.MedicalRecordMetadata",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "patientId", "type": "string"}],
    "name": "getPatientRecordIds",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "providerId", "type": "string"}],
    "name": "getProviderRecordIds",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "recordId", "type": "bytes32"}],
    "name": "recordExists",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalRecords",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Access control functions
  {
    "inputs": [
      {"internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "hasRecordAccess",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "grantRecordAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"internalType": "address", "name": "user", "type": "address"}
    ],
    "name": "revokeRecordAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"indexed": true, "internalType": "string", "name": "patientId", "type": "string"},
      {"indexed": true, "internalType": "string", "name": "providerId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "recordType", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "recordCID", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RecordUploaded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"indexed": false, "internalType": "string", "name": "newRecordCID", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RecordCIDUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "accessedBy", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "accessType", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RecordAccessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "recordId", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "grantedBy", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RecordAccessGranted",
    "type": "event"
  }
];

// =============================================
// CONTRACT INTERFACE RESULTS
// =============================================

interface MedicalRecordUploadResult {
  transaction: ethers.ContractTransactionResponse;
  recordId: string;
  gasUsed?: number;
}

interface RecordCIDUpdateResult {
  transaction: ethers.ContractTransactionResponse;
  recordId: string;
  oldCID: string;
  newCID: string;
  gasUsed?: number;
}

interface RecordAccessResult {
  transaction: ethers.ContractTransactionResponse;
  recordId: string;
  user: string;
  granted: boolean;
  gasUsed?: number;
}

// =============================================
// MEDICAL RECORDS CONTRACT CLASS
// =============================================

export class MedicalRecordsContract {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private provider: ethers.Provider;

  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ) {
    this.contract = new ethers.Contract(contractAddress, MEDICAL_RECORDS_ABI, signerOrProvider);
    
    if ('signTransaction' in signerOrProvider) {
      this.signer = signerOrProvider as ethers.Signer;
      this.provider = signerOrProvider.provider!;
    } else {
      this.provider = signerOrProvider as ethers.Provider;
    }
  }

  // =============================================
  // MEDICAL RECORD UPLOAD
  // =============================================

  /**
   * Upload a new medical record to the blockchain
   * @param params - Medical record upload parameters
   * @returns Upload result with transaction details
   */
  async uploadMedicalRecord(params: MedicalRecordContractUploadParams): Promise<MedicalRecordUploadResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          MedicalRecordManagementError.AUTHORIZATION_ERROR,
          'Signer required for medical record upload'
        );
      }

      console.log('Estimating gas for medical record upload...');
      const gasEstimate = await this.estimateGasForUpload(params);
      
      console.log('Executing medical record upload transaction...');
      const transaction = await this.contract.uploadMedicalRecord(
        params.patientId,
        params.providerId,
        params.recordType,
        params.recordTitle,
        params.recordCID,
        params.isSensitive,
        {
          gasLimit: Math.floor(gasEstimate.estimatedGas * 1.2), // 20% buffer
        }
      );

      // Extract record ID from transaction events
      const recordId = await this.extractRecordIdFromTransaction(transaction);

      return {
        transaction,
        recordId,
      };
    } catch (error: any) {
      console.error('Medical record upload failed:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Medical record upload failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Update medical record CID on the blockchain
   * @param params - Record CID update parameters
   * @returns Update result with transaction details
   */
  async updateRecordCID(params: RecordCIDUpdateParams): Promise<RecordCIDUpdateResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          MedicalRecordManagementError.AUTHORIZATION_ERROR,
          'Signer required for record CID update'
        );
      }

      // Get current record metadata to capture old CID
      const currentRecord = await this.getRecordMetadata(params.recordId);
      
      console.log('Estimating gas for record CID update...');
      const gasEstimate = await this.estimateGasForCIDUpdate(params);
      
      console.log('Executing record CID update transaction...');
      const transaction = await this.contract.updateRecordCID(
        params.recordId,
        params.newRecordCID,
        {
          gasLimit: Math.floor(gasEstimate.estimatedGas * 1.2), // 20% buffer
        }
      );

      return {
        transaction,
        recordId: params.recordId,
        oldCID: currentRecord.recordCID,
        newCID: params.newRecordCID,
      };
    } catch (error: any) {
      console.error('Record CID update failed:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Record CID update failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  // =============================================
  // VIEW FUNCTIONS
  // =============================================

  /**
   * Get medical record metadata from blockchain
   * @param recordId - Record identifier
   * @returns Medical record metadata
   */
  async getRecordMetadata(recordId: string): Promise<MedicalRecordMetadata> {
    try {
      console.log(`Fetching record metadata for ID: ${recordId}`);
      
      const result = await this.contract.getRecordMetadata(recordId);
      
      return {
        recordId: result[0],
        patientId: result[1],
        providerId: result[2],
        recordType: result[3] as MedicalRecordType,
        recordTitle: result[4],
        recordCID: result[5],
        isSensitive: result[6],
        sensitivityLevel: result[7] as RecordSensitivityLevel,
        uploadTimestamp: Number(result[8]),
        lastUpdated: Number(result[9]),
        isActive: result[10],
        accessCount: Number(result[11]),
        fileCount: Number(result[12]),
        totalSize: Number(result[13]),
      };
    } catch (error: any) {
      console.error('Failed to fetch record metadata:', error);
      throw this.createException(
        MedicalRecordManagementError.RECORD_NOT_FOUND,
        `Record not found for ID: ${recordId}`,
        { originalError: error, recordId }
      );
    }
  }

  /**
   * Get all record IDs for a patient
   * @param patientId - Patient identifier
   * @returns Array of record IDs
   */
  async getPatientRecordIds(patientId: string): Promise<string[]> {
    try {
      console.log(`Fetching record IDs for patient: ${patientId}`);
      const result = await this.contract.getPatientRecordIds(patientId);
      return result.map((id: any) => id.toString());
    } catch (error: any) {
      console.error('Failed to fetch patient record IDs:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Failed to fetch record IDs for patient: ${patientId}`,
        { originalError: error, patientId }
      );
    }
  }

  /**
   * Get all record IDs for a provider
   * @param providerId - Provider identifier
   * @returns Array of record IDs
   */
  async getProviderRecordIds(providerId: string): Promise<string[]> {
    try {
      console.log(`Fetching record IDs for provider: ${providerId}`);
      const result = await this.contract.getProviderRecordIds(providerId);
      return result.map((id: any) => id.toString());
    } catch (error: any) {
      console.error('Failed to fetch provider record IDs:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Failed to fetch record IDs for provider: ${providerId}`,
        { originalError: error, providerId }
      );
    }
  }

  /**
   * Check if a record exists
   * @param recordId - Record identifier
   * @returns Boolean indicating existence
   */
  async recordExists(recordId: string): Promise<boolean> {
    try {
      return await this.contract.recordExists(recordId);
    } catch (error: any) {
      console.error('Failed to check record existence:', error);
      return false;
    }
  }

  /**
   * Get total number of records in the system
   * @returns Total record count
   */
  async getTotalRecords(): Promise<number> {
    try {
      const result = await this.contract.getTotalRecords();
      return Number(result);
    } catch (error: any) {
      console.error('Failed to get total records:', error);
      return 0;
    }
  }

  // =============================================
  // ACCESS CONTROL
  // =============================================

  /**
   * Check if a user has access to a record
   * @param recordId - Record identifier
   * @param userAddress - User wallet address
   * @returns Boolean indicating access
   */
  async hasRecordAccess(recordId: string, userAddress: string): Promise<boolean> {
    try {
      return await this.contract.hasRecordAccess(recordId, userAddress);
    } catch (error: any) {
      console.error('Failed to check record access:', error);
      return false;
    }
  }

  /**
   * Grant access to a record
   * @param recordId - Record identifier
   * @param userAddress - User wallet address
   * @returns Access grant result
   */
  async grantRecordAccess(recordId: string, userAddress: string): Promise<RecordAccessResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          MedicalRecordManagementError.AUTHORIZATION_ERROR,
          'Signer required for granting record access'
        );
      }

      console.log('Granting record access...');
      const transaction = await this.contract.grantRecordAccess(recordId, userAddress);

      return {
        transaction,
        recordId,
        user: userAddress,
        granted: true,
      };
    } catch (error: any) {
      console.error('Failed to grant record access:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Failed to grant record access: ${error.message}`,
        { originalError: error, recordId, userAddress }
      );
    }
  }

  /**
   * Revoke access to a record
   * @param recordId - Record identifier
   * @param userAddress - User wallet address
   * @returns Access revoke result
   */
  async revokeRecordAccess(recordId: string, userAddress: string): Promise<RecordAccessResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          MedicalRecordManagementError.AUTHORIZATION_ERROR,
          'Signer required for revoking record access'
        );
      }

      console.log('Revoking record access...');
      const transaction = await this.contract.revokeRecordAccess(recordId, userAddress);

      return {
        transaction,
        recordId,
        user: userAddress,
        granted: false,
      };
    } catch (error: any) {
      console.error('Failed to revoke record access:', error);
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Failed to revoke record access: ${error.message}`,
        { originalError: error, recordId, userAddress }
      );
    }
  }

  // =============================================
  // GAS ESTIMATION
  // =============================================

  /**
   * Estimate gas for medical record upload
   * @param params - Upload parameters
   * @returns Gas estimation result
   */
  async estimateGasForUpload(params: MedicalRecordContractUploadParams): Promise<GasEstimationResult> {
    try {
      const gasEstimate = await this.contract.uploadMedicalRecord.estimateGas(
        params.patientId,
        params.providerId,
        params.recordType,
        params.recordTitle,
        params.recordCID,
        params.isSensitive
      );
      
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const totalCost = gasEstimate * gasPrice;
      
      return {
        estimatedGas: Number(gasEstimate),
        gasPrice: gasPrice,
        totalCost: totalCost,
        totalCostETH: ethers.formatEther(totalCost),
      };
    } catch (error: any) {
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Gas estimation failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Estimate gas for record CID update
   * @param params - Update parameters
   * @returns Gas estimation result
   */
  async estimateGasForCIDUpdate(params: RecordCIDUpdateParams): Promise<GasEstimationResult> {
    try {
      const gasEstimate = await this.contract.updateRecordCID.estimateGas(
        params.recordId,
        params.newRecordCID
      );
      
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const totalCost = gasEstimate * gasPrice;
      
      return {
        estimatedGas: Number(gasEstimate),
        gasPrice: gasPrice,
        totalCost: totalCost,
        totalCostETH: ethers.formatEther(totalCost),
      };
    } catch (error: any) {
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Gas estimation failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  // =============================================
  // EVENT MONITORING
  // =============================================

  /**
   * Listen for record uploaded events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onRecordUploaded(callback: (event: RecordUploadedEvent) => void): () => void {
    const listener = (recordId: string, patientId: string, providerId: string, recordType: string, recordCID: string, timestamp: number, event: any) => {
      const uploadEvent: RecordUploadedEvent = {
        recordId,
        patientId,
        providerId,
        recordType: recordType as MedicalRecordType,
        recordCID,
        timestamp: Number(timestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
      callback(uploadEvent);
    };

    this.contract.on('RecordUploaded', listener);
    
    return () => {
      this.contract.off('RecordUploaded', listener);
    };
  }

  /**
   * Listen for record CID updated events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onRecordCIDUpdated(callback: (event: RecordCIDUpdatedEvent) => void): () => void {
    const listener = (recordId: string, newRecordCID: string, timestamp: number, event: any) => {
      const updateEvent: RecordCIDUpdatedEvent = {
        recordId,
        oldRecordCID: '', // Would need to track this separately
        newRecordCID,
        updatedBy: '', // Would need to get from transaction
        timestamp: Number(timestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
      callback(updateEvent);
    };

    this.contract.on('RecordCIDUpdated', listener);
    
    return () => {
      this.contract.off('RecordCIDUpdated', listener);
    };
  }

  /**
   * Listen for record accessed events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onRecordAccessed(callback: (event: RecordAccessedEvent) => void): () => void {
    const listener = (recordId: string, accessedBy: string, accessType: string, timestamp: number, event: any) => {
      const accessEvent: RecordAccessedEvent = {
        recordId,
        accessedBy,
        accessType,
        timestamp: Number(timestamp),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      };
      callback(accessEvent);
    };

    this.contract.on('RecordAccessed', listener);
    
    return () => {
      this.contract.off('RecordAccessed', listener);
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get signer address if available
   * @returns Signer address or null
   */
  async getSignerAddress(): Promise<string | null> {
    try {
      return this.signer ? await this.signer.getAddress() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract record ID from transaction receipt
   * @param transaction - Contract transaction
   * @returns Record ID from events
   */
  private async extractRecordIdFromTransaction(transaction: ethers.ContractTransactionResponse): Promise<string> {
    try {
      const receipt = await transaction.wait();
      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'RecordUploaded';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('RecordUploaded event not found in transaction');
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      return parsedEvent?.args.recordId || '';
    } catch (error: any) {
      throw this.createException(
        MedicalRecordManagementError.CONTRACT_ERROR,
        `Failed to extract record ID: ${error.message}`,
        { originalError: error, transactionHash: transaction.hash }
      );
    }
  }

  /**
   * Create a medical record management exception
   * @param errorType - Type of error
   * @param message - Error message
   * @param context - Additional context
   * @returns Medical record management exception
   */
  private createException(
    errorType: MedicalRecordManagementError,
    message: string,
    context?: any
  ): MedicalRecordManagementException {
    return new MedicalRecordManagementException(errorType, message, context);
  }
}