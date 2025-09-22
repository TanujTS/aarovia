# Medical Records IPFS Implementation

A comprehensive IPFS-based storage solution for medical records with encryption, multi-provider support, and complete medical data structure compliance.

## Overview

This implementation provides secure, decentralized storage for medical records using IPFS (InterPlanetary File System) with the following features:

- **Complete Medical Data Structures**: Full compliance with medical record formats including Patient Profiles, Provider Profiles, Encounter Records, Lab Results, Imaging Reports, Mental Health Records, Surgery Records, Genetic Test Records, and Raw Medical Files.
- **Multi-Provider IPFS Support**: Pinata, Infura, Web3.Storage, and local IPFS nodes
- **AES-256 Encryption**: Secure encryption for sensitive medical data
- **Smart Contract Integration**: Seamless CID storage in blockchain contracts
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Installation

```bash
npm install ipfs-http-client @pinata/sdk crypto-js @web3-storage/w3up-client
```

## Quick Start

### 1. Basic Setup

```typescript
import { createPinataClient, IPFSClient } from './src/ipfs.js';
import { PatientProfile, ProviderProfile } from './src/types/medical-data-types.js';

// Initialize IPFS client
const client = createPinataClient(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_KEY!
);
```

### 2. Upload Patient Profile

```typescript
const patientProfile: PatientProfile = {
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "1985-06-15",
  gender: "Male",
  blood_type: "A+",
  contact_info: {
    phone_number: "+1-555-0123",
    email: "john.doe@email.com",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state_province: "CA",
      zip_code: "90210",
      country: "USA"
    }
  },
  emergency_contact: {
    name: "Jane Doe",
    relationship: "Spouse",
    phone_number: "+1-555-0124"
  },
  insurance_information: {
    provider_name: "Blue Cross Blue Shield",
    policy_number: "BC123456789",
    group_number: "GRP001"
  },
  allergies: [
    {
      allergen_name: "Penicillin",
      reaction: "Rash",
      severity: "Moderate",
      onsetDate: "2010-03-15"
    }
  ],
  current_medications: [
    {
      medication_name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      start_date: "2020-01-15",
      prescribing_doctor_id: "QmProviderCID123"
    }
  ],
  past_medical_history: [
    {
      condition_name: "Type 2 Diabetes",
      diagnosis_date: "2020-01-15",
      notes: "Well controlled with medication and diet"
    }
  ],
  family_medical_history: [
    {
      relationship: "Father",
      condition_name: "Coronary Artery Disease",
      notes: "Diagnosed at age 65"
    }
  ],
  lifestyle_factors: {
    smoking_status: "Never smoker",
    alcohol_consumption: "Occasional social drinking",
    exercise_habits: "Walks 30 minutes daily",
    dietary_preferences: "Low carb diet"
  }
};

// Upload with encryption
const result = await client.uploadPatientProfile(patientProfile, true);
console.log('Patient Profile CID:', result.hash);

// Pin for persistence
await client.pinContent(result.hash);
```

### 3. Upload Medical Records

```typescript
import { EncounterRecord, LabResultRecord } from './src/types/medical-data-types.js';

// Encounter Record
const encounterRecord: EncounterRecord = {
  record_id: "ENC-2025-001",
  record_type: "Encounter",
  created_date: "2025-09-22T10:00:00Z",
  last_updated: "2025-09-22T10:00:00Z",
  encounter_id: "ENC-2025-001",
  encounter_date_time: "2025-09-22T10:00:00Z",
  reason_for_visit: "Annual physical examination",
  chief_complaint: "Routine checkup",
  history_of_present_illness: "Patient reports no new symptoms",
  physical_examination_findings: "BP: 130/80, HR: 72, normal examination",
  diagnosis: [
    {
      diagnosis_code: "Z00.00",
      diagnosis_description: "General adult medical examination",
      is_primary: true
    }
  ],
  treatments_prescribed: [
    {
      treatment_name: "Continue current diabetes management",
      details: "Maintain current Metformin dosage"
    }
  ],
  medications_prescribed_at_encounter: [
    {
      medication_name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      start_date: "2025-09-22",
      end_date: "2026-09-22"
    }
  ],
  procedures_performed: [
    {
      procedure_code: "99213",
      procedure_description: "Office visit, established patient",
      procedure_date: "2025-09-22",
      notes: "Comprehensive examination performed"
    }
  ],
  referrals: [
    {
      referred_to_provider_id: "QmEndocrinologistCID",
      reason: "Diabetes management consultation",
      referral_date: "2025-09-22"
    }
  ],
  follow_up_instructions: "Return in 6 months for follow-up",
  notes: "Patient doing well overall"
};

const encounterResult = await client.uploadEncounterRecord(encounterRecord, true);
await client.pinContent(encounterResult.hash);
```

