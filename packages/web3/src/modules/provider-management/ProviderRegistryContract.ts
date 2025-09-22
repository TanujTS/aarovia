/**
 * Provider Registry Contract Interface
 * 
 * Handles all blockchain interactions with the ProviderRegistry.sol smart contract
 * including provider registration, profile updates, verification, and event monitoring.
 */

import { ethers } from 'ethers';
import {
  ProviderType,
  ProviderProfileContract,
  ProviderRegistrationParams,
  ProviderProfileUpdateParams,
  ProviderVerificationParams,
  ProviderRegisteredEvent,
  ProviderProfileUpdatedEvent,
  ProviderVerifiedEvent,
  ProviderManagementError,
  ProviderManagementException,
  GasEstimationResult
} from './types';

// =============================================
// CONTRACT ABI
// =============================================

export const PROVIDER_REGISTRY_ABI = [
  // Registration functions
  {
    "inputs": [
      {"internalType": "string", "name": "providerDetailsCID", "type": "string"},
      {"internalType": "string", "name": "providerType", "type": "string"}
    ],
    "name": "registerProvider",
    "outputs": [{"internalType": "string", "name": "providerId", "type": "string"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "newProviderDetailsCID", "type": "string"}],
    "name": "updateProviderProfileCID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "providerAddress", "type": "address"}],
    "name": "getProviderProfile",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "providerWallet", "type": "address"},
          {"internalType": "string", "name": "providerId", "type": "string"},
          {"internalType": "string", "name": "providerDetailsCID", "type": "string"},
          {"internalType": "string", "name": "providerType", "type": "string"},
          {"internalType": "bool", "name": "isVerified", "type": "bool"},
          {"internalType": "uint256", "name": "verificationTimestamp", "type": "uint256"},
          {"internalType": "uint256", "name": "registrationTimestamp", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct ProviderRegistry.ProviderProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "providerAddress", "type": "address"}],
    "name": "verifyProvider",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View functions
  {
    "inputs": [{"internalType": "address", "name": "providerAddress", "type": "address"}],
    "name": "isProviderRegistered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "providerAddress", "type": "address"}],
    "name": "isProviderVerified",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalProviders",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "providerWallet", "type": "address"},
      {"indexed": true, "internalType": "string", "name": "providerId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "providerDetailsCID", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "providerType", "type": "string"}
    ],
    "name": "ProviderRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "providerWallet", "type": "address"},
      {"indexed": true, "internalType": "string", "name": "providerId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "newProviderDetailsCID", "type": "string"}
    ],
    "name": "ProviderProfileUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "providerAddress", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "verifiedBy", "type": "address"}
    ],
    "name": "ProviderVerified",
    "type": "event"
  }
];

// =============================================
// CONTRACT INTERFACE RESULTS
// =============================================

interface ProviderRegistrationResult {
  transaction: ethers.ContractTransactionResponse;
  providerId: string;
  gasUsed?: number;
}

interface ProviderUpdateResult {
  transaction: ethers.ContractTransactionResponse;
  oldCID: string;
  newCID: string;
  gasUsed?: number;
}

interface ProviderVerificationResult {
  transaction: ethers.ContractTransactionResponse;
  providerAddress: string;
  verifiedBy: string;
  gasUsed?: number;
}

// =============================================
// PROVIDER REGISTRY CONTRACT CLASS
// =============================================

export class ProviderRegistryContract {
  private contract: ethers.Contract;
  private signer?: ethers.Signer;
  private provider: ethers.Provider;

  constructor(
    contractAddress: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ) {
    this.contract = new ethers.Contract(contractAddress, PROVIDER_REGISTRY_ABI, signerOrProvider);
    
    if ('signTransaction' in signerOrProvider) {
      this.signer = signerOrProvider as ethers.Signer;
      this.provider = signerOrProvider.provider!;
    } else {
      this.provider = signerOrProvider as ethers.Provider;
    }
  }

  // =============================================
  // PROVIDER REGISTRATION
  // =============================================

