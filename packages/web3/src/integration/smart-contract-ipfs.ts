/**
 * Smart Contract Integration for IPFS/Filecoin Storage
 * Updated to work with your actual Aarovia smart contracts and comprehensive medical data structures
 */

import { ethers } from 'ethers';
import {
  IPFSClient,
  createPinataClient,
  createInfuraClient,
  FileType
} from '../ipfs.js';
import {
  PatientProfile,
  ProviderProfile,
  EncounterRecord,
  LabResultRecord,
  ImagingReportRecord,
  PrescriptionRecord,
  MentalHealthRecord,
  SurgeryRecord,
  GeneticTestRecord,
  RawMedicalFile,
  InstitutionProfile
} from '../types/medical-data-types.js';
import { getPrimaryStorageConfig, shouldEncryptFile } from '../config/ipfs-config.js';

// Smart contract record types (matching your Solidity enum)
export enum ContractRecordType {
  None = 0,
  Encounter = 1,
  LabResult = 2,
  ImagingReport = 3,
  Prescription = 4,
  Vaccination = 5,
  Procedure = 6,
  Consultation = 7
}

// Provider types (matching your Solidity enum)
export enum ContractProviderType {
  None = 0,
  Doctor = 1,
  Clinic = 2,
  Lab = 3,
  Hospital = 4,
  Pharmacy = 5,
  Specialist = 6
}

/**
 * Medical Records Contract Integration
 * Updated to work with your actual MedicalRecords.sol contract
 */
export class MedicalRecordsIPFSIntegration {
  private ipfsClient: IPFSClient;
  private contract: ethers.Contract;

  constructor(ipfsClient: IPFSClient, contract: ethers.Contract) {
    this.ipfsClient = ipfsClient;
    this.contract = contract;
  }

