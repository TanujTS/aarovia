import { ethers } from 'ethers';

// Smart contract ABI for medical records access control
export const MEDICAL_RECORDS_ACCESS_ABI = [
  // Grant access to a medical record
  'function grantAccess(bytes32 recordHash, address provider, uint256 expiresAt, string[] permissions) external',
  
  // Revoke access to a medical record
  'function revokeAccess(bytes32 recordHash, address provider) external',
  
  // Check if provider has access to a record
  'function hasAccess(bytes32 recordHash, address provider) external view returns (bool)',
  
  // Get access details
  'function getAccessDetails(bytes32 recordHash, address provider) external view returns (uint256 expiresAt, string[] permissions)',
  
  // Events
  'event AccessGranted(bytes32 indexed recordHash, address indexed patient, address indexed provider, uint256 expiresAt)',
  'event AccessRevoked(bytes32 indexed recordHash, address indexed patient, address indexed provider)',
];

// Smart contract ABI for record storage hashes
export const MEDICAL_RECORDS_STORAGE_ABI = [
  // Store a new medical record hash
  'function storeRecord(bytes32 recordHash, string ipfsHash, uint256 timestamp) external',
  
  // Get record details
  'function getRecord(bytes32 recordHash) external view returns (string ipfsHash, uint256 timestamp, address owner)',
  
  // Check if record exists
  'function recordExists(bytes32 recordHash) external view returns (bool)',
  
  // Events
  'event RecordStored(bytes32 indexed recordHash, address indexed owner, string ipfsHash, uint256 timestamp)',
];

/**
 * Contract interaction utilities
 */
export class MedicalRecordsContract {
  private provider: ethers.Provider;
  private accessContract?: ethers.Contract;
  private storageContract?: ethers.Contract;

  constructor(
    providerUrl: string,
    accessContractAddress?: string,
    storageContractAddress?: string
  ) {
    this.provider = new ethers.JsonRpcProvider(providerUrl);
    
    if (accessContractAddress) {
      this.accessContract = new ethers.Contract(
        accessContractAddress,
        MEDICAL_RECORDS_ACCESS_ABI,
        this.provider
      );
    }
    
    if (storageContractAddress) {
      this.storageContract = new ethers.Contract(
        storageContractAddress,
        MEDICAL_RECORDS_STORAGE_ABI,
        this.provider
      );
    }
  }

  /**
   * Grant access to a medical record
   */
  async grantAccess(
    recordHash: string,
    providerAddress: string,
    expiresAt: number,
    permissions: string[],
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.accessContract) {
      throw new Error('Access contract not initialized');
    }

    const contractWithSigner = this.accessContract.connect(signer);
    return await (contractWithSigner as any).grantAccess(
      recordHash,
      providerAddress,
      expiresAt,
      permissions
    );
  }

  /**
   * Revoke access to a medical record
   */
  async revokeAccess(
    recordHash: string,
    providerAddress: string,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.accessContract) {
      throw new Error('Access contract not initialized');
    }

    const contractWithSigner = this.accessContract.connect(signer);
    return await (contractWithSigner as any).revokeAccess(recordHash, providerAddress);
  }

  /**
   * Check if provider has access to a record
   */
  async hasAccess(
    recordHash: string,
    providerAddress: string
  ): Promise<boolean> {
    if (!this.accessContract) {
      throw new Error('Access contract not initialized');
    }

    return await this.accessContract.hasAccess(recordHash, providerAddress);
  }

  /**
   * Store a medical record hash on blockchain
   */
  async storeRecord(
    recordHash: string,
    ipfsHash: string,
    timestamp: number,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    if (!this.storageContract) {
      throw new Error('Storage contract not initialized');
    }

    const contractWithSigner = this.storageContract.connect(signer);
    return await (contractWithSigner as any).storeRecord(recordHash, ipfsHash, timestamp);
  }

  /**
   * Get record details from blockchain
   */
  async getRecord(recordHash: string): Promise<{
    ipfsHash: string;
    timestamp: number;
    owner: string;
  }> {
    if (!this.storageContract) {
      throw new Error('Storage contract not initialized');
    }

    const result = await this.storageContract.getRecord(recordHash);
    return {
      ipfsHash: result[0],
      timestamp: Number(result[1]),
      owner: result[2]
    };
  }

  /**
   * Listen for access granted events
   */
  onAccessGranted(
    callback: (recordHash: string, patient: string, provider: string, expiresAt: number) => void
  ): void {
    if (!this.accessContract) {
      throw new Error('Access contract not initialized');
    }

    this.accessContract.on('AccessGranted', (recordHash, patient, provider, expiresAt) => {
      callback(recordHash, patient, provider, Number(expiresAt));
    });
  }

  /**
   * Listen for record stored events
   */
  onRecordStored(
    callback: (recordHash: string, owner: string, ipfsHash: string, timestamp: number) => void
  ): void {
    if (!this.storageContract) {
      throw new Error('Storage contract not initialized');
    }

    this.storageContract.on('RecordStored', (recordHash, owner, ipfsHash, timestamp) => {
      callback(recordHash, owner, ipfsHash, Number(timestamp));
    });
  }
}

/**
 * Generate a hash for a medical record
 */
export function generateRecordHash(
  patientId: string,
  fileName: string,
  timestamp: number
): string {
  const data = `${patientId}-${fileName}-${timestamp}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
}

/**
 * Create contract instance
 */
export function createMedicalRecordsContract(
  providerUrl: string,
  accessContractAddress?: string,
  storageContractAddress?: string
): MedicalRecordsContract {
  return new MedicalRecordsContract(
    providerUrl,
    accessContractAddress,
    storageContractAddress
  );
}
