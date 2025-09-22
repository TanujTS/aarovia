/**
 * Medical Record Service - Main orchestrator for medical record management
 * Coordinates blockchain operations, IPFS storage, validation, and provides unified API
 */

import { ethers } from 'ethers';
import {
  MedicalRecordUploadRequest,
  MedicalRecordUpdateRequest,
  MedicalRecordSearchParams,
  MedicalRecordUploadResponse,
  MedicalRecordRetrievalResponse,
  MedicalRecordListResponse,
  MedicalFileRetrievalResponse,
  MedicalRecordMetadata,
  MedicalRecordIPFSData,
  MedicalFileUpload,
  MedicalRecordType,
  MedicalFileType,
  RecordSensitivityLevel,
  MedicalRecordManagementConfig,
  MedicalRecordManagementError,
  MedicalRecordManagementException,
  ValidationResult,
  GasEstimationResult
} from './types';

import { MedicalRecordsContract } from './MedicalRecordsContract';
import MedicalRecordIPFSHandler from './MedicalRecordIPFSHandler';
import MedicalRecordValidator from './validation';

export class MedicalRecordService {
  private contract: MedicalRecordsContract;
  private ipfsHandler: MedicalRecordIPFSHandler;
  private validator: MedicalRecordValidator;
  private config: MedicalRecordManagementConfig;

  constructor(
    signer: ethers.Signer,
    config: MedicalRecordManagementConfig,
    pinataJWT: string,
    pinataGateway: string,
    encryptionKey: string
  ) {
    this.config = config;
    this.contract = new MedicalRecordsContract(config.contractAddress, signer);
    this.ipfsHandler = new MedicalRecordIPFSHandler(pinataJWT, pinataGateway, encryptionKey);
    this.validator = new MedicalRecordValidator();
  }