  /**
   * Create an encounter record with IPFS storage and blockchain registration
   */
  async createEncounterRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    encounterData: EncounterRecord,
    title: string,
    attachments: File[] = [],
    encryptionKey?: string
  ): Promise<{
    recordCID: string;
    attachmentCIDs: string[];
    transactionHash: string;
  }> {
    try {
      // 1. Upload attachment files to IPFS
      const attachmentCIDs: string[] = [];
      const attachmentMetadata: EncounterRecord['attachments'] = [];

      for (const file of attachments) {
        const uploadResult = await this.ipfsClient.uploadFile(
          file,
          this.getFileTypeFromFile(file),
          true, // Encrypt medical attachments
          encryptionKey
        );

        attachmentCIDs.push(uploadResult.hash);
        attachmentMetadata?.push({
          attachment_name: file.name,
          file_type: file.type,
          file_CID: uploadResult.hash,
          upload_date: new Date().toISOString()
        });

        // Pin attachment
        await this.ipfsClient.pinContent(uploadResult.hash);
      }

      // 2. Add attachments to encounter record
      const completeEncounter: EncounterRecord = {
        ...encounterData,
        attachments: attachmentMetadata
      };

      // 3. Upload encounter record to IPFS (encrypted)
      const recordUpload = await this.ipfsClient.uploadEncounterRecord(completeEncounter, true);
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 4. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        ContractRecordType.Encounter,
        recordUpload.hash,
        title,
        true // Encounters are sensitive
      );

      const receipt = await tx.wait();

      return {
        recordCID: recordUpload.hash,
        attachmentCIDs,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create encounter record:', error);
      throw error;
    }
  }

  /**
   * Create a lab result record with IPFS storage and blockchain registration
   */
  async createLabResultRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    labData: LabResultRecord,
    title: string,
    reportFile?: File,
    encryptionKey?: string
  ): Promise<{
    recordCID: string;
    reportCID?: string;
    transactionHash: string;
  }> {
    try {
      let reportCID: string | undefined;

      // 1. Upload lab report file if provided
      if (reportFile) {
        const reportUpload = await this.ipfsClient.uploadFile(
          reportFile,
          FileType.LAB_RESULT,
          true, // Encrypt lab reports
          encryptionKey
        );
        reportCID = reportUpload.hash;
        await this.ipfsClient.pinContent(reportCID);

        // Add report CID to lab data
        labData.report_file_CID = reportCID;
      }

      // 2. Upload lab result record to IPFS (encrypted)
      const recordUpload = await this.ipfsClient.uploadLabResultRecord(labData, true);
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 3. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        ContractRecordType.LabResult,
        recordUpload.hash,
        title,
        true // Lab results are sensitive
      );

      const receipt = await tx.wait();

      return {
        recordCID: recordUpload.hash,
        reportCID,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create lab result record:', error);
      throw error;
    }
  }

  /**
   * Create an imaging report record with IPFS storage and blockchain registration
   */
  async createImagingRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    imagingData: ImagingReportRecord,
    title: string,
    reportFile?: File,
    imageFiles: File[] = [],
    encryptionKey?: string
  ): Promise<{
    recordCID: string;
    reportCID?: string;
    imageCIDs: string[];
    transactionHash: string;
  }> {
    try {
      let reportCID: string | undefined;
      const imageCIDs: string[] = [];

      // 1. Upload report file if provided
      if (reportFile) {
        const reportUpload = await this.ipfsClient.uploadFile(
          reportFile,
          FileType.DOCUMENT_PDF,
          true,
          encryptionKey
        );
        reportCID = reportUpload.hash;
        await this.ipfsClient.pinContent(reportCID);
        imagingData.report_file_CID = reportCID;
      }

      // 2. Upload image files
      const imageCIDMetadata: ImagingReportRecord['image_CIDs'] = [];
      for (const imageFile of imageFiles) {
        const imageUpload = await this.ipfsClient.uploadFile(
          imageFile,
          this.getFileTypeFromFile(imageFile),
          true,
          encryptionKey
        );
        imageCIDs.push(imageUpload.hash);
        imageCIDMetadata.push({
          image_name: imageFile.name,
          file_type: imageFile.type.includes('dicom') ? 'DICOM' : 'IMAGE',
          image_CID: imageUpload.hash
        });
        await this.ipfsClient.pinContent(imageUpload.hash);
      }

      imagingData.image_CIDs = imageCIDMetadata;

      // 3. Upload imaging record to IPFS
      const recordUpload = await this.ipfsClient.uploadImagingReportRecord(imagingData, true);
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 4. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        ContractRecordType.ImagingReport,
        recordUpload.hash,
        title,
        true // Imaging reports are sensitive
      );

      const receipt = await tx.wait();

      return {
        recordCID: recordUpload.hash,
        reportCID,
        imageCIDs,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create imaging record:', error);
      throw error;
    }
  }

  /**
   * Create a mental health record (highly sensitive)
   */
  async createMentalHealthRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    mentalHealthData: MentalHealthRecord,
    title: string,
    encryptionKey: string // Required for mental health records
  ): Promise<{
    recordCID: string;
    transactionHash: string;
  }> {
    try {
      // Mental health records are always encrypted with strong encryption
      const recordUpload = await this.ipfsClient.uploadMentalHealthRecord(
        mentalHealthData, 
        true // Always encrypted
      );
      await this.ipfsClient.pinContent(recordUpload.hash);

      // Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        ContractRecordType.Consultation, // Use consultation for mental health
        recordUpload.hash,
        title,
        true // Always sensitive
      );

      const receipt = await tx.wait();

      return {
        recordCID: recordUpload.hash,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create mental health record:', error);
      throw error;
    }
  }

  /**
   * Create a prescription record
   */
  async createPrescriptionRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    prescriptionData: PrescriptionRecord,
    title: string
  ): Promise<{
    recordCID: string;
    transactionHash: string;
  }> {
    try {
      const recordUpload = await this.ipfsClient.uploadPrescriptionRecord(prescriptionData, false);
      await this.ipfsClient.pinContent(recordUpload.hash);

      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        ContractRecordType.Prescription,
        recordUpload.hash,
        title,
        false // Prescriptions are semi-public
      );

      const receipt = await tx.wait();

      return {
        recordCID: recordUpload.hash,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create prescription record:', error);
      throw error;
    }
  }
  /**
   * Retrieve encounter record from IPFS using CID from smart contract
   */
  async getEncounterRecord(
    recordId: string,
    encryptionKey?: string
  ): Promise<{
    contractData: any;
    encounterData: EncounterRecord;
    attachments: Blob[];
  }> {
    try {
      // 1. Get record info from smart contract
      const recordIdHash = ethers.keccak256(ethers.toUtf8Bytes(recordId));
      const contractData = await this.contract.records(recordIdHash);

      // 2. Download encounter record from IPFS
      const encounterData = await this.ipfsClient.downloadJSON<EncounterRecord>(
        contractData.recordCID,
        contractData.isSensitive,
        encryptionKey
      );

      // 3. Download attachments if any
      const attachments: Blob[] = [];
      if (encounterData.attachments) {
        for (const attachment of encounterData.attachments) {
          const blob = await this.ipfsClient.downloadFile(
            attachment.file_CID,
            true, // Attachments are encrypted
            encryptionKey
          );
          attachments.push(blob);
        }
      }

      return {
        contractData,
        encounterData,
        attachments
      };
    } catch (error) {
      console.error('Failed to retrieve encounter record:', error);
      throw error;
    }
  }

  /**
   * Retrieve lab result record from IPFS
   */
  async getLabResultRecord(
    recordId: string,
    encryptionKey?: string
  ): Promise<{
    contractData: any;
    labData: LabResultRecord;
    reportFile?: Blob;
  }> {
    try {
      const recordIdHash = ethers.keccak256(ethers.toUtf8Bytes(recordId));
      const contractData = await this.contract.records(recordIdHash);

      const labData = await this.ipfsClient.downloadJSON<LabResultRecord>(
        contractData.recordCID,
        contractData.isSensitive,
        encryptionKey
      );

      let reportFile: Blob | undefined;
      if (labData.report_file_CID) {
        reportFile = await this.ipfsClient.downloadFile(
          labData.report_file_CID,
          true,
          encryptionKey
        );
      }

      return {
        contractData,
        labData,
        reportFile
      };
    } catch (error) {
      console.error('Failed to retrieve lab result record:', error);
      throw error;
    }
  }

  /**
   * Helper method to determine file type from file extension/mime type
   */
  private getFileTypeFromFile(file: File): FileType {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType.includes('pdf')) return FileType.DOCUMENT_PDF;
    if (fileType.includes('dicom') || fileName.includes('.dcm')) return FileType.DICOM_IMAGE;
    if (fileType.startsWith('image/')) return FileType.MEDICAL_IMAGE;
    if (fileName.includes('xray') || fileName.includes('x-ray')) return FileType.X_RAY_IMAGE;
    if (fileName.includes('lab') && fileType.includes('pdf')) return FileType.LAB_RESULT;
    
    return FileType.BINARY_FILE;
  }

  /**
   * Retrieve all records for a patient from IPFS
   */
  async getPatientRecords(
    patientId: string,
    encryptionKey?: string
  ): Promise<{
    encounterRecords: EncounterRecord[];
    labResults: LabResultRecord[];
    imagingReports: ImagingReportRecord[];
    mentalHealthRecords: MentalHealthRecord[];
  }> {
    try {
      const patientIdHash = ethers.keccak256(ethers.toUtf8Bytes(patientId));
      const recordIds = await this.contract.getPatientRecords(patientIdHash);

      const encounterRecords: EncounterRecord[] = [];
      const labResults: LabResultRecord[] = [];
      const imagingReports: ImagingReportRecord[] = [];
      const mentalHealthRecords: MentalHealthRecord[] = [];

      for (const recordId of recordIds) {
        const contractData = await this.contract.records(recordId);
        
        // Determine record type and fetch appropriate data
        switch (contractData.recordType) {
          case 0: // Encounter
            try {
              const { encounterData } = await this.getEncounterRecord(
                ethers.toUtf8String(recordId),
                encryptionKey
              );
              encounterRecords.push(encounterData);
            } catch (error) {
              console.warn('Failed to fetch encounter record:', error);
            }
            break;
          case 1: // Lab Result
            try {
              const { labData } = await this.getLabResultRecord(
                ethers.toUtf8String(recordId),
                encryptionKey
              );
              labResults.push(labData);
            } catch (error) {
              console.warn('Failed to fetch lab result:', error);
            }
            break;
          // Add more cases as needed
        }
      }

      return {
        encounterRecords,
        labResults,
        imagingReports,
        mentalHealthRecords
      };
    } catch (error) {
      console.error('Failed to retrieve patient records:', error);
      throw error;
    }
  }
      
      // 2. Download current metadata
      const currentMetadata = await this.ipfsClient.downloadJSON<MedicalRecordMetadata>(
        contractData.recordCID,
        contractData.isSensitive,
        encryptionKey
      );

      // 3. Merge updates
      const newMetadata = {
        ...currentMetadata,
        ...updatedMetadata,
        updatedAt: Date.now()
      };

      // 4. Upload new metadata
      const uploadResult = await this.ipfsClient.uploadMedicalRecord(
        newMetadata,
        contractData.isSensitive
      );

      // Pin new metadata
      await this.ipfsClient.pinContent(uploadResult.hash);

      // 5. Update smart contract (if contract has update function)
      // Note: You might need to add an updateMedicalRecordCID function to your contract
      /*
      const tx = await this.contract.updateMedicalRecordCID(
        recordIdHash,
        uploadResult.hash
      );
      const receipt = await tx.wait();
      */

      return {
        newMetadataCID: uploadResult.hash,
        transactionHash: 'update-tx-hash' // receipt.hash when update function is implemented
      };
    } catch (error) {
      console.error('Failed to update medical record:', error);
      throw error;
    }
  }

  private getFileTypeFromMimeType(mimeType: string): FileType {
    if (mimeType === 'application/pdf') return FileType.DOCUMENT_PDF;
    if (mimeType.startsWith('image/')) return FileType.MEDICAL_IMAGE;
    if (mimeType === 'application/json') return FileType.MEDICAL_RECORD_JSON;
    return FileType.BINARY_FILE;
  }

  private getRecordTypeString(recordType: number): string {
    const types = [
      'General',
      'Diagnostic',
      'Prescription',
      'LabResult',
      'Imaging',
      'Surgery',
      'Mental',
      'Genetic'
    ];
    return types[recordType] || 'General';
  }
}

