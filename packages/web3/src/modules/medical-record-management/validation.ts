/**
 * Medical Record Validation Module
 * Comprehensive validation for medical records, files, and security compliance
 */

import {
  MedicalRecordUploadRequest,
  MedicalRecordUpdateRequest,
  MedicalRecordIPFSData,
  MedicalFileUpload,
  MedicalRecordType,
  MedicalFileType,
  RecordSensitivityLevel,
  ValidationResult,
  FileValidationResult,
  MedicalRecordManagementError,
  MedicalRecordManagementException
} from './types';

export class MedicalRecordValidator {
  private readonly maxFileSize: number = 50 * 1024 * 1024; // 50MB
  private readonly maxFilesPerRecord: number = 20;
  private readonly maxRecordTitleLength: number = 200;
  private readonly maxDescriptionLength: number = 10000;
  private readonly maxNotesLength: number = 50000;

  private readonly allowedFileTypes: Set<string> = new Set([
    'application/pdf',
    'application/dicom',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'audio/mp3',
    'audio/wav',
    'text/plain',
    'application/json',
    'application/xml',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]);

  private readonly sensitiveFileTypes: Set<MedicalFileType> = new Set([
    MedicalFileType.DICOM,
    MedicalFileType.X_RAY,
    MedicalFileType.MRI,
    MedicalFileType.CT_SCAN,
    MedicalFileType.ULTRASOUND,
    MedicalFileType.ECG
  ]);

  /**
   * Validate medical record upload request
   */
  validateUploadRequest(request: MedicalRecordUploadRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!request.patientId || request.patientId.trim().length === 0) {
      errors.push('Patient ID is required');
    }

    if (!request.providerId || request.providerId.trim().length === 0) {
      errors.push('Provider ID is required');
    }

    if (!request.recordType || !Object.values(MedicalRecordType).includes(request.recordType)) {
      errors.push('Valid record type is required');
    }

    if (!request.recordTitle || request.recordTitle.trim().length === 0) {
      errors.push('Record title is required');
    } else if (request.recordTitle.length > this.maxRecordTitleLength) {
      errors.push(`Record title cannot exceed ${this.maxRecordTitleLength} characters`);
    }

    // Validate sensitivity level
    if (request.sensitivityLevel !== undefined && 
        !Object.values(RecordSensitivityLevel).includes(request.sensitivityLevel)) {
      errors.push('Invalid sensitivity level');
    }

    // Validate description length
    if (request.recordDescription && request.recordDescription.length > this.maxDescriptionLength) {
      errors.push(`Record description cannot exceed ${this.maxDescriptionLength} characters`);
    }

    // Validate clinical data
    const clinicalValidation = this.validateClinicalData(request.clinicalData);
    errors.push(...clinicalValidation.errors);
    warnings.push(...clinicalValidation.warnings);

    // Validate files
    if (!request.files || request.files.length === 0) {
      warnings.push('No files attached to medical record');
    } else {
      if (request.files.length > this.maxFilesPerRecord) {
        errors.push(`Cannot attach more than ${this.maxFilesPerRecord} files per record`);
      }

      for (let i = 0; i < request.files.length; i++) {
        const fileValidation = this.validateUploadFile(request.files[i], i);
        if (!fileValidation.isValid) {
          errors.push(...fileValidation.errors);
        }
        warnings.push(...fileValidation.warnings);
      }
    }

    // Validate tags
    if (request.tags && request.tags.length > 0) {
      const tagValidation = this.validateTags(request.tags);
      errors.push(...tagValidation.errors);
      warnings.push(...tagValidation.warnings);
    }

    // Validate location
    if (request.location) {
      const locationValidation = this.validateLocation(request.location);
      errors.push(...locationValidation.errors);
      warnings.push(...locationValidation.warnings);
    }