### 4. Download and Decrypt Data

```typescript
// Download patient profile (encrypted)
const encryptionKey = 'your-encryption-key';
const retrievedProfile = await client.downloadJSON<PatientProfile>(
  result.hash,
  true,
  encryptionKey
);

console.log('Retrieved patient:', retrievedProfile.first_name, retrievedProfile.last_name);
```

## Medical Data Structures

### Patient Profile
Complete patient demographic and medical history information:
- Personal information (name, DOB, gender, blood type)
- Contact information and emergency contacts
- Insurance information
- Allergies and current medications
- Past medical history and family history
- Lifestyle factors

### Provider Profile
Healthcare provider information:
- Name and contact information
- Medical specialty and credentials
- License and NPI numbers
- Associated hospital/institution
- Public key for encryption

### Encounter Records
Detailed medical encounter documentation:
- Visit information and chief complaint
- Physical examination findings
- Diagnoses with ICD codes
- Treatments and procedures performed
- Medications prescribed
- Referrals and follow-up instructions
- Attachments (notes, documents)

### Laboratory Results
Comprehensive lab test results:
- Test information and codes
- Detailed results data with reference ranges
- Interpretation and status
- Report file attachments

### Imaging Reports
Medical imaging study reports:
- Modality and body part examined
- Radiologist findings and impressions
- DICOM image references
- Report file attachments

### Mental Health Records
Secure mental health session documentation:
- Session details and therapist information
- Mental status examination
- Assessment and treatment plans
- Risk assessments
- Confidential notes (highly encrypted)

### Surgery Records
Surgical procedure documentation:
- Pre-operative assessments
- Procedure details and findings
- Post-operative care plans
- Operative reports and images

### Genetic Test Records
Genetic testing results and analysis:
- Test details and methodologies
- Genetic variants and interpretations
- Recommendations and counseling notes
- Privacy controls and consent

### Raw Medical Files
Any medical document or file:
- File metadata and categorization
- Encryption and access controls
- Provider and patient associations
- Upload tracking and versioning

## IPFS Providers

### Pinata (Recommended)
```typescript
const client = createPinataClient(apiKey, secretKey);
```

### Infura
```typescript
const client = createInfuraClient(projectId, projectSecret);
```

### Web3.Storage
```typescript
const client = createWeb3StorageClient(token);
```

### Local IPFS Node
```typescript
const client = createLocalClient('http://localhost:5001');
```

## Encryption

All sensitive medical data supports AES-256 encryption:

```typescript
// Upload with encryption
const result = await client.uploadPatientProfile(profile, true);

// Download with decryption
const decrypted = await client.downloadJSON<PatientProfile>(
  cid, 
  true, 
  encryptionKey
);
```

## File Types Supported

The system supports all medical file types:

- **PATIENT_PROFILE**: Patient demographic and medical information
- **PROVIDER_PROFILE**: Healthcare provider information
- **INSTITUTION_PROFILE**: Healthcare institution details
- **ENCOUNTER_RECORD**: Medical encounter documentation
- **LAB_RESULT**: Laboratory test results
- **IMAGING_REPORT**: Medical imaging reports
- **PRESCRIPTION**: Prescription records
- **MENTAL_HEALTH_RECORD**: Mental health session notes
- **SURGERY_RECORD**: Surgical procedure records
- **GENETIC_TEST_RECORD**: Genetic testing results
- **MEDICAL_IMAGE**: Medical images and scans
- **DICOM_IMAGE**: DICOM format medical images
- **DOCUMENT_PDF**: PDF documents
- **CONSULTATION_NOTES**: Clinical consultation notes
- **DISCHARGE_SUMMARY**: Hospital discharge summaries
- **TREATMENT_PLAN**: Treatment and care plans
- **INSURANCE_DOCUMENT**: Insurance-related documents
- **CONSENT_FORM**: Medical consent forms
- **RAW_MEDICAL_FILE**: Any other medical file

