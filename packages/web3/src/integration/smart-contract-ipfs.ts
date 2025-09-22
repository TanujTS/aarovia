import { ethers } from 'ethers';
import { IPFSClient, FileType } from '../ipfs.js';
import {
  PatientProfile,
  EncounterRecord,
  LabResultRecord,
  ImagingReportRecord,
  MentalHealthRecord,
  GeneticTestRecord
} from '../types/medical-data-types.js';

/**
 * Integration between smart contracts and IPFS for medical records
 * This class provides methods to store medical records on IPFS and reference them in smart contracts
 */
export class MedicalRecordsIPFSIntegration {
  private ipfsClient: IPFSClient;
  private contract: ethers.Contract;

  constructor(
    ipfsConfig: {
      pinataApiKey?: string;
      pinataSecretApiKey?: string;
      pinataJWT?: string;
      web3StorageToken?: string;
      infuraProjectId?: string;
      infuraProjectSecret?: string;
    },
    contract: ethers.Contract
  ) {
    // Convert to StorageConfig format
    const storageConfig = {
      provider: 'pinata' as any, // Use Pinata as default
      apiKey: ipfsConfig.pinataApiKey,
      secretKey: ipfsConfig.pinataSecretApiKey,
      projectId: ipfsConfig.infuraProjectId
    };
    
    this.ipfsClient = new IPFSClient(storageConfig);
    this.contract = contract;
  }

