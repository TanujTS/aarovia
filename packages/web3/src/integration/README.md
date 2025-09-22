# Smart Contract IPFS Integration

This module provides seamless integration between IPFS/Filecoin storage and your medical records smart contracts, enabling decentralized, encrypted storage of medical data with blockchain-based access control.

## Features

- **Multi-Provider IPFS Support**: Works with Pinata, Infura, Web3.Storage, and local IPFS nodes
- **AES-256 Encryption**: Automatic encryption of sensitive medical data
- **Smart Contract Integration**: Stores IPFS CIDs in your blockchain contracts
- **Comprehensive Medical Types**: Support for all medical record types (encounters, lab results, imaging, mental health, etc.)
- **File Attachment Support**: Upload and link medical files (PDFs, DICOM images, etc.)
- **Type Safety**: Full TypeScript support with comprehensive medical data structures

## Quick Start

### 1. Install Dependencies

```bash
npm install ethers ipfs-http-client crypto-js
```

### 2. Configure Environment

Create a `.env` file:

```env
# IPFS Configuration (using Pinata)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PINATA_JWT=your-pinata-jwt-token

# Smart Contract Configuration
CONTRACT_ADDRESS=your-deployed-contract-address
PRIVATE_KEY=your-wallet-private-key
RPC_URL=your-blockchain-rpc-url
```

### 3. Initialize Integration

```typescript
import { ethers } from 'ethers';
import { MedicalRecordsIPFSIntegration } from './smart-contract-ipfs.js';

// Setup blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Initialize IPFS integration
const ipfsIntegration = new MedicalRecordsIPFSIntegration({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
  pinataJWT: process.env.PINATA_JWT
}, contract);
```

### 4. Create Medical Records

```typescript
import { createEncounterRecord } from './smart-contract-ipfs.js';

// Create encounter record data
const encounterData = createEncounterRecord(
  'patient-123',
  'provider-456',
  'Routine Checkup',
  'Annual physical examination',
  ['Z00.00 - General adult medical examination']
);

// Store on IPFS and blockchain
const result = await ipfsIntegration.createEncounterRecord(
  'unique-record-id',
  'patient-123',
  patientWalletAddress,
  'provider-456',
  providerWalletAddress,
  encounterData,
  [], // File attachments (optional)
  'encryption-key' // Optional encryption key
);

console.log('Record stored with CID:', result.metadataCID);
console.log('Blockchain transaction:', result.transactionHash);
```

## Medical Record Types

The integration supports all comprehensive medical record types:

### Encounter Records
- Patient encounters and visits
- Physical examination findings
- Diagnosis and treatment plans
- File attachments support

### Lab Results
- Laboratory test results
- Reference ranges and interpretations
- PDF report file support
- Structured results data

### Imaging Reports
- Radiology and imaging studies
- DICOM image file support
- Multiple image attachments
- Radiologist interpretations

### Mental Health Records
- Therapy sessions and evaluations
- Mental status examinations
- Treatment plans and goals
- Confidential notes (always encrypted)

## API Reference

### MedicalRecordsIPFSIntegration

Main integration class that handles IPFS storage and smart contract interactions.

#### Methods

##### `createEncounterRecord()`
```typescript
async createEncounterRecord(
  recordId: string,
  patientId: string,
  patientWallet: string,
  providerId: string,
  providerWallet: string,
  encounterData: EncounterRecord,
  attachments?: File[],
  encryptionKey?: string
): Promise<{
  metadataCID: string;
  attachmentCIDs: string[];
  transactionHash: string;
}>
```

##### `createLabResultRecord()`
```typescript
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
}>
```

##### `createImagingRecord()`
```typescript
async createImagingRecord(
  recordId: string,
  patientId: string,
  patientWallet: string,
  providerId: string,
  providerWallet: string,
  imagingData: ImagingReportRecord,
  imageFiles?: File[],
  encryptionKey?: string
): Promise<{
  metadataCID: string;
  imageCIDs: string[];
  transactionHash: string;
}>
```

##### `getEncounterRecord()`
```typescript
async getEncounterRecord(
  recordId: string,
  encryptionKey?: string
): Promise<{
  contractData: any;
  encounterData: EncounterRecord;
  attachments: Blob[];
}>
```

##### `getPatientRecords()`
```typescript
async getPatientRecords(
  patientId: string,
  encryptionKey?: string
): Promise<{
  encounterRecords: EncounterRecord[];
  labResults: LabResultRecord[];
  imagingReports: ImagingReportRecord[];
  mentalHealthRecords: MentalHealthRecord[];
}>
```

## Encryption and Security

- **Automatic Encryption**: Sensitive medical data is automatically encrypted using AES-256
- **Key Management**: Encryption keys can be patient-specific or provider-managed
- **File Encryption**: Medical file attachments are encrypted before IPFS storage
- **Access Control**: Smart contract controls who can access encrypted records

## File Upload Workflow

1. **File Preparation**: Convert user uploads to File objects
2. **Type Detection**: Automatic detection of medical file types (PDF, DICOM, images)
3. **Encryption**: Files are encrypted using AES-256 before upload
4. **IPFS Storage**: Encrypted files are stored on IPFS
5. **Pinning**: Important files are automatically pinned for persistence
6. **Blockchain Reference**: IPFS CIDs are stored in smart contracts

## Best Practices

### Error Handling
```typescript
try {
  const result = await ipfsIntegration.createEncounterRecord(/* ... */);
  // Handle success
} catch (error) {
  if (error.message.includes('IPFS')) {
    // Handle IPFS-specific errors
  } else if (error.message.includes('contract')) {
    // Handle blockchain errors
  }
  console.error('Medical record creation failed:', error);
}
```

### Encryption Key Management
```typescript
// Use patient-specific encryption keys
const patientKey = deriveKeyForPatient(patientId);

// Or provider-managed keys
const clinicKey = process.env.CLINIC_ENCRYPTION_KEY;
```

### Large File Handling
```typescript
// For large files, consider chunking
const maxFileSize = 50 * 1024 * 1024; // 50MB
if (file.size > maxFileSize) {
  // Implement file chunking or compression
}
```

## Testing

The integration includes comprehensive test coverage. Run tests with:

```bash
npm test
```

## Troubleshooting

### Common Issues

1. **IPFS Connection Errors**
   - Verify API keys and configuration
   - Check network connectivity
   - Ensure IPFS provider is accessible

2. **Smart Contract Errors**
   - Verify contract address and ABI
   - Check wallet has sufficient gas
   - Ensure proper permissions

3. **Encryption Errors**
   - Verify encryption key format
   - Check key length (must be 32 bytes for AES-256)
   - Ensure consistent key usage for encrypt/decrypt

### Debug Mode

Enable debug logging:

```typescript
process.env.DEBUG = 'ipfs:*,contract:*';
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details