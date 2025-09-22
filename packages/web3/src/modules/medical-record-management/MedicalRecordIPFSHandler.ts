/**
 * MedicalRecordIPFSHandler - IPFS operations for medical records
 * Handles file uploads, metadata storage, and secure retrieval operations
 */

import { PinataSDK } from 'pinata-web3';
import crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import {
  MedicalRecordIPFSData,
  MedicalFileUpload,
  MedicalFileType,
  IPFSUploadResult,
  IPFSRetrievalResult,
  FileValidationResult,
  EncryptionResult,
  CompressionResult,
  IPFSUploadOptions,
  IPFSRetrievalOptions,
  FileProcessingOptions
} from './types';

export class MedicalRecordIPFSHandler {
  private pinata: PinataSDK;
  private encryptionKey: string;
  private readonly maxFileSize: number = 50 * 1024 * 1024; // 50MB
  private readonly allowedFileTypes: Set<string> = new Set([
    'application/pdf',
    'application/dicom',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'video/mp4',
    'video/avi',
    'text/plain',
    'application/json',
    'application/xml'
  ]);

  constructor(pinataJWT: string, pinataGateway: string, encryptionKey: string) {
    this.pinata = new PinataSDK({
      pinataJwt: pinataJWT,
      pinataGateway: pinataGateway
    });
    this.encryptionKey = encryptionKey;
  }

  /**
   * Upload medical record content files to IPFS
   */
  async uploadRecordContentToIPFS(
    files: MedicalFileUpload[],
    options: IPFSUploadOptions = {}
  ): Promise<IPFSUploadResult> {
    try {
      const startTime = Date.now();
      console.log(`📁 Uploading ${files.length} medical files to IPFS...`);

      // Validate all files first
      const validationResults = await this.validateFiles(files);
      const invalidFiles = validationResults.filter(result => !result.isValid);
      
      if (invalidFiles.length > 0) {
        throw new Error(
          `File validation failed: ${invalidFiles
            .map(f => f.fileName + ': ' + (f.errors?.join('; ') || 'unknown error'))
            .join(', ')}`
        );
      }

      // Process files (encrypt, compress, checksum)
      const processedFiles: ProcessedFile[] = [];
      
      for (const file of files) {
        const processedFile = await this.processFileForUpload(file, options.processingOptions);
        processedFiles.push(processedFile);
      }

      // Create file directory structure
      const fileDirectory = this.createFileDirectory(processedFiles);

      // Upload directory to IPFS
      const extraKeyValues = (options.metadata as any)?.keyValues || (options.metadata as any)?.keyvalues || {};
      const uploadResponse = await this.pinata.upload.json(fileDirectory, {
        metadata: {
          name: options.metadata?.name || `medical-records-${Date.now()}`,
          keyValues: {
            type: 'medical-record-content',
            uploadedAt: new Date().toISOString(),
            fileCount: String(files.length),
            totalSize: String(this.calculateTotalSize(files)),
            encrypted: options.processingOptions?.encrypt ? 'true' : 'false',
            compressed: options.processingOptions?.compress ? 'true' : 'false',
            ...Object.fromEntries(Object.entries(extraKeyValues).map(([k, v]) => [k, String(v)]))
          }
        }
      });

      const endTime = Date.now();
      const uploadDuration = endTime - startTime;

      console.log(`✅ Medical record content uploaded successfully in ${uploadDuration}ms`);
      console.log(`📎 IPFS CID: ${uploadResponse.IpfsHash}`);

      return {
        success: true,
        cid: uploadResponse.IpfsHash,
        size: this.calculateTotalSize(files),
        fileCount: files.length,
        uploadDuration,
        processedFiles: processedFiles.map(pf => ({
          fileName: pf.originalFile.fileName,
          fileType: pf.originalFile.fileType,
          size: pf.originalFile.size,
          checksum: pf.checksum,
          encrypted: pf.encrypted,
          compressed: pf.compressed
        })),
        metadata: {
          uploadedAt: new Date().toISOString(),
          pinataResponse: uploadResponse
        }
      };

    } catch (error) {
      console.error('❌ Error uploading medical record content to IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        cid: '',
        size: 0,
        fileCount: 0,
        uploadDuration: 0,
        processedFiles: []
      };
    }
  }