  /**
   * Upload a new medical record with files
   */
  async uploadMedicalRecord(request: MedicalRecordUploadRequest): Promise<MedicalRecordUploadResponse> {
    try {
      console.log(`🏥 Starting medical record upload for patient: ${request.patientId}`);
      const startTime = Date.now();

      // Step 1: Validate request
      const validation = this.validator.validateUploadRequest(request);
      if (!validation.isValid) {
        throw this.validator.createValidationException(validation);
      }

      if (validation.warnings.length > 0) {
        console.log(`⚠️ Upload warnings: ${validation.warnings.join(', ')}`);
      }

      // Step 2: Generate unique record ID
      const recordId = this.generateRecordId(request.patientId, request.recordType);

      // Step 3: Process and upload files to IPFS
      let fileCIDs: string[] = [];
      let contentCID = '';
      
      if (request.files && request.files.length > 0) {
        const fileUploads: MedicalFileUpload[] = request.files.map(file => ({
          fileName: file.fileName,
          fileType: file.fileType,
          mimeType: file.file instanceof File ? file.file.type : this.getMimeTypeFromFileType(file.fileType),
          content: file.file instanceof File ? Buffer.from(await file.file.arrayBuffer()) : file.file,
          size: file.file instanceof File ? file.file.size : file.file.length,
          description: file.description
        }));

        const contentUploadResult = await this.ipfsHandler.uploadRecordContentToIPFS(fileUploads, {
          processingOptions: {
            encrypt: this.shouldEncryptRecord(request),
            compress: this.config.compressionEnabled,
            validateChecksum: true
          },
          uploaderAddress: await this.contract.getSignerAddress(),
          metadata: {
            name: `medical-record-${recordId}`,
            keyvalues: {
              recordType: request.recordType,
              patientId: request.patientId,
              providerId: request.providerId
            }
          }
        });

        if (!contentUploadResult.success) {
          throw new MedicalRecordManagementException(
            MedicalRecordManagementError.IPFS_ERROR,
            `Failed to upload record content to IPFS: ${contentUploadResult.error}`,
            { contentUploadResult }
          );
        }

        contentCID = contentUploadResult.cid;
        fileCIDs = [contentCID]; // Simplified for this implementation
      }

      // Step 4: Create IPFS metadata structure
      const ipfsData: MedicalRecordIPFSData = {
        recordId,
        recordType: request.recordType,
        recordTitle: request.recordTitle,
        recordDescription: request.recordDescription,
        patientId: request.patientId,
        providerId: request.providerId,
        createdDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        clinicalData: request.clinicalData,
        attachments: request.files ? request.files.map((file, index) => ({
          fileName: file.fileName,
          fileType: file.fileType,
          mimeType: file.file instanceof File ? file.file.type : this.getMimeTypeFromFileType(file.fileType),
          fileCID: fileCIDs[0] || '', // Simplified
          fileSize: file.file instanceof File ? file.file.size : file.file.length,
          uploadDate: new Date().toISOString(),
          description: file.description,
          checksumHash: '' // Would be calculated by IPFS handler
        })) : [],
        securityInfo: {
          encryptionLevel: request.sensitivityLevel,
          accessRestrictions: [],
          complianceFlags: ['HIPAA'],
          auditTrail: [{
            action: 'RECORD_CREATED',
            timestamp: new Date().toISOString(),
            userId: request.providerId,
            ipAddress: 'unknown'
          }]
        },
        metadata: {
          version: '1.0.0',
          lastModifiedBy: request.providerId,
          tags: request.tags || [],
          categories: request.categories || [],
          language: 'en',
          timeZone: 'UTC',
          location: request.location
        }
      };

      // Step 5: Upload metadata to IPFS
      const metadataUploadResult = await this.ipfsHandler.uploadRecordMetadataToIPFS(ipfsData, {
        processingOptions: {
          encrypt: this.shouldEncryptRecord(request),
          compress: this.config.compressionEnabled
        },
        uploaderAddress: await this.contract.getSignerAddress(),
        metadata: {
          name: `medical-metadata-${recordId}`,
          keyvalues: {
            type: 'medical-record-metadata',
            recordId,
            patientId: request.patientId,
            providerId: request.providerId
          }
        }
      });

      if (!metadataUploadResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.IPFS_ERROR,
          `Failed to upload record metadata to IPFS: ${metadataUploadResult.error}`,
          { metadataUploadResult }
        );
      }

      const recordCID = metadataUploadResult.cid;

      // Step 6: Upload to blockchain
      const uploadResult = await this.contract.uploadMedicalRecord({
        patientId: request.patientId,
        providerId: request.providerId,
        recordType: request.recordType,
        recordTitle: request.recordTitle,
        recordCID,
        isSensitive: request.isSensitive
      });

      if (!uploadResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.CONTRACT_ERROR,
          `Failed to upload record to blockchain: ${uploadResult.error}`,
          { uploadResult }
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Medical record uploaded successfully in ${duration}ms`);
      console.log(`📋 Record ID: ${recordId}`);
      console.log(`📎 Record CID: ${recordCID}`);
      console.log(`🧾 Transaction: ${uploadResult.transactionHash}`);

      return {
        success: true,
        recordId,
        patientId: request.patientId,
        providerId: request.providerId,
        recordCID,
        fileCIDs,
        transactionHash: uploadResult.transactionHash,
        gasUsed: uploadResult.gasUsed,
        blockNumber: uploadResult.blockNumber,
        uploadTimestamp: Math.floor(Date.now() / 1000),
        totalSize: metadataUploadResult.size + (contentUploadResult?.size || 0),
        fileCount: request.files?.length || 0,
        message: 'Medical record uploaded successfully'
      };

    } catch (error) {
      console.error('❌ Error uploading medical record:', error);
      
      if (error instanceof MedicalRecordManagementException) {
        throw error;
      }

      return {
        success: false,
        recordId: '',
        patientId: request.patientId,
        providerId: request.providerId,
        recordCID: '',
        fileCIDs: [],
        transactionHash: '',
        gasUsed: 0,
        blockNumber: 0,
        uploadTimestamp: 0,
        totalSize: 0,
        fileCount: 0,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Retrieve a medical record by ID
   */
  async getMedicalRecord(recordId: string): Promise<MedicalRecordRetrievalResponse> {
    try {
      console.log(`📥 Retrieving medical record: ${recordId}`);

      // Step 1: Get metadata from blockchain
      const metadataResult = await this.contract.getRecordMetadata(recordId);
      if (!metadataResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.RECORD_NOT_FOUND,
          `Failed to retrieve record metadata: ${metadataResult.error}`,
          { metadataResult }
        );
      }

      const recordMetadata = metadataResult.metadata;

      // Step 2: Fetch IPFS data
      const ipfsResult = await this.ipfsHandler.fetchRecordMetadataFromIPFS(recordMetadata.recordCID, {
        decrypt: true,
        verifyChecksum: true
      });

      if (!ipfsResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.IPFS_ERROR,
          `Failed to retrieve record data from IPFS: ${ipfsResult.error}`,
          { ipfsResult }
        );
      }

      console.log(`✅ Medical record retrieved successfully`);

      return {
        success: true,
        recordMetadata,
        recordData: ipfsResult.data!,
        retrievedAt: Date.now(),
        message: 'Medical record retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Error retrieving medical record:', error);
      
      if (error instanceof MedicalRecordManagementException) {
        throw error;
      }

      return {
        success: false,
        recordMetadata: {} as MedicalRecordMetadata,
        recordData: {} as MedicalRecordIPFSData,
        retrievedAt: Date.now(),
        message: 'Retrieval failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get all medical records for a patient
   */
  async getPatientRecords(patientId: string, params: MedicalRecordSearchParams = {}): Promise<MedicalRecordListResponse> {
    try {
      console.log(`📋 Retrieving records for patient: ${patientId}`);

      const recordIdsResult = await this.contract.getPatientRecordIds(patientId);
      if (!recordIdsResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.CONTRACT_ERROR,
          `Failed to retrieve patient record IDs: ${recordIdsResult.error}`,
          { recordIdsResult }
        );
      }

      const recordIds = recordIdsResult.recordIds;
      const records: MedicalRecordMetadata[] = [];

      // Fetch metadata for each record
      for (const recordId of recordIds) {
        try {
          const metadataResult = await this.contract.getRecordMetadata(recordId);
          if (metadataResult.success && metadataResult.metadata) {
            // Apply filters
            if (this.matchesSearchParams(metadataResult.metadata, params)) {
              records.push(metadataResult.metadata);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to retrieve metadata for record ${recordId}:`, error);
          // Continue with other records
        }
      }

      // Apply pagination
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      const paginatedRecords = records.slice(offset, offset + limit);
      const hasMore = records.length > offset + limit;

      console.log(`✅ Retrieved ${paginatedRecords.length} records for patient ${patientId}`);

      return {
        success: true,
        records: paginatedRecords,
        totalCount: records.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
        message: 'Patient records retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Error retrieving patient records:', error);
      
      if (error instanceof MedicalRecordManagementException) {
        throw error;
      }

      return {
        success: false,
        records: [],
        totalCount: 0,
        hasMore: false,
        message: 'Retrieval failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Update an existing medical record
   */
  async updateMedicalRecord(request: MedicalRecordUpdateRequest): Promise<MedicalRecordUploadResponse> {
    try {
      console.log(`📝 Updating medical record: ${request.recordId}`);

      // Step 1: Validate request
      const validation = this.validator.validateUpdateRequest(request);
      if (!validation.isValid) {
        throw this.validator.createValidationException(validation);
      }

      // Step 2: Retrieve current record
      const currentRecord = await this.getMedicalRecord(request.recordId);
      if (!currentRecord.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.RECORD_NOT_FOUND,
          'Cannot update non-existent record',
          { currentRecord }
        );
      }

      // Step 3: Merge updates with existing data
      const updatedData: MedicalRecordIPFSData = {
        ...currentRecord.recordData,
        recordTitle: request.recordTitle || currentRecord.recordData.recordTitle,
        recordDescription: request.recordDescription || currentRecord.recordData.recordDescription,
        lastUpdated: new Date().toISOString(),
        clinicalData: request.clinicalData || currentRecord.recordData.clinicalData,
        metadata: {
          ...currentRecord.recordData.metadata,
          tags: request.tags || currentRecord.recordData.metadata.tags,
          lastModifiedBy: await this.contract.getSignerAddress() || 'unknown'
        }
      };

      // Step 4: Add audit trail entry
      updatedData.securityInfo.auditTrail.push({
        action: 'RECORD_UPDATED',
        timestamp: new Date().toISOString(),
        userId: await this.contract.getSignerAddress() || 'unknown',
        ipAddress: 'unknown'
      });

      // Step 5: Upload updated metadata to IPFS
      const metadataUploadResult = await this.ipfsHandler.uploadRecordMetadataToIPFS(updatedData, {
        processingOptions: {
          encrypt: currentRecord.recordMetadata.isSensitive,
          compress: this.config.compressionEnabled
        },
        uploaderAddress: await this.contract.getSignerAddress(),
        metadata: {
          name: `medical-metadata-${request.recordId}-updated`,
          keyvalues: {
            type: 'medical-record-metadata-update',
            recordId: request.recordId,
            originalCID: currentRecord.recordMetadata.recordCID
          }
        }
      });

      if (!metadataUploadResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.IPFS_ERROR,
          `Failed to upload updated metadata to IPFS: ${metadataUploadResult.error}`,
          { metadataUploadResult }
        );
      }

      // Step 6: Update CID on blockchain
      const updateResult = await this.contract.updateRecordCID({
        recordId: request.recordId,
        newRecordCID: metadataUploadResult.cid
      });

      if (!updateResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.CONTRACT_ERROR,
          `Failed to update record CID on blockchain: ${updateResult.error}`,
          { updateResult }
        );
      }

      console.log(`✅ Medical record updated successfully`);
      console.log(`📋 Record ID: ${request.recordId}`);
      console.log(`📎 New CID: ${metadataUploadResult.cid}`);

      return {
        success: true,
        recordId: request.recordId,
        patientId: currentRecord.recordMetadata.patientId,
        providerId: currentRecord.recordMetadata.providerId,
        recordCID: metadataUploadResult.cid,
        fileCIDs: [metadataUploadResult.cid],
        transactionHash: updateResult.transactionHash,
        gasUsed: updateResult.gasUsed,
        blockNumber: updateResult.blockNumber,
        uploadTimestamp: Math.floor(Date.now() / 1000),
        totalSize: metadataUploadResult.size,
        fileCount: currentRecord.recordData.attachments.length,
        message: 'Medical record updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating medical record:', error);
      
      if (error instanceof MedicalRecordManagementException) {
        throw error;
      }

      return {
        success: false,
        recordId: request.recordId,
        patientId: '',
        providerId: '',
        recordCID: '',
        fileCIDs: [],
        transactionHash: '',
        gasUsed: 0,
        blockNumber: 0,
        uploadTimestamp: 0,
        totalSize: 0,
        fileCount: 0,
        message: 'Update failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Download a specific file from a medical record
   */
  async downloadMedicalFile(recordId: string, fileName: string): Promise<MedicalFileRetrievalResponse> {
    try {
      console.log(`📥 Downloading file: ${fileName} from record: ${recordId}`);

      // Step 1: Get record metadata
      const record = await this.getMedicalRecord(recordId);
      if (!record.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.RECORD_NOT_FOUND,
          'Cannot download file from non-existent record',
          { record }
        );
      }

      // Step 2: Find the file attachment
      const fileAttachment = record.recordData.attachments.find(att => att.fileName === fileName);
      if (!fileAttachment) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.FILE_NOT_FOUND,
          `File ${fileName} not found in record ${recordId}`,
          { availableFiles: record.recordData.attachments.map(att => att.fileName) }
        );
      }

      // Step 3: Download file from IPFS
      const fileResult = await this.ipfsHandler.fetchFileFromIPFS(fileAttachment.fileCID, fileName, {
        decrypt: record.recordMetadata.isSensitive,
        decompress: true,
        verifyChecksum: true
      });

      if (!fileResult.success) {
        throw new MedicalRecordManagementException(
          MedicalRecordManagementError.IPFS_ERROR,
          `Failed to download file from IPFS: ${fileResult.error}`,
          { fileResult }
        );
      }

      console.log(`✅ File downloaded successfully: ${fileName}`);

      return {
        success: true,
        fileName,
        fileType: fileAttachment.fileType,
        mimeType: fileAttachment.mimeType,
        fileSize: fileAttachment.fileSize,
        fileContent: fileResult.data!,
        checksumVerified: true,
        retrievedAt: Date.now(),
        message: 'File downloaded successfully'
      };

    } catch (error) {
      console.error('❌ Error downloading medical file:', error);
      
      if (error instanceof MedicalRecordManagementException) {
        throw error;
      }

      return {
        success: false,
        fileName,
        fileType: MedicalFileType.OTHER,
        mimeType: 'unknown',
        fileSize: 0,
        fileContent: Buffer.alloc(0),
        checksumVerified: false,
        retrievedAt: Date.now(),
        message: 'Download failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Estimate gas cost for uploading a medical record
   */
  async estimateUploadGas(request: MedicalRecordUploadRequest): Promise<GasEstimationResult> {
    try {
      // Validate request first
      const validation = this.validator.validateUploadRequest(request);
      if (!validation.isValid) {
        throw this.validator.createValidationException(validation);
      }

      // Estimate gas for contract call
      const gasEstimate = await this.contract.estimateUploadGas({
        patientId: request.patientId,
        providerId: request.providerId,
        recordType: request.recordType,
        recordTitle: request.recordTitle,
        recordCID: 'QmTempHashForEstimation123456789', // Placeholder CID
        isSensitive: request.isSensitive
      });

      return gasEstimate;

    } catch (error) {
      console.error('❌ Error estimating upload gas:', error);
      throw error;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): MedicalRecordManagementConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<MedicalRecordManagementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private helper methods

  private generateRecordId(patientId: string, recordType: MedicalRecordType): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${patientId}-${recordType}-${timestamp}-${random}`;
  }

  private shouldEncryptRecord(request: MedicalRecordUploadRequest): boolean {
    return this.config.encryptionEnabled && 
           (request.isSensitive || request.sensitivityLevel > RecordSensitivityLevel.STANDARD);
  }

  private matchesSearchParams(metadata: MedicalRecordMetadata, params: MedicalRecordSearchParams): boolean {
    if (params.recordType && metadata.recordType !== params.recordType) {
      return false;
    }

    if (params.sensitivityLevel !== undefined && metadata.sensitivityLevel !== params.sensitivityLevel) {
      return false;
    }

    if (params.dateRange) {
      const recordDate = metadata.uploadTimestamp * 1000; // Convert to milliseconds
      const startDate = new Date(params.dateRange.startDate).getTime();
      const endDate = new Date(params.dateRange.endDate).getTime();
      
      if (recordDate < startDate || recordDate > endDate) {
        return false;
      }
    }

    return true;
  }

  private getMimeTypeFromFileType(fileType: MedicalFileType): string {
    const mimeTypeMap: Record<MedicalFileType, string> = {
      [MedicalFileType.PDF]: 'application/pdf',
      [MedicalFileType.IMAGE_JPEG]: 'image/jpeg',
      [MedicalFileType.IMAGE_PNG]: 'image/png',
      [MedicalFileType.DICOM]: 'application/dicom',
      [MedicalFileType.X_RAY]: 'application/dicom',
      [MedicalFileType.MRI]: 'application/dicom',
      [MedicalFileType.CT_SCAN]: 'application/dicom',
      [MedicalFileType.ULTRASOUND]: 'application/dicom',
      [MedicalFileType.ECG]: 'application/pdf',
      [MedicalFileType.DOCUMENT]: 'application/pdf',
      [MedicalFileType.AUDIO]: 'audio/mp3',
      [MedicalFileType.VIDEO]: 'video/mp4',
      [MedicalFileType.CSV]: 'text/csv',
      [MedicalFileType.JSON]: 'application/json',
      [MedicalFileType.XML]: 'application/xml',
      [MedicalFileType.OTHER]: 'application/octet-stream'
    };

    return mimeTypeMap[fileType] || 'application/octet-stream';
  }
}

export default MedicalRecordService;