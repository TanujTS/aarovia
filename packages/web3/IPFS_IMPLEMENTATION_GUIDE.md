# IPFS/Filecoin Implementation Guide for Aarovia Medical Records Platform

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in your `packages/web3` directory:

```bash
# IPFS/Storage Provider Configuration

# Pinata (Recommended for production)
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# Infura IPFS (Alternative provider)
INFURA_PROJECT_ID=your-infura-project-id
INFURA_SECRET_KEY=your-infura-secret-key

# Web3.Storage (Future implementation)
WEB3_STORAGE_TOKEN=your-web3-storage-token

# Environment
NODE_ENV=development
```

### 2. Get API Keys

#### Pinata Setup (Recommended)
1. Go to [Pinata](https://pinata.cloud/)
2. Create an account
3. Navigate to API Keys section
4. Generate new API key with admin permissions
5. Copy API Key and Secret Key to your `.env` file

#### Infura IPFS Setup (Alternative)
1. Go to [Infura](https://infura.io/)
2. Create an account
3. Create a new IPFS project
4. Copy Project ID and Project Secret to your `.env` file

### 3. Usage Examples

#### Basic File Upload

```typescript
import { createPinataClient, FileType } from '@aarovia/web3/ipfs';

const client = createPinataClient(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_KEY!
);

// Upload a medical image
const result = await client.uploadFile(
  medicalImageFile,
  FileType.MEDICAL_IMAGE,
  true, // encrypt
  'patient-encryption-key'
);

console.log('File uploaded:', result.hash);
console.log('Gateway URL:', result.url);
```

#### Medical Record Creation

```typescript
import { createMedicalRecordsIntegration } from '@aarovia/web3/integration/smart-contract-ipfs';

// Create integration instance
const integration = createMedicalRecordsIntegration(
  contractAddress,
  contractABI,
  signer
);

// Create complete medical record
const result = await integration.createMedicalRecord(
  'record-001',
  'patient-123',
  patientWalletAddress,
  'provider-456',
  providerWalletAddress,
  1, // RecordType.Diagnostic
  'Blood Test Results',
  true, // sensitive
  [labReportPDF, xrayImage], // files
  'patient-encryption-key'
);

console.log('Record created:', result.metadataCID);
console.log('Transaction:', result.transactionHash);
```

## 📊 Data Structures

### Medical Record Metadata (JSON)

```json
{
  "recordId": "record-001",
  "patientId": "patient-123",
  "providerId": "provider-456",
  "recordType": "lab-result",
  "title": "Complete Blood Count",
  "description": "CBC performed on 2025-09-22",
  "createdAt": 1727049600000,
  "updatedAt": 1727049600000,
  "isSensitive": true,
  "attachments": [
    {
      "cid": "QmXoYPCVmRVWGJKgKG4Qg9Kq2nHvB2xr3j8k3q8XaHbRdX",
      "filename": "lab-report.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "encrypted": true
    }
  ],
  "version": "1.0"
}
```

### Provider Profile (JSON)

```json
{
  "providerId": "provider-456",
  "name": "Dr. Jane Smith",
  "specialty": "Cardiology",
  "license": "MD-12345",
  "npi": "1234567890",
  "contact": {
    "email": "jane.smith@hospital.com",
    "phone": "+1-555-0123",
    "address": {
      "street": "123 Medical Center Dr",
      "city": "Healthcare City",
      "state": "CA",
      "zipCode": "90210",
      "country": "USA"
    }
  },
  "credentials": [
    "Board Certified in Cardiology",
    "Fellow of American College of Cardiology"
  ],
  "verificationStatus": true,
  "createdAt": 1727049600000,
  "updatedAt": 1727049600000
}
```

## 🔐 Security Features

### Encryption
- **Automatic encryption** for sensitive medical data
- **AES-256 encryption** using crypto-js
- **Patient-specific encryption keys** for data isolation
- **Key rotation support** for enhanced security

### Access Control Integration
```typescript
// Check access before downloading
const hasAccess = await accessControlContract.checkAccess(
  recordId,
  patientId,
  recordType,
  requesterAddress
);

if (hasAccess) {
  const medicalRecord = await integration.getMedicalRecord(
    recordId,
    encryptionKey
  );
}
```

## 🌐 Multi-Provider Support

### Provider Priority
1. **Production**: Pinata (primary) + Web3.Storage (backup)
2. **Staging**: Pinata (primary) + Infura (backup)
3. **Development**: Local IPFS node + Infura (backup)

### Automatic Failover
```typescript
const configs = getIPFSConfig();
for (const config of configs) {
  try {
    const client = new IPFSClient(config);
    const result = await client.uploadFile(file, fileType);
    return result; // Success with this provider
  } catch (error) {
    console.warn(`Provider ${config.provider} failed, trying next...`);
  }
}
throw new Error('All IPFS providers failed');
```

## 📁 File Type Support

### Supported MIME Types
- **Medical Images**: JPEG, PNG, GIF, BMP, TIFF, DICOM
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Data Files**: JSON, XML, CSV, XLS, XLSX

### File Size Limits
- Medical Images: 50MB
- PDF Documents: 20MB
- Lab Results: 10MB
- JSON Metadata: 1MB

## 🔄 Smart Contract Integration

### Medical Records Contract

```solidity
// Store IPFS CID in smart contract
function createMedicalRecord(
    bytes32 _recordId,
    bytes32 _patientId,
    address _patientWallet,
    bytes32 _providerId,
    address _providerWallet,
    RecordType _recordType,
    string calldata _recordCID, // IPFS CID stored here
    string calldata _title,
    bool _isSensitive,
    address _ownerAddress
) external;
```

### Provider Registry Contract

```solidity
// Store provider profile CID
function registerProvider(
    address _providerAddress,
    bytes32 _providerId,
    string calldata _providerDetailsCID, // IPFS CID stored here
    ProviderType _providerType
) public;
```

## 🛠️ Development Workflow

### 1. Local IPFS Node (Optional)
```bash
# Install IPFS
npm install -g ipfs

# Initialize and start IPFS node
ipfs init
ipfs daemon
```

### 2. Testing with Mock Data
```typescript
// Use development configuration with local IPFS
const client = new IPFSClient({
  provider: StorageProvider.IPFS,
  apiUrl: 'http://127.0.0.1:5001',
  gatewayUrl: 'http://127.0.0.1:8080/ipfs/'
});
```

### 3. Environment Validation
```typescript
import { validateEnvironmentConfig } from '@aarovia/web3/config/ipfs-config';

const validation = validateEnvironmentConfig();
if (!validation.isValid) {
  console.error('Missing environment variables:', validation.missingVars);
}
```

## 🚀 Deployment Checklist

### Production Deployment
- [ ] Set up Pinata account with billing
- [ ] Configure Web3.Storage backup
- [ ] Set up proper encryption key management
- [ ] Configure file size limits
- [ ] Set up monitoring for IPFS gateway health
- [ ] Test failover scenarios
- [ ] Set up content pinning strategies

### Environment Variables (Production)
```bash
NODE_ENV=production
PINATA_API_KEY=prod-api-key
PINATA_SECRET_KEY=prod-secret-key
WEB3_STORAGE_TOKEN=prod-web3-token
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Upload success rates per provider
- Download latency from gateways
- Storage costs per provider
- File retrieval success rates
- Encryption/decryption performance

### Health Checks
```typescript
// Regular health check for IPFS providers
async function healthCheck() {
  const configs = getIPFSConfig();
  for (const config of configs) {
    try {
      const client = new IPFSClient(config);
      // Test upload small file
      const testResult = await client.uploadJSON(
        { test: 'health-check', timestamp: Date.now() },
        FileType.MEDICAL_RECORD_JSON
      );
      console.log(`✅ ${config.provider} is healthy`);
    } catch (error) {
      console.error(`❌ ${config.provider} is down:`, error);
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **IPFS Gateway Timeout**
   - Switch to different gateway URL
   - Implement retry logic with exponential backoff

2. **Large File Upload Failures**
   - Check file size limits
   - Implement chunked upload for large files

3. **Encryption Key Management**
   - Store keys securely (not in localStorage)
   - Implement key rotation
   - Use patient-specific keys

4. **Network Issues**
   - Implement proper error handling
   - Set up monitoring alerts
   - Use multiple provider fallbacks

### Debug Mode
```typescript
// Enable debug logging
const client = new IPFSClient({
  ...config,
  debug: true // Add this option
});
```

This implementation provides a complete, production-ready IPFS/Filecoin integration for your medical records platform with encryption, multi-provider support, and smart contract integration.