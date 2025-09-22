
/**
//estimates gas cost, executes blockchain transaction, extracts patient ID 
//  * Patient Registry Contract Interface
 * 
 * TypeScript interface and contract interaction class for PatientRegistry.sol
 * Handles all blockchain interactions for patient management.
 */

import { ethers } from 'ethers';
import {
  PatientProfileContract,
  PatientRegistrationParams,
  PatientProfileUpdateParams,
  PatientRegisteredEvent,
  PatientProfileUpdatedEvent,
  PatientManagementError,
  PatientManagementException
} from './types.js';

// =============================================
// PATIENT REGISTRY CONTRACT ABI
// =============================================

export const PATIENT_REGISTRY_ABI = [
  // Registration function
  {
    "inputs": [
      {"internalType": "string", "name": "patientDetailsCID", "type": "string"}
    ],
    "name": "registerPatient",
    "outputs": [
      {"internalType": "uint256", "name": "patientId", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Profile update function
  {
    "inputs": [
      {"internalType": "string", "name": "newPatientDetailsCID", "type": "string"}
    ],
    "name": "updatePatientProfileCID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Profile retrieval function
  {
    "inputs": [
      {"internalType": "address", "name": "patientAddress", "type": "address"}
    ],
    "name": "getPatientProfile",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "patientId", "type": "uint256"},
          {"internalType": "address", "name": "patientWallet", "type": "address"},
          {"internalType": "string", "name": "medicalProfileCID", "type": "string"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "uint256", "name": "registrationTimestamp", "type": "uint256"}
        ],
        "internalType": "struct PatientRegistry.PatientProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patientWallet", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "patientId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "patientDetailsCID", "type": "string"}
    ],
    "name": "PatientRegistered",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "patientWallet", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "patientId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "newPatientDetailsCID", "type": "string"}
    ],
    "name": "PatientProfileUpdated",
    "type": "event"
  }
] as const;

// =============================================
// PATIENT REGISTRY CONTRACT CLASS
// =============================================