  /**
   * Upload medical record metadata to IPFS
   */
  async uploadRecordMetadataToIPFS(
    metadata: MedicalRecordIPFSData,
    options: IPFSUploadOptions = {}
  ): Promise<IPFSUploadResult> {
    try {
      const startTime = Date.now();
      console.log(`📋 Uploading medical record metadata to IPFS...`);

      // Prepare metadata clone so we can mutate safely
      const ipfsMetadata: MedicalRecordIPFSData & {
        uploadInfo?: {
          uploadedAt: string;
          uploaderAddress: string;
          encryption: boolean;
          compression: boolean;
          checksum?: string;
        };
      } = {
        ...metadata,
        uploadInfo: {
          uploadedAt: new Date().toISOString(),
          uploaderAddress: options.uploaderAddress || '',
          encryption: !!options.processingOptions?.encrypt,
          compression: !!options.processingOptions?.compress
        }
      };

      // Encrypt metadata if requested
      if (options.processingOptions?.encrypt) {
        if ((ipfsMetadata as any).clinicalData) {
          (ipfsMetadata as any).clinicalData = await this.encryptData((ipfsMetadata as any).clinicalData);
        }
        if ((ipfsMetadata as any).recordDescription) {
          (ipfsMetadata as any).recordDescription = await this.encryptString((ipfsMetadata as any).recordDescription);
        }
        // mark which fields are encrypted
        (ipfsMetadata as any).encryptedFields = this.getEncryptedFields(ipfsMetadata as any);
      } else {
        (ipfsMetadata as any).encryptedFields = [];
      }

      // Compute checksum on the exact payload to be stored (post-encryption if any)
      (ipfsMetadata as any).checksum = this.calculateIPFSMetadataChecksum(ipfsMetadata as any);
      if (ipfsMetadata.uploadInfo) {
        ipfsMetadata.uploadInfo.checksum = (ipfsMetadata as any).checksum;
      }

      // Upload metadata to IPFS
      const extraKV2 = (options.metadata as any)?.keyValues || (options.metadata as any)?.keyvalues || {};
      const uploadResponse = await this.pinata.upload.json(ipfsMetadata, {
        metadata: {
          name: options.metadata?.name || `medical-metadata-${(metadata as any).recordId}`,
          keyValues: {
            type: 'medical-record-metadata',
            recordId: String((metadata as any).recordId ?? ''),
            patientId: String((metadata as any).patientId ?? ''),
            providerId: String((metadata as any).providerId ?? ''),
            recordType: String((metadata as any).recordType ?? ''),
            uploadedAt: new Date().toISOString(),
            version: String((ipfsMetadata as any).version ?? ''),
            encrypted: options.processingOptions?.encrypt ? 'true' : 'false',
            ...Object.fromEntries(Object.entries(extraKV2).map(([k, v]) => [k, String(v)]))
          }
        }
      });

      const endTime = Date.now();
      const uploadDuration = endTime - startTime;

      console.log(`✅ Medical record metadata uploaded successfully in ${uploadDuration}ms`);
      console.log(`📋 Metadata CID: ${uploadResponse.IpfsHash}`);

      return {
        success: true,
        cid: uploadResponse.IpfsHash,
        size: JSON.stringify(ipfsMetadata).length,
        fileCount: 1,
        uploadDuration,
        processedFiles: [{
          fileName: 'metadata.json',
          fileType: MedicalFileType.JSON,
          size: JSON.stringify(ipfsMetadata).length,
          checksum: (ipfsMetadata as any).checksum,
          encrypted: options.processingOptions?.encrypt || false,
          compressed: options.processingOptions?.compress || false
        }],
        metadata: {
          uploadedAt: new Date().toISOString(),
          pinataResponse: uploadResponse
        }
      };

    } catch (error) {
      console.error('❌ Error uploading medical record metadata to IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        cid: '',
        size: 0,
        fileCount: 0,
        uploadDuration: 0,
        processedFiles: []
      };
    }
  }