  /**
   * Register a new provider on the blockchain
   * @param params - Provider registration parameters
   * @returns Registration result with transaction details
   */
  async registerProvider(params: ProviderRegistrationParams): Promise<ProviderRegistrationResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          ProviderManagementError.AUTHORIZATION_ERROR,
          'Signer required for provider registration'
        );
      }

      console.log('Estimating gas for provider registration...');
      const gasEstimate = await this.estimateGasForRegistration(params);
      
      console.log('Executing provider registration transaction...');
      const transaction = await this.contract.registerProvider(
        params.providerDetailsCID,
        params.providerType,
        {
          gasLimit: Math.floor(gasEstimate.estimatedGas * 1.2), // 20% buffer
        }
      );

      // Extract provider ID from transaction events
      const providerId = await this.extractProviderIdFromTransaction(transaction);

      return {
        transaction,
        providerId,
      };
    } catch (error: any) {
      console.error('Provider registration failed:', error);
      throw this.createException(
        ProviderManagementError.CONTRACT_ERROR,
        `Provider registration failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Update provider profile CID on the blockchain
   * @param params - Provider update parameters
   * @returns Update result with transaction details
   */
  async updateProviderProfileCID(params: ProviderProfileUpdateParams): Promise<ProviderUpdateResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          ProviderManagementError.AUTHORIZATION_ERROR,
          'Signer required for provider profile update'
        );
      }

      // Get current provider profile to capture old CID
      const signerAddress = await this.signer.getAddress();
      const currentProfile = await this.getProviderProfile({ providerAddress: signerAddress });
      
      console.log('Estimating gas for provider profile update...');
      const gasEstimate = await this.estimateGasForUpdate(params);
      
      console.log('Executing provider profile update transaction...');
      const transaction = await this.contract.updateProviderProfileCID(
        params.newProviderDetailsCID,
        {
          gasLimit: Math.floor(gasEstimate.estimatedGas * 1.2), // 20% buffer
        }
      );

      return {
        transaction,
        oldCID: currentProfile.providerDetailsCID,
        newCID: params.newProviderDetailsCID,
      };
    } catch (error: any) {
      console.error('Provider profile update failed:', error);
      throw this.createException(
        ProviderManagementError.CONTRACT_ERROR,
        `Provider profile update failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Verify a provider (admin function)
   * @param params - Provider verification parameters
   * @returns Verification result with transaction details
   */
  async verifyProvider(params: ProviderVerificationParams): Promise<ProviderVerificationResult> {
    try {
      if (!this.signer) {
        throw this.createException(
          ProviderManagementError.AUTHORIZATION_ERROR,
          'Signer required for provider verification'
        );
      }

      const verifierAddress = await this.signer.getAddress();
      
      console.log('Estimating gas for provider verification...');
      const gasEstimate = await this.estimateGasForVerification(params);
      
      console.log('Executing provider verification transaction...');
      const transaction = await this.contract.verifyProvider(
        params.providerAddress,
        {
          gasLimit: Math.floor(gasEstimate.estimatedGas * 1.2), // 20% buffer
        }
      );

      return {
        transaction,
        providerAddress: params.providerAddress,
        verifiedBy: verifierAddress,
      };
    } catch (error: any) {
      console.error('Provider verification failed:', error);
      throw this.createException(
        ProviderManagementError.CONTRACT_ERROR,
        `Provider verification failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  // =============================================
  // VIEW FUNCTIONS
  // =============================================

  /**
   * Get provider profile from blockchain
   * @param params - Provider lookup parameters
   * @returns Provider profile from contract
   */
  async getProviderProfile(params: { providerAddress: string }): Promise<ProviderProfileContract> {
    try {
      console.log(`Fetching provider profile for address: ${params.providerAddress}`);
      
      const result = await this.contract.getProviderProfile(params.providerAddress);
      
      return {
        providerWallet: result[0],
        providerId: result[1],
        providerDetailsCID: result[2],
        providerType: result[3] as ProviderType,
        isVerified: result[4],
        verificationTimestamp: Number(result[5]),
        registrationTimestamp: Number(result[6]),
        isActive: result[7],
      };
    } catch (error: any) {
      console.error('Failed to fetch provider profile:', error);
      throw this.createException(
        ProviderManagementError.PROVIDER_NOT_FOUND,
        `Provider not found for address: ${params.providerAddress}`,
        { originalError: error, providerAddress: params.providerAddress }
      );
    }
  }

  /**
   * Check if provider is registered
   * @param providerAddress - Provider wallet address
   * @returns Boolean indicating registration status
   */
  async isProviderRegistered(providerAddress: string): Promise<boolean> {
    try {
      return await this.contract.isProviderRegistered(providerAddress);
    } catch (error: any) {
      console.error('Failed to check provider registration:', error);
      return false;
    }
  }

  /**
   * Check if provider is verified
   * @param providerAddress - Provider wallet address
   * @returns Boolean indicating verification status
   */
  async isProviderVerified(providerAddress: string): Promise<boolean> {
    try {
      return await this.contract.isProviderVerified(providerAddress);
    } catch (error: any) {
      console.error('Failed to check provider verification:', error);
      return false;
    }
  }

  /**
   * Get total number of registered providers
   * @returns Total provider count
   */
  async getTotalProviders(): Promise<number> {
    try {
      const result = await this.contract.getTotalProviders();
      return Number(result);
    } catch (error: any) {
      console.error('Failed to get total providers:', error);
      return 0;
    }
  }

  // =============================================
  // GAS ESTIMATION
  // =============================================

  /**
   * Estimate gas for provider registration
   * @param params - Registration parameters
   * @returns Gas estimation result
   */
  async estimateGasForRegistration(params: ProviderRegistrationParams): Promise<GasEstimationResult> {
    try {
      const gasEstimate = await this.contract.registerProvider.estimateGas(
        params.providerDetailsCID,
        params.providerType
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
        ProviderManagementError.CONTRACT_ERROR,
        `Gas estimation failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Estimate gas for provider profile update
   * @param params - Update parameters
   * @returns Gas estimation result
   */
  async estimateGasForUpdate(params: ProviderProfileUpdateParams): Promise<GasEstimationResult> {
    try {
      const gasEstimate = await this.contract.updateProviderProfileCID.estimateGas(
        params.newProviderDetailsCID
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
        ProviderManagementError.CONTRACT_ERROR,
        `Gas estimation failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  /**
   * Estimate gas for provider verification
   * @param params - Verification parameters
   * @returns Gas estimation result
   */
  async estimateGasForVerification(params: ProviderVerificationParams): Promise<GasEstimationResult> {
    try {
      const gasEstimate = await this.contract.verifyProvider.estimateGas(
        params.providerAddress
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
        ProviderManagementError.CONTRACT_ERROR,
        `Gas estimation failed: ${error.message}`,
        { originalError: error, params }
      );
    }
  }

  // =============================================
  // EVENT MONITORING
  // =============================================

  /**
   * Listen for provider registered events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onProviderRegistered(callback: (event: ProviderRegisteredEvent) => void): () => void {
    const listener = (providerWallet: string, providerId: string, providerDetailsCID: string, providerType: string, event: any) => {
      const providerEvent: ProviderRegisteredEvent = {
        providerWallet,
        providerId,
        providerDetailsCID,
        providerType: providerType as ProviderType,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now(),
      };
      callback(providerEvent);
    };

    this.contract.on('ProviderRegistered', listener);
    
    return () => {
      this.contract.off('ProviderRegistered', listener);
    };
  }

  /**
   * Listen for provider profile updated events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onProviderProfileUpdated(callback: (event: ProviderProfileUpdatedEvent) => void): () => void {
    const listener = (providerWallet: string, providerId: string, newProviderDetailsCID: string, event: any) => {
      const updateEvent: ProviderProfileUpdatedEvent = {
        providerWallet,
        providerId,
        oldProviderDetailsCID: '', // Would need to track this separately
        newProviderDetailsCID,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now(),
      };
      callback(updateEvent);
    };

    this.contract.on('ProviderProfileUpdated', listener);
    
    return () => {
      this.contract.off('ProviderProfileUpdated', listener);
    };
  }

  /**
   * Listen for provider verified events
   * @param callback - Event callback function
   * @returns Event listener cleanup function
   */
  onProviderVerified(callback: (event: ProviderVerifiedEvent) => void): () => void {
    const listener = (providerAddress: string, verifiedBy: string, event: any) => {
      const verificationEvent: ProviderVerifiedEvent = {
        providerAddress,
        providerId: '', // Would need to fetch this separately
        verifiedBy,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now(),
      };
      callback(verificationEvent);
    };

    this.contract.on('ProviderVerified', listener);
    
    return () => {
      this.contract.off('ProviderVerified', listener);
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
   * Extract provider ID from transaction receipt
   * @param transaction - Contract transaction response
   * @returns Provider ID from events
   */
  private async extractProviderIdFromTransaction(transaction: ethers.ContractTransactionResponse): Promise<string> {
    try {
      const receipt = await transaction.wait();
      if (!receipt) {
        throw new Error('Transaction receipt not available');
      }

      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'ProviderRegistered';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('ProviderRegistered event not found in transaction');
      }

      const parsedEvent = this.contract.interface.parseLog(event);
      return parsedEvent?.args.providerId || '';
    } catch (error: any) {
      throw this.createException(
        ProviderManagementError.CONTRACT_ERROR,
        `Failed to extract provider ID: ${error.message}`,
        { originalError: error, transactionHash: transaction.hash }
      );
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