export class PatientRegistryContract {
  private contract: ethers.Contract;
  private signer: ethers.Signer;
  private provider: ethers.Provider;

  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ) {
    this.contract = new ethers.Contract(contractAddress, PATIENT_REGISTRY_ABI, signerOrProvider);
    
    if ('getAddress' in signerOrProvider) {
      this.signer = signerOrProvider as ethers.Signer;
      this.provider = signerOrProvider.provider!;
    } else {
      this.provider = signerOrProvider as ethers.Provider;
    }
  }

  // =============================================
  // PATIENT REGISTRATION
  // =============================================

  /**
   * Register a new patient on the blockchain
   * @param params - Patient registration parameters
   * @returns Transaction response and patient ID
   */
  async registerPatient(params: PatientRegistrationParams): Promise<{
    transaction: ethers.ContractTransactionResponse;
    patientId: string;
  }> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for patient registration');
      }

      // Validate CID format
      if (!this.isValidIPFSCID(params.patientDetailsCID)) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Invalid IPFS CID format',
          { cid: params.patientDetailsCID }
        );
      }

      // Execute registration transaction
      const transaction = await this.contract.registerPatient(params.patientDetailsCID);
      
      // Wait for transaction to be mined and get receipt
      const receipt = await transaction.wait();
      
      // Extract patient ID from logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'PatientRegistered';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw this.createException(
          PatientManagementError.BLOCKCHAIN_TRANSACTION_FAILED,
          'PatientRegistered event not found in transaction receipt'
        );
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      const patientId = parsedEvent?.args.patientId.toString();

      return {
        transaction,
        patientId
      };

    } catch (error) {
      throw this.handleContractError(error, 'registerPatient');
    }
  }

  // =============================================
  // PATIENT PROFILE UPDATE
  // =============================================

  /**
   * Update patient profile CID on the blockchain
   * @param params - Profile update parameters
   * @returns Transaction response
   */
  async updatePatientProfileCID(params: PatientProfileUpdateParams): Promise<ethers.ContractTransactionResponse> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for profile update');
      }

      // Validate CID format
      if (!this.isValidIPFSCID(params.newPatientDetailsCID)) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Invalid IPFS CID format',
          { cid: params.newPatientDetailsCID }
        );
      }

      // Execute update transaction
      const transaction = await this.contract.updatePatientProfileCID(params.newPatientDetailsCID);
      
      return transaction;

    } catch (error) {
      throw this.handleContractError(error, 'updatePatientProfileCID');
    }
  }

  // =============================================
  // PATIENT PROFILE RETRIEVAL
  // =============================================

  /**
   * Get patient profile from the blockchain
   * @param patientAddress - Patient's wallet address
   * @returns Patient profile data from blockchain
   */
  async getPatientProfile(patientAddress: string): Promise<PatientProfileContract | null> {
    try {
      // Validate address format
      if (!ethers.isAddress(patientAddress)) {
        throw this.createException(
          PatientManagementError.VALIDATION_ERROR,
          'Invalid Ethereum address format',
          { address: patientAddress }
        );
      }

      // Call contract view function
      const profile = await this.contract.getPatientProfile(patientAddress);

      // Check if patient exists (patientId > 0)
      if (profile.patientId.toString() === '0') {
        return null;
      }

      // Format response
      return {
        patientId: profile.patientId.toString(),
        patientWallet: profile.patientWallet,
        medicalProfileCID: profile.medicalProfileCID,
        isActive: profile.isActive,
        registrationTimestamp: Number(profile.registrationTimestamp)
      };

    } catch (error) {
      throw this.handleContractError(error, 'getPatientProfile');
    }
  }

  // =============================================
  // EVENT HANDLING
  // =============================================

  /**
   * Listen for PatientRegistered events
   * @param callback - Function to call when event is emitted
   * @returns Event listener cleanup function
   */
  onPatientRegistered(callback: (event: PatientRegisteredEvent) => void): () => void {
    const eventFilter = this.contract.filters.PatientRegistered();
    
    const listener = async (patientWallet: string, patientId: ethers.BigNumberish, patientDetailsCID: string, eventLog: ethers.EventLog) => {
      const event: PatientRegisteredEvent = {
        patientWallet,
        patientId: patientId.toString(),
        patientDetailsCID,
        blockNumber: eventLog.blockNumber,
        transactionHash: eventLog.transactionHash,
        timestamp: Date.now() // In real implementation, get from block timestamp
      };
      callback(event);
    };

    this.contract.on(eventFilter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(eventFilter, listener);
    };
  }

  /**
   * Listen for PatientProfileUpdated events
   * @param callback - Function to call when event is emitted
   * @returns Event listener cleanup function
   */
  onPatientProfileUpdated(callback: (event: PatientProfileUpdatedEvent) => void): () => void {
    const eventFilter = this.contract.filters.PatientProfileUpdated();
    
    const listener = async (patientWallet: string, patientId: ethers.BigNumberish, newPatientDetailsCID: string, eventLog: ethers.EventLog) => {
      // Get previous CID from patient profile (you might need to store this differently)
      const profile = await this.getPatientProfile(patientWallet);
      
      const event: PatientProfileUpdatedEvent = {
        patientWallet,
        patientId: patientId.toString(),
        newPatientDetailsCID,
        previousCID: profile?.medicalProfileCID || '',
        blockNumber: eventLog.blockNumber,
        transactionHash: eventLog.transactionHash,
        timestamp: Date.now() // In real implementation, get from block timestamp
      };
      callback(event);
    };

    this.contract.on(eventFilter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(eventFilter, listener);
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get the contract address
   */
  getContractAddress(): string {
    return this.contract.target as string;
  }

  /**
   * Get the current signer address
   */
  async getSignerAddress(): Promise<string | null> {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }

  /**
   * Estimate gas for patient registration
   */
  async estimateRegistrationGas(patientDetailsCID: string): Promise<bigint> {
    return await this.contract.registerPatient.estimateGas(patientDetailsCID);
  }

  /**
   * Estimate gas for profile update
   */
  async estimateUpdateGas(newPatientDetailsCID: string): Promise<bigint> {
    return await this.contract.updatePatientProfileCID.estimateGas(newPatientDetailsCID);
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Validate IPFS CID format
   */
  private isValidIPFSCID(cid: string): boolean {
    // Basic CID validation (you might want to use a proper CID library)
    const cidRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[A-Za-z0-9]{46})$/;
    return cidRegex.test(cid);
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
   * Handle contract errors and convert to standardized exceptions
   */
  private handleContractError(error: any, functionName: string): never {
    console.error(`PatientRegistry.${functionName} error:`, error);

    if (error.code === 'CALL_EXCEPTION') {
      throw this.createException(
        PatientManagementError.BLOCKCHAIN_TRANSACTION_FAILED,
        `Contract call failed: ${error.reason || error.message}`,
        { function: functionName, originalError: error }
      );
    }

    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw this.createException(
        PatientManagementError.BLOCKCHAIN_TRANSACTION_FAILED,
        'Insufficient funds for transaction',
        { function: functionName }
      );
    }

    if (error.code === 'NETWORK_ERROR') {
      throw this.createException(
        PatientManagementError.NETWORK_ERROR,
        'Network connection error',
        { function: functionName, originalError: error }
      );
    }

    // Generic error handling
    throw this.createException(
      PatientManagementError.BLOCKCHAIN_TRANSACTION_FAILED,
      `Unexpected error in ${functionName}: ${error.message}`,
      { function: functionName, originalError: error }
    );
  }
}