## Smart Contract Integration

The system includes integration classes for storing CIDs in smart contracts:

```typescript
import { MedicalRecordsIPFSIntegration } from './src/integration/smart-contract-ipfs.js';

const integration = new MedicalRecordsIPFSIntegration(
  ipfsClient,
  contractAddress,
  web3Provider
);

// Upload and store CID in contract
const patientId = "patient123";
const cid = await integration.uploadAndStorePatientProfile(
  patientProfile,
  patientId,
  true // encrypt
);
```

## Configuration

Environment variables for configuration:

```bash
# Pinata Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Infura Configuration  
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_project_secret

# Web3.Storage Configuration
WEB3_STORAGE_TOKEN=your_w3s_token

# Local IPFS Configuration
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Encryption
DEFAULT_ENCRYPTION_KEY=your_32_character_encryption_key
```

## Security Best Practices

1. **Always encrypt sensitive medical data** (patient profiles, mental health records)
2. **Use strong encryption keys** (minimum 32 characters)
3. **Pin important content** to ensure persistence
4. **Validate data structures** before upload
5. **Implement access controls** in your application layer
6. **Regular key rotation** for encryption keys
7. **Audit trails** for all medical data access

## Examples

Complete examples are available in:
- `src/examples/complete-medical-examples.ts` - Comprehensive usage examples
- `src/test/medical-data-validation.test.ts` - Data structure validation tests

## API Reference

### IPFSClient Methods

#### Upload Methods
- `uploadPatientProfile(profile, encrypt?)` - Upload patient profile
- `uploadProviderProfile(profile, encrypt?)` - Upload provider profile  
- `uploadEncounterRecord(record, encrypt?)` - Upload encounter record
- `uploadLabResultRecord(record, encrypt?)` - Upload lab results
- `uploadImagingReportRecord(record, encrypt?)` - Upload imaging report
- `uploadMentalHealthRecord(record, encrypt?)` - Upload mental health record
- `uploadRawMedicalFile(file, metadata, encrypt?)` - Upload raw medical file
- `uploadInstitutionProfile(profile, encrypt?)` - Upload institution profile

#### Download Methods
- `downloadJSON<T>(cid, encrypted?, key?)` - Download and parse JSON data
- `downloadFile(cid, encrypted?, key?)` - Download file as Blob

#### Utility Methods
- `pinContent(cid)` - Pin content for persistence
- `uploadFile(file, type, encrypt?, key?)` - Generic file upload

### File Categories

Raw medical files are categorized for better organization:
- `PATIENT_PHOTO`, `INSURANCE_CARD`, `ID_DOCUMENT`
- `LAB_REPORT`, `PATHOLOGY_REPORT`, `RADIOLOGY_REPORT`
- `X_RAY`, `CT_SCAN`, `MRI`, `ULTRASOUND`
- `PRESCRIPTION`, `DISCHARGE_SUMMARY`, `OPERATIVE_REPORT`
- `CONSENT_FORM`, `MEDICAL_HISTORY`, `SCANNED_DOCUMENT`
- `GENETIC_REPORT`, `THERAPY_NOTES`, `OTHER`

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const result = await client.uploadPatientProfile(profile, true);
  console.log('Upload successful:', result.hash);
} catch (error) {
  if (error.message.includes('File size exceeds maximum')) {
    console.error('File too large');
  } else if (error.message.includes('Encryption failed')) {
    console.error('Encryption error');
  } else {
    console.error('Upload failed:', error.message);
  }
}
```

## Contributing

When contributing to this medical IPFS implementation:

1. Ensure all medical data structures comply with healthcare standards
2. Add comprehensive tests for new functionality
3. Follow TypeScript best practices
4. Include proper error handling and validation
5. Update documentation for new features
6. Consider HIPAA compliance requirements

## License

This implementation is designed for healthcare applications and should be used in compliance with relevant healthcare data protection regulations (HIPAA, GDPR, etc.).

## Support

For issues and questions:
- Check the test files for usage examples
- Review the comprehensive examples in the examples directory
- Ensure proper environment configuration
- Validate data structures against the TypeScript interfaces