    // Sensitivity compliance checks
    if (request.isSensitive || request.sensitivityLevel > RecordSensitivityLevel.STANDARD) {
      const complianceValidation = this.validateSensitivityCompliance(request);
      errors.push(...complianceValidation.errors);
      warnings.push(...complianceValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate medical record update request
   */
  validateUpdateRequest(request: MedicalRecordUpdateRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate record ID
    if (!request.recordId || request.recordId.trim().length === 0) {
      errors.push('Record ID is required for updates');
    }

    // Validate optional fields if provided
    if (request.recordTitle !== undefined) {
      if (request.recordTitle.trim().length === 0) {
        errors.push('Record title cannot be empty');
      } else if (request.recordTitle.length > this.maxRecordTitleLength) {
        errors.push(`Record title cannot exceed ${this.maxRecordTitleLength} characters`);
      }
    }

    if (request.recordDescription !== undefined && 
        request.recordDescription.length > this.maxDescriptionLength) {
      errors.push(`Record description cannot exceed ${this.maxDescriptionLength} characters`);
    }

    if (request.notes !== undefined && request.notes.length > this.maxNotesLength) {
      errors.push(`Notes cannot exceed ${this.maxNotesLength} characters`);
    }

    // Validate clinical data if provided
    if (request.clinicalData) {
      const clinicalValidation = this.validateClinicalData(request.clinicalData);
      errors.push(...clinicalValidation.errors);
      warnings.push(...clinicalValidation.warnings);
    }

    // Validate additional files
    if (request.additionalFiles && request.additionalFiles.length > 0) {
      if (request.additionalFiles.length > this.maxFilesPerRecord) {
        errors.push(`Cannot add more than ${this.maxFilesPerRecord} additional files`);
      }

      for (let i = 0; i < request.additionalFiles.length; i++) {
        const fileValidation = this.validateUploadFile(request.additionalFiles[i], i);
        if (!fileValidation.isValid) {
          errors.push(...fileValidation.errors);
        }
        warnings.push(...fileValidation.warnings);
      }
    }

    // Validate tags
    if (request.tags && request.tags.length > 0) {
      const tagValidation = this.validateTags(request.tags);
      errors.push(...tagValidation.errors);
      warnings.push(...tagValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate medical file for upload
   */
  validateUploadFile(file: { file: File | Buffer; fileName: string; fileType: MedicalFileType; description?: string }, index: number): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get file details
    const fileSize = file.file instanceof File ? file.file.size : file.file.length;
    const mimeType = file.file instanceof File ? file.file.type : this.getMimeTypeFromFileType(file.fileType);

    // Validate file name
    if (!file.fileName || file.fileName.trim().length === 0) {
      errors.push(`File ${index + 1}: File name is required`);
    } else {
      // Check for dangerous file name patterns
      if (this.containsDangerousPatterns(file.fileName)) {
        errors.push(`File ${index + 1}: File name contains invalid or dangerous characters`);
      }
      
      // Check file extension matches type
      const extensionValidation = this.validateFileExtension(file.fileName, file.fileType);
      if (!extensionValidation.isValid) {
        errors.push(`File ${index + 1}: ${extensionValidation.errors.join(', ')}`);
      }
    }

    // Validate file size
    if (fileSize === 0) {
      errors.push(`File ${index + 1}: File is empty`);
    } else if (fileSize > this.maxFileSize) {
      errors.push(`File ${index + 1}: File size (${this.formatFileSize(fileSize)}) exceeds maximum allowed size (${this.formatFileSize(this.maxFileSize)})`);
    }

    // Large file warning
    if (fileSize > 10 * 1024 * 1024) { // 10MB
      warnings.push(`File ${index + 1}: Large file size may result in slower upload and processing times`);
    }

    // Validate file type
    if (!Object.values(MedicalFileType).includes(file.fileType)) {
      errors.push(`File ${index + 1}: Invalid file type specified`);
    }

    // Validate MIME type
    if (mimeType && !this.allowedFileTypes.has(mimeType)) {
      errors.push(`File ${index + 1}: File type '${mimeType}' is not allowed`);
    }

    // Validate description
    if (file.description && file.description.length > 500) {
      errors.push(`File ${index + 1}: File description cannot exceed 500 characters`);
    }

    // Sensitive file type warnings
    if (this.sensitiveFileTypes.has(file.fileType)) {
      warnings.push(`File ${index + 1}: This file type contains sensitive medical information and will be handled with enhanced security`);
    }

    return {
      isValid: errors.length === 0,
      fileName: file.fileName,
      fileSize,
      mimeType: mimeType || 'unknown',
      fileType: file.fileType,
      errors,
      warnings
    };
  }

  /**
   * Validate MedicalFileUpload object
   */
  validateMedicalFileUpload(file: MedicalFileUpload): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file name
    if (!file.fileName || file.fileName.trim().length === 0) {
      errors.push('File name is required');
    } else if (this.containsDangerousPatterns(file.fileName)) {
      errors.push('File name contains invalid or dangerous characters');
    }

    // Validate file size
    if (file.size === 0) {
      errors.push('File is empty');
    } else if (file.size > this.maxFileSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(this.maxFileSize)})`);
    }

    // Large file warning
    if (file.size > 10 * 1024 * 1024) { // 10MB
      warnings.push('Large file size may result in slower upload and processing times');
    }

    // Validate file type
    if (!Object.values(MedicalFileType).includes(file.fileType)) {
      errors.push('Invalid file type specified');
    }

    // Validate MIME type
    if (!this.allowedFileTypes.has(file.mimeType)) {
      errors.push(`File type '${file.mimeType}' is not allowed`);
    }

    // Check if file type matches MIME type
    const expectedMimeType = this.getMimeTypeFromFileType(file.fileType);
    if (expectedMimeType && file.mimeType !== expectedMimeType) {
      warnings.push(`File MIME type '${file.mimeType}' does not match expected type '${expectedMimeType}' for ${file.fileType}`);
    }

    // Validate content buffer
    if (!file.content || file.content.length !== file.size) {
      errors.push('File content does not match specified size');
    }

    // Validate description
    if (file.description && file.description.length > 500) {
      errors.push('File description cannot exceed 500 characters');
    }

    // Sensitive file type warnings
    if (this.sensitiveFileTypes.has(file.fileType)) {
      warnings.push('This file type contains sensitive medical information and will be handled with enhanced security');
    }

    return {
      isValid: errors.length === 0,
      fileName: file.fileName,
      fileSize: file.size,
      mimeType: file.mimeType,
      fileType: file.fileType,
      errors,
      warnings
    };
  }

  /**
   * Validate IPFS data structure
   */
  validateIPFSData(data: MedicalRecordIPFSData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!data.recordId || data.recordId.trim().length === 0) {
      errors.push('Record ID is required');
    }

    if (!data.patientId || data.patientId.trim().length === 0) {
      errors.push('Patient ID is required');
    }

    if (!data.providerId || data.providerId.trim().length === 0) {
      errors.push('Provider ID is required');
    }

    if (!Object.values(MedicalRecordType).includes(data.recordType)) {
      errors.push('Valid record type is required');
    }

    if (!data.recordTitle || data.recordTitle.trim().length === 0) {
      errors.push('Record title is required');
    }

    // Validate dates
    if (!this.isValidDateString(data.createdDate)) {
      errors.push('Invalid created date format');
    }

    if (!this.isValidDateString(data.lastUpdated)) {
      errors.push('Invalid last updated date format');
    }

    // Validate clinical data structure
    if (data.clinicalData) {
      const clinicalValidation = this.validateClinicalData(data.clinicalData);
      errors.push(...clinicalValidation.errors);
      warnings.push(...clinicalValidation.warnings);
    }

    // Validate attachments
    if (data.attachments && data.attachments.length > 0) {
      for (let i = 0; i < data.attachments.length; i++) {
        const attachment = data.attachments[i];
        if (!attachment.fileName || !attachment.fileCID || !attachment.checksumHash) {
          errors.push(`Attachment ${i + 1}: Missing required fields`);
        }
      }
    }

    // Validate security info
    if (data.securityInfo) {
      if (!Object.values(RecordSensitivityLevel).includes(data.securityInfo.encryptionLevel)) {
        errors.push('Invalid encryption level in security info');
      }
    }

    // Validate metadata
    if (data.metadata) {
      if (!data.metadata.version || data.metadata.version.trim().length === 0) {
        errors.push('Metadata version is required');
      }
      if (!data.metadata.lastModifiedBy || data.metadata.lastModifiedBy.trim().length === 0) {
        errors.push('Last modified by user is required in metadata');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate clinical data structure
   */
  private validateClinicalData(clinicalData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!clinicalData || typeof clinicalData !== 'object') {
      return { isValid: true, errors: [], warnings: ['Clinical data is empty or invalid'] };
    }

    // Validate symptoms array
    if (clinicalData.symptoms && Array.isArray(clinicalData.symptoms)) {
      for (let i = 0; i < clinicalData.symptoms.length; i++) {
        if (typeof clinicalData.symptoms[i] !== 'string' || clinicalData.symptoms[i].trim().length === 0) {
          errors.push(`Symptom ${i + 1}: Must be a non-empty string`);
        }
      }
    }

    // Validate diagnosis array
    if (clinicalData.diagnosis && Array.isArray(clinicalData.diagnosis)) {
      for (let i = 0; i < clinicalData.diagnosis.length; i++) {
        if (typeof clinicalData.diagnosis[i] !== 'string' || clinicalData.diagnosis[i].trim().length === 0) {
          errors.push(`Diagnosis ${i + 1}: Must be a non-empty string`);
        }
      }
    }

    // Validate medications array
    if (clinicalData.medications && Array.isArray(clinicalData.medications)) {
      for (let i = 0; i < clinicalData.medications.length; i++) {
        const med = clinicalData.medications[i];
        if (!med.name || typeof med.name !== 'string' || med.name.trim().length === 0) {
          errors.push(`Medication ${i + 1}: Name is required`);
        }
        if (!med.dosage || typeof med.dosage !== 'string' || med.dosage.trim().length === 0) {
          errors.push(`Medication ${i + 1}: Dosage is required`);
        }
        if (!med.startDate || !this.isValidDateString(med.startDate)) {
          errors.push(`Medication ${i + 1}: Valid start date is required`);
        }
      }
    }

    // Validate vital signs
    if (clinicalData.vitalSigns) {
      const vitals = clinicalData.vitalSigns;
      if (vitals.temperature && (typeof vitals.temperature !== 'number' || vitals.temperature < 90 || vitals.temperature > 110)) {
        warnings.push('Temperature value appears abnormal (should be in Fahrenheit between 90-110°F)');
      }
      if (vitals.heartRate && (typeof vitals.heartRate !== 'number' || vitals.heartRate < 30 || vitals.heartRate > 250)) {
        warnings.push('Heart rate value appears abnormal (should be between 30-250 BPM)');
      }
      if (vitals.respiratoryRate && (typeof vitals.respiratoryRate !== 'number' || vitals.respiratoryRate < 8 || vitals.respiratoryRate > 60)) {
        warnings.push('Respiratory rate value appears abnormal (should be between 8-60 BPM)');
      }
    }

    // Validate lab results
    if (clinicalData.labResults && Array.isArray(clinicalData.labResults)) {
      for (let i = 0; i < clinicalData.labResults.length; i++) {
        const lab = clinicalData.labResults[i];
        if (!lab.testName || typeof lab.testName !== 'string' || lab.testName.trim().length === 0) {
          errors.push(`Lab result ${i + 1}: Test name is required`);
        }
        if (!lab.value || typeof lab.value !== 'string' || lab.value.trim().length === 0) {
          errors.push(`Lab result ${i + 1}: Test value is required`);
        }
      }
    }

    // Validate notes length
    if (clinicalData.notes && typeof clinicalData.notes === 'string' && clinicalData.notes.length > this.maxNotesLength) {
      errors.push(`Clinical notes cannot exceed ${this.maxNotesLength} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate tags array
   */
  private validateTags(tags: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (tags.length > 20) {
      errors.push('Cannot have more than 20 tags per record');
    }

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        errors.push(`Tag ${i + 1}: Must be a non-empty string`);
      } else if (tag.length > 50) {
        errors.push(`Tag ${i + 1}: Cannot exceed 50 characters`);
      } else if (!/^[a-zA-Z0-9\-_\s]+$/.test(tag)) {
        errors.push(`Tag ${i + 1}: Can only contain letters, numbers, spaces, hyphens, and underscores`);
      }
    }

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase().trim()));
    if (uniqueTags.size !== tags.length) {
      warnings.push('Duplicate tags detected and will be removed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate location information
   */
  private validateLocation(location: { facilityName: string; address: string }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!location.facilityName || location.facilityName.trim().length === 0) {
      errors.push('Facility name is required when location is provided');
    } else if (location.facilityName.length > 200) {
      errors.push('Facility name cannot exceed 200 characters');
    }

    if (!location.address || location.address.trim().length === 0) {
      errors.push('Address is required when location is provided');
    } else if (location.address.length > 500) {
      errors.push('Address cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate sensitivity compliance requirements
   */
  private validateSensitivityCompliance(request: MedicalRecordUploadRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // High sensitivity records require enhanced validation
    if (request.sensitivityLevel >= RecordSensitivityLevel.HIGHLY_SENSITIVE) {
      if (!request.recordDescription || request.recordDescription.trim().length === 0) {
        errors.push('High sensitivity records require a detailed description');
      }

      // Check for sensitive file types
      const hasSensitiveFiles = request.files.some(file => 
        this.sensitiveFileTypes.has(file.fileType)
      );

      if (hasSensitiveFiles) {
        warnings.push('Record contains sensitive medical imaging files and will require additional encryption');
      }
    }

    // Restricted records have additional requirements
    if (request.sensitivityLevel === RecordSensitivityLevel.RESTRICTED) {
      warnings.push('Restricted records require special authorization and audit logging');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file extension matches file type
   */
  private validateFileExtension(fileName: string, fileType: MedicalFileType): ValidationResult {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    const validExtensions = this.getValidExtensionsForFileType(fileType);

    if (validExtensions.length > 0 && !validExtensions.includes(extension)) {
      return {
        isValid: false,
        errors: [`File extension '.${extension}' does not match file type ${fileType}. Expected: ${validExtensions.join(', ')}`],
        warnings: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  /**
   * Get valid file extensions for a medical file type
   */
  private getValidExtensionsForFileType(fileType: MedicalFileType): string[] {
    const extensionMap: Record<MedicalFileType, string[]> = {
      [MedicalFileType.PDF]: ['pdf'],
      [MedicalFileType.IMAGE_JPEG]: ['jpg', 'jpeg'],
      [MedicalFileType.IMAGE_PNG]: ['png'],
      [MedicalFileType.DICOM]: ['dcm', 'dicom'],
      [MedicalFileType.X_RAY]: ['jpg', 'jpeg', 'png', 'dcm', 'dicom'],
      [MedicalFileType.MRI]: ['dcm', 'dicom', 'nii', 'nifti'],
      [MedicalFileType.CT_SCAN]: ['dcm', 'dicom'],
      [MedicalFileType.ULTRASOUND]: ['jpg', 'jpeg', 'png', 'dcm', 'dicom'],
      [MedicalFileType.ECG]: ['pdf', 'png', 'jpg', 'jpeg'],
      [MedicalFileType.DOCUMENT]: ['pdf', 'doc', 'docx', 'txt'],
      [MedicalFileType.AUDIO]: ['mp3', 'wav', 'aac'],
      [MedicalFileType.VIDEO]: ['mp4', 'avi', 'mov'],
      [MedicalFileType.CSV]: ['csv'],
      [MedicalFileType.JSON]: ['json'],
      [MedicalFileType.XML]: ['xml'],
      [MedicalFileType.OTHER]: []
    };

    return extensionMap[fileType] || [];
  }

  /**
   * Get MIME type from medical file type
   */
  private getMimeTypeFromFileType(fileType: MedicalFileType): string | null {
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

    return mimeTypeMap[fileType] || null;
  }

  /**
   * Check if file name contains dangerous patterns
   */
  private containsDangerousPatterns(fileName: string): boolean {
    const dangerousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid file name characters
      /[\x00-\x1f]/,  // Control characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i,  // Windows reserved names
      /^\s+|\s+$/  // Leading/trailing whitespace
    ];

    return dangerousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Check if string is a valid ISO date
   */
  private isValidDateString(dateString: string): boolean {
    if (!dateString || typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().slice(0, -5) === dateString.slice(0, -5);
  }

  /**
   * Format file size for human reading
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Sanitize and normalize input strings
   */
  sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');  // Remove control characters
  }

  /**
   * Create validation exception
   */
  createValidationException(validationResult: ValidationResult): MedicalRecordManagementException {
    return new MedicalRecordManagementException(
      MedicalRecordManagementError.VALIDATION_ERROR,
      `Validation failed: ${validationResult.errors.join(', ')}`,
      { validationResult }
    );
  }
}

export default MedicalRecordValidator;