/**
 * Provider Registry Contract Integration
 */
export class ProviderRegistryIPFSIntegration {
  private ipfsClient: IPFSClient;
  private contract: ethers.Contract;

  constructor(ipfsClient: IPFSClient, contract: ethers.Contract) {
    this.ipfsClient = ipfsClient;
    this.contract = contract;
  }

  /**
   * Register provider with IPFS profile storage
   */
  async registerProvider(
    providerAddress: string,
    providerId: string,
    profile: ProviderProfile,
    providerType: number
  ): Promise<{
    profileCID: string;
    transactionHash: string;
  }> {
    try {
      // 1. Upload provider profile to IPFS
      const uploadResult = await this.ipfsClient.uploadProviderProfile(profile, false);

      // Pin the profile
      await this.ipfsClient.pinContent(uploadResult.hash);

      // 2. Register with smart contract
      const tx = await this.contract.registerProvider(
        providerAddress,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        uploadResult.hash, // Store IPFS CID
        providerType
      );

      const receipt = await tx.wait();

      return {
        profileCID: uploadResult.hash,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to register provider:', error);
      throw error;
    }
  }

  /**
   * Update provider profile
   */
  async updateProviderProfile(
    providerAddress: string,
    updatedProfile: Partial<ProviderProfile>
  ): Promise<{
    newProfileCID: string;
    transactionHash: string;
  }> {
    try {
      // 1. Get current profile CID from contract
      const contractData = await this.contract.getProviderProfile(providerAddress);
      
      // 2. Download current profile
      const currentProfile = await this.ipfsClient.downloadJSON<ProviderProfile>(
        contractData.providerDetailsCID,
        false // Provider profiles are usually not encrypted
      );

      // 3. Merge updates
      const newProfile = {
        ...currentProfile,
        ...updatedProfile,
        updatedAt: Date.now()
      };

      // 4. Upload new profile
      const uploadResult = await this.ipfsClient.uploadProviderProfile(newProfile, false);

      // Pin new profile
      await this.ipfsClient.pinContent(uploadResult.hash);

      // 5. Update smart contract
      const tx = await this.contract.updateProviderDetailsCID(uploadResult.hash);
      const receipt = await tx.wait();

      return {
        newProfileCID: uploadResult.hash,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to update provider profile:', error);
      throw error;
    }
  }
}

/**
 * Factory functions to create integration instances
 */
export function createMedicalRecordsIntegration(
  contractAddress: string,
  contractABI: any,
  signer: ethers.Signer
): MedicalRecordsIPFSIntegration {
  const config = getPrimaryStorageConfig();
  let ipfsClient: IPFSClient;

  // Create appropriate IPFS client based on config
  if (config.provider === 'pinata' && config.apiKey && config.secretKey) {
    ipfsClient = createPinataClient(config.apiKey, config.secretKey);
  } else if (config.provider === 'infura' && config.projectId && config.secretKey) {
    ipfsClient = createInfuraClient(config.projectId, config.secretKey);
  } else {
    throw new Error('No valid IPFS configuration found');
  }

  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  return new MedicalRecordsIPFSIntegration(ipfsClient, contract);
}

export function createProviderRegistryIntegration(
  contractAddress: string,
  contractABI: any,
  signer: ethers.Signer
): ProviderRegistryIPFSIntegration {
  const config = getPrimaryStorageConfig();
  let ipfsClient: IPFSClient;

  if (config.provider === 'pinata' && config.apiKey && config.secretKey) {
    ipfsClient = createPinataClient(config.apiKey, config.secretKey);
  } else if (config.provider === 'infura' && config.projectId && config.secretKey) {
    ipfsClient = createInfuraClient(config.projectId, config.secretKey);
  } else {
    throw new Error('No valid IPFS configuration found');
  }

  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
  return new ProviderRegistryIPFSIntegration(ipfsClient, contract);
}