  /**
   * Create and store an encounter record on IPFS and blockchain
   */
  async createEncounterRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    encounterData: EncounterRecord,
    attachments: File[] = [],
    encryptionKey?: string
  ): Promise<{
    metadataCID: string;
    attachmentCIDs: string[];
    transactionHash: string;
  }> {
    try {
      // 1. Upload attachments to IPFS
      const attachmentCIDs: string[] = [];
      const encryptedAttachments: EncounterRecord['attachments'] = [];

      for (const file of attachments) {
        const uploadResult = await this.ipfsClient.uploadFile(
          file,
          this.getFileTypeFromFile(file),
          true, // Encrypt attachments
          encryptionKey
        );

        attachmentCIDs.push(uploadResult.hash);
        encryptedAttachments?.push({
          attachment_name: file.name,
          file_type: file.type,
          file_CID: uploadResult.hash,
          upload_date: new Date().toISOString()
        });

        // Pin important files
        await this.ipfsClient.pinContent(uploadResult.hash);
      }

      // 2. Add attachments to encounter data
      const completeEncounterData: EncounterRecord = {
        ...encounterData,
        attachments: encryptedAttachments
      };

      // 3. Upload encounter record to IPFS
      const recordUpload = await this.ipfsClient.uploadMedicalRecord(
        completeEncounterData,
        true // Encrypt medical records
      );

      // Pin the record
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 4. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        0, // Encounter record type
        recordUpload.hash, // Store IPFS CID in contract
        encounterData.reason_for_visit || 'General Encounter',
        true, // Mark as sensitive
        patientWallet
      );

      const receipt = await tx.wait();

      return {
        metadataCID: recordUpload.hash,
        attachmentCIDs,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create encounter record:', error);
      throw error;
    }
  }

  /**
   * Create and store a lab result record on IPFS and blockchain
   */
  async createLabResultRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    labData: LabResultRecord,
    reportFile?: File,
    encryptionKey?: string
  ): Promise<{
    metadataCID: string;
    reportCID?: string;
    transactionHash: string;
  }> {
    try {
      let reportCID: string | undefined;

      // 1. Upload report file if provided
      if (reportFile) {
        const uploadResult = await this.ipfsClient.uploadFile(
          reportFile,
          FileType.LAB_RESULT,
          true, // Encrypt lab reports
          encryptionKey
        );

        reportCID = uploadResult.hash;
        labData.report_file_CID = reportCID;

        // Pin the report
        await this.ipfsClient.pinContent(reportCID);
      }

      // 2. Upload lab result record to IPFS
      const recordUpload = await this.ipfsClient.uploadMedicalRecord(
        labData,
        true // Encrypt medical records
      );

      // Pin the record
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 3. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        1, // Lab result record type
        recordUpload.hash,
        `Lab Test: ${labData.test_name}`,
        true, // Mark as sensitive
        patientWallet
      );

      const receipt = await tx.wait();

      return {
        metadataCID: recordUpload.hash,
        reportCID,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create lab result record:', error);
      throw error;
    }
  }

  /**
   * Create and store an imaging report record on IPFS and blockchain
   */
  async createImagingRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    imagingData: ImagingReportRecord,
    imageFiles: File[] = [],
    encryptionKey?: string
  ): Promise<{
    metadataCID: string;
    imageCIDs: string[];
    transactionHash: string;
  }> {
    try {
      // 1. Upload image files to IPFS
      const imageCIDs: string[] = [];
      const encryptedImages: ImagingReportRecord['image_CIDs'] = [];

      for (const file of imageFiles) {
        const uploadResult = await this.ipfsClient.uploadFile(
          file,
          this.getFileTypeFromFile(file),
          true, // Encrypt medical images
          encryptionKey
        );

        imageCIDs.push(uploadResult.hash);
        encryptedImages?.push({
          image_CID: uploadResult.hash,
          image_name: file.name,
          file_type: file.type.includes('dicom') ? 'DICOM' : 'Standard'
        });

        // Pin images
        await this.ipfsClient.pinContent(uploadResult.hash);
      }

      // 2. Add images to imaging data
      const completeImagingData: ImagingReportRecord = {
        ...imagingData,
        image_CIDs: encryptedImages
      };

      // 3. Upload imaging record to IPFS
      const recordUpload = await this.ipfsClient.uploadMedicalRecord(
        completeImagingData,
        true // Encrypt medical records
      );

      // Pin the record
      await this.ipfsClient.pinContent(recordUpload.hash);

      // 4. Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        2, // Imaging record type
        recordUpload.hash,
        `${imagingData.exam_name} - ${imagingData.body_part}`,
        true, // Mark as sensitive
        patientWallet
      );

      const receipt = await tx.wait();

      return {
        metadataCID: recordUpload.hash,
        imageCIDs,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create imaging record:', error);
      throw error;
    }
  }

  /**
   * Create and store a mental health record on IPFS and blockchain
   */
  async createMentalHealthRecord(
    recordId: string,
    patientId: string,
    patientWallet: string,
    providerId: string,
    providerWallet: string,
    mentalHealthData: MentalHealthRecord,
    encryptionKey?: string
  ): Promise<{
    metadataCID: string;
    transactionHash: string;
  }> {
    try {
      // Upload mental health record to IPFS
      const recordUpload = await this.ipfsClient.uploadMedicalRecord(
        mentalHealthData,
        true // Always encrypt mental health records
      );

      // Pin the record
      await this.ipfsClient.pinContent(recordUpload.hash);

      // Store CID in smart contract
      const tx = await this.contract.addMedicalRecord(
        ethers.keccak256(ethers.toUtf8Bytes(recordId)),
        ethers.keccak256(ethers.toUtf8Bytes(patientId)),
        patientWallet,
        ethers.keccak256(ethers.toUtf8Bytes(providerId)),
        providerWallet,
        3, // Mental health record type
        recordUpload.hash,
        `Mental Health: ${mentalHealthData.session_type}`,
        true, // Mark as sensitive
        patientWallet
      );

      const receipt = await tx.wait();

      return {
        metadataCID: recordUpload.hash,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('Failed to create mental health record:', error);
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
   * Get IPFS client instance for direct operations
   */
  getIPFSClient(): IPFSClient {
    return this.ipfsClient;
  }
}

/**
 * Utility functions for creating medical record instances
 */

export function createEncounterRecord(
  patientId: string,
  providerId: string,
  encounterType: string,
  chiefComplaint: string,
  diagnosisList: string[]
): EncounterRecord {
  return {
    record_id: `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    record_type: 'encounter',
    created_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    encounter_id: `enc_${Date.now()}`,
    encounter_date_time: new Date().toISOString(),
    reason_for_visit: encounterType,
    chief_complaint: chiefComplaint,
    history_of_present_illness: '',
    physical_examination_findings: '',
    diagnosis: diagnosisList.map((diag, index) => ({
      diagnosis_code: `ICD-${index}`,
      diagnosis_description: diag,
      is_primary: index === 0
    })),
    treatments_prescribed: [],
    medications_prescribed_at_encounter: [],
    procedures_performed: [],
    referrals: [],
    follow_up_instructions: '',
    notes: '',
    attachments: []
  };
}

export function createLabResultRecord(
  patientId: string,
  providerId: string,
  testName: string,
  results: any[]
): LabResultRecord {
  return {
    record_id: `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    record_type: 'lab_result',
    created_date: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    lab_result_id: `lab_${Date.now()}`,
    test_name: testName,
    test_code: '',
    collection_date: new Date().toISOString(),
    result_date: new Date().toISOString(),
    results_data: results,
    interpretation_notes: '',
    status: 'completed',
    report_file_CID: '',
    attachments: []
  };
}