  /**
   * Fetch medical record metadata from IPFS
   */
  async fetchRecordMetadataFromIPFS(
    cid: string,
    options: IPFSRetrievalOptions = {}
  ): Promise<IPFSRetrievalResult<MedicalRecordIPFSData>> {
    try {
      const startTime = Date.now();
      console.log(`📥 Fetching medical record metadata from IPFS: ${cid}`);

      // Fetch data from IPFS
      const response = await this.pinata.gateways.get(cid);
      const rawData = response.data as unknown;
      let metadata: MedicalRecordIPFSData;
      if (typeof rawData === 'string') {
        metadata = JSON.parse(rawData) as MedicalRecordIPFSData;
      } else if (rawData && typeof rawData === 'object' && typeof (rawData as any).text === 'function') {
        const text = await (rawData as any).text();
        metadata = JSON.parse(text) as MedicalRecordIPFSData;
      } else {
        metadata = rawData as MedicalRecordIPFSData;
      }

      // Verify checksum if available (on the data as fetched)
      if ((metadata as any).checksum && options.verifyChecksum !== false) {
        const calculatedChecksum = this.calculateIPFSMetadataChecksum(metadata as any);
        if (calculatedChecksum !== (metadata as any).checksum) {
          throw new Error('Metadata checksum verification failed - data may be corrupted');
        }
      }

      // Decrypt data if it was encrypted
      if ((metadata as any).encryptedFields && (metadata as any).encryptedFields.length > 0 && options.decrypt !== false) {
        if ((metadata as any).encryptedFields.includes('clinicalData') && (metadata as any).clinicalData) {
          (metadata as any).clinicalData = await this.decryptData((metadata as any).clinicalData);
        }
        if ((metadata as any).encryptedFields.includes('recordDescription') && (metadata as any).recordDescription) {
          (metadata as any).recordDescription = await this.decryptString((metadata as any).recordDescription);
        }
      }

      const endTime = Date.now();
      const retrievalDuration = endTime - startTime;

      console.log(`✅ Medical record metadata fetched successfully in ${retrievalDuration}ms`);

      return {
        success: true,
        data: metadata,
        size: JSON.stringify(metadata).length,
        retrievalDuration,
        metadata: {
          fetchedAt: new Date().toISOString(),
          cid,
          checksum: (metadata as any).checksum,
          version: (metadata as any).version
        }
      };

    } catch (error) {
      console.error('❌ Error fetching medical record metadata from IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        size: 0,
        retrievalDuration: 0
      };
    }
  }

  /**
   * Fetch individual medical files from IPFS
   */
  async fetchFileFromIPFS(
    cid: string,
    fileName: string,
    options: IPFSRetrievalOptions = {}
  ): Promise<IPFSRetrievalResult<Buffer>> {
    try {
      const startTime = Date.now();
      console.log(`📥 Fetching medical file from IPFS: ${fileName} (${cid})`);

      // Fetch file directory from IPFS
      const response = await this.pinata.gateways.get(cid);
      
      // Find the requested file in the directory
      const fileDirectory = response.data as Record<string, any>;
      const fileData = fileDirectory[fileName];
      
      if (!fileData) {
        throw new Error(`File ${fileName} not found in IPFS directory`);
      }

  // Convert base64 back to buffer
  let fileBuffer: any = Buffer.from(fileData.content as any, 'base64');

      // Decompress if needed
      if (fileData.compressed && options.decompress !== false) {
        fileBuffer = await this.decompressFile(fileBuffer);
      }

      // Decrypt if needed
      if (fileData.encrypted && options.decrypt !== false) {
        fileBuffer = await this.decryptFile(fileBuffer);
      }

      // Verify checksum if available
      if (fileData.checksum && options.verifyChecksum !== false) {
        const calculatedChecksum = this.calculateFileChecksum(fileBuffer);
        if (calculatedChecksum !== fileData.checksum) {
          throw new Error(`File checksum verification failed for ${fileName} - data may be corrupted`);
        }
      }

      const endTime = Date.now();
      const retrievalDuration = endTime - startTime;

      console.log(`✅ Medical file ${fileName} fetched successfully in ${retrievalDuration}ms`);

      return {
        success: true,
        data: fileBuffer,
        size: fileBuffer.length,
        retrievalDuration,
        metadata: {
          fetchedAt: new Date().toISOString(),
          fileName,
          cid,
          originalSize: fileData.originalSize,
          fileType: fileData.fileType,
          checksum: fileData.checksum,
          encrypted: fileData.encrypted,
          compressed: fileData.compressed
        }
      };

    } catch (error) {
      console.error(`❌ Error fetching medical file ${fileName} from IPFS:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: null,
        size: 0,
        retrievalDuration: 0
      };
    }
  }

  /**
   * Validate medical files before upload
   */
  private async validateFiles(files: MedicalFileUpload[]): Promise<FileValidationResult[]> {
  const results: FileValidationResult[] = [];

    for (const file of files) {
      const result: FileValidationResult = {
        fileName: file.fileName,
        isValid: true,
        errors: [],
        warnings: []
      } as FileValidationResult;

      // Check file size
      if (file.size > this.maxFileSize) {
        result.isValid = false;
        result.errors.push(
          `File size ${file.size} exceeds maximum allowed size of ${this.maxFileSize} bytes`
        );
      }

      // Check file type
      if (!this.allowedFileTypes.has(file.mimeType)) {
        result.isValid = false;
        result.errors.push(`File type ${file.mimeType} is not allowed`);
      }

      // Check file name
      if (!file.fileName || file.fileName.trim().length === 0) {
        result.isValid = false;
        result.errors.push('File name cannot be empty');
      }

      // Check for potentially dangerous file names
      if (file.fileName.includes('..') || file.fileName.includes('/') || file.fileName.includes('\\')) {
        result.isValid = false;
        result.errors.push('File name contains invalid characters');
      }

      // Add warnings for large files
      if (file.size > 10 * 1024 * 1024) { // 10MB
        result.warnings.push('Large file size may result in slower upload and retrieval times');
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Process file for upload (encrypt, compress, checksum)
   */
  private async processFileForUpload(
    file: MedicalFileUpload,
    options: FileProcessingOptions = {}
  ): Promise<ProcessedFile> {
    let processedBuffer = file.content;
    let encrypted = false;
    let compressed = false;

    // Compress file if requested
    if (options.compress) {
      const compressionResult = await this.compressFile(processedBuffer);
      processedBuffer = compressionResult.compressedData;
      compressed = true;
    }

    // Encrypt file if requested
    if (options.encrypt) {
      const encryptionResult = await this.encryptFile(processedBuffer);
      processedBuffer = encryptionResult.encryptedData;
      encrypted = true;
    }

    // Calculate checksum
    const checksum = this.calculateFileChecksum(file.content);

    return {
      originalFile: file,
      processedBuffer,
      checksum,
      encrypted,
      compressed
    };
  }

  /**
   * Create IPFS directory structure for files
   */
  private createFileDirectory(processedFiles: ProcessedFile[]): Record<string, any> {
    const directory: Record<string, any> = {};

    for (const processedFile of processedFiles) {
      directory[processedFile.originalFile.fileName] = {
        content: processedFile.processedBuffer.toString('base64'),
        fileType: processedFile.originalFile.fileType,
        mimeType: processedFile.originalFile.mimeType,
        originalSize: processedFile.originalFile.size,
        processedSize: processedFile.processedBuffer.length,
        checksum: processedFile.checksum,
        encrypted: processedFile.encrypted,
        compressed: processedFile.compressed,
        uploadedAt: new Date().toISOString()
      };
    }

    return directory;
  }

  /**
   * Calculate total size of files
   */
  private calculateTotalSize(files: MedicalFileUpload[]): number {
    return files.reduce((total, file) => total + file.size, 0);
  }

  /**
   * Calculate metadata checksum
   */
  private calculateIPFSMetadataChecksum(metadata: MedicalRecordIPFSData): string {
    // Only include stable, meaningful fields in checksum calculation
    const checksumPayload = {
      recordId: (metadata as any).recordId,
      patientId: (metadata as any).patientId,
      providerId: (metadata as any).providerId,
      recordType: (metadata as any).recordType,
      version: (metadata as any).version,
      clinicalData: (metadata as any).clinicalData,
      recordDescription: (metadata as any).recordDescription,
      encryptedFields: (metadata as any).encryptedFields || []
    };
    const metadataString = JSON.stringify(checksumPayload);
    return crypto.createHash('sha256').update(metadataString).digest('hex');
  }

  /**
   * Calculate file checksum
   */
  private calculateFileChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Encrypt file buffer
   */
  private deriveKey(): Buffer {
    // Derive a 32-byte key from the provided encryption key string
    return crypto.createHash('sha256').update(this.encryptionKey).digest();
  }

  private async encryptFile(buffer: Buffer): Promise<EncryptionResult> {
    const iv = crypto.randomBytes(16);
    const key = this.deriveKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const encryptedData = Buffer.concat([iv, encrypted]);

    return {
      encryptedData,
      iv: iv.toString('hex'),
      algorithm: 'aes-256-cbc'
    };
  }

  /**
   * Decrypt file buffer
   */
  private async decryptFile(encryptedBuffer: Buffer): Promise<Buffer> {
    const iv = encryptedBuffer.slice(0, 16);
    const encrypted = encryptedBuffer.slice(16);
    const key = this.deriveKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted;
  }

  /**
   * Compress file buffer
   */
  private async compressFile(buffer: Buffer): Promise<CompressionResult> {
    const compressed = gzipSync(buffer);
    return {
      compressedData: compressed,
      originalSize: buffer.length,
      compressedSize: compressed.length,
      compressionRatio: compressed.length / buffer.length,
      algorithm: 'gzip'
    };
  }

  /**
   * Decompress file buffer
   */
  private async decompressFile(compressedBuffer: Buffer): Promise<Buffer> {
    return gunzipSync(compressedBuffer);
  }

  /**
   * Encrypt string data
   */
  private async encryptString(data: string): Promise<string> {
    const buffer = Buffer.from(data, 'utf8');
    const result = await this.encryptFile(buffer);
    return result.encryptedData.toString('base64');
  }

  /**
   * Decrypt string data
   */
  private async decryptString(encryptedData: string): Promise<string> {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = await this.decryptFile(buffer);
    return decrypted.toString('utf8');
  }

  /**
   * Encrypt object data
   */
  private async encryptData(data: any): Promise<any> {
    const jsonString = JSON.stringify(data);
    return await this.encryptString(jsonString);
  }

  /**
   * Decrypt object data
   */
  private async decryptData(encryptedData: any): Promise<any> {
    if (typeof encryptedData === 'string') {
      const decryptedString = await this.decryptString(encryptedData);
      return JSON.parse(decryptedString);
    }
    return encryptedData;
  }

  /**
   * Get list of encrypted fields
   */
  private getEncryptedFields(metadata: MedicalRecordIPFSData): string[] {
    const encryptedFields: string[] = [];
    
    if (metadata.clinicalData && Object.keys(metadata.clinicalData).length > 0) {
      encryptedFields.push('clinicalData');
    }
    
    if (metadata.recordDescription && metadata.recordDescription.trim().length > 0) {
      encryptedFields.push('recordDescription');
    }

    return encryptedFields;
  }
}

// Helper interfaces
interface ProcessedFile {
  originalFile: MedicalFileUpload;
  processedBuffer: Buffer;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
}

export default MedicalRecordIPFSHandler;