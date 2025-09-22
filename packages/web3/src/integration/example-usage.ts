/**
 * Example usage of the MedicalRecordsIPFSIntegration class
 * This shows how to integrate IPFS medical record storage with smart contracts
 */

import { ethers } from 'ethers';
import { MedicalRecordsIPFSIntegration, createEncounterRecord, createLabResultRecord } from './smart-contract-ipfs.js';
import { loadSecurityConfig, logEnvironmentStatus } from '../config/security-config.js';

// Example usage function - requires actual smart contract deployment
export async function demonstrateIPFSIntegration() {
  // Load and validate all security configuration from environment
  logEnvironmentStatus();
  const config = loadSecurityConfig();
  
  // 1. Setup wallet and contract using secure configuration
  const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
  const wallet = new ethers.Wallet(config.blockchain.privateKey, provider);
  const contractAddress = config.blockchain.contractAddress;
  const contractABI = [
    // This matches your MedicalRecords.sol contract
    'function addMedicalRecord(bytes32 recordId, bytes32 patientId, address patientWallet, bytes32 providerId, address providerWallet, uint8 recordType, string recordCID, string title, bool isSensitive, address authorizedUser) external',
    'function records(bytes32) external view returns (bytes32 recordId, bytes32 patientId, address patientWallet, bytes32 providerId, address providerWallet, uint8 recordType, string recordCID, string title, bool isSensitive, uint256 timestamp)',
    'function getPatientRecords(bytes32 patientId) external view returns (bytes32[] memory)'
  ];
  
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  // 2. Initialize IPFS integration with secure Pinata credentials
  const ipfsIntegration = new MedicalRecordsIPFSIntegration({
    pinataApiKey: config.pinata.apiKey,
    pinataSecretApiKey: config.pinata.secretKey,
    pinataJWT: config.pinata.jwt
  }, contract);

  // 3. Create a patient encounter record
  const encounterData = createEncounterRecord(
    'patient-123',
    'provider-456',
    'Routine Checkup',
    'Annual physical examination',
    ['Z00.00 - Encounter for general adult medical examination without abnormal findings']
  );

  try {
    // 4. Store encounter record on IPFS and blockchain
    const encounterResult = await ipfsIntegration.createEncounterRecord(
      'record-encounter-001',
      'patient-123',
      '0x1234567890123456789012345678901234567890', // Patient wallet address
      'provider-456',
      '0x0987654321098765432109876543210987654321', // Provider wallet address
      encounterData,
      [], // No file attachments for this example
      'optional-encryption-key'
    );

    console.log('Encounter Record Created:');
    console.log('- IPFS CID:', encounterResult.metadataCID);
    console.log('- Transaction Hash:', encounterResult.transactionHash);

    // 5. Create a lab result record
    const labData = createLabResultRecord(
      'patient-123',
      'provider-456',
      'Complete Blood Count',
      [
        {
          parameter_name: 'White Blood Cell Count',
          parameter_code: 'WBC',
          value: '7.2',
          unit: 'K/uL',
          reference_range_min: '4.0',
          reference_range_max: '11.0',
          interpretation: 'Normal',
          abnormal_flag: false
        },
        {
          parameter_name: 'Red Blood Cell Count',
          parameter_code: 'RBC',
          value: '4.5',
          unit: 'M/uL',
          reference_range_min: '4.2',
          reference_range_max: '5.4',
          interpretation: 'Normal',
          abnormal_flag: false
        }
      ]
    );

    // 6. Store lab result on IPFS and blockchain
    const labResult = await ipfsIntegration.createLabResultRecord(
      'record-lab-001',
      'patient-123',
      '0x1234567890123456789012345678901234567890',
      'provider-456',
      '0x0987654321098765432109876543210987654321',
      labData,
      undefined, // No PDF report file
      'optional-encryption-key'
    );

    console.log('\nLab Result Record Created:');
    console.log('- IPFS CID:', labResult.metadataCID);
    console.log('- Transaction Hash:', labResult.transactionHash);

    // 7. Retrieve the encounter record
    const retrievedEncounter = await ipfsIntegration.getEncounterRecord(
      'record-encounter-001',
      'optional-encryption-key'
    );

    console.log('\nRetrieved Encounter Record:');
    console.log('- Chief Complaint:', retrievedEncounter.encounterData.chief_complaint);
    console.log('- Reason for Visit:', retrievedEncounter.encounterData.reason_for_visit);
    console.log('- Number of Attachments:', retrievedEncounter.attachments.length);

    // 8. Get all records for a patient
    const patientRecords = await ipfsIntegration.getPatientRecords(
      'patient-123',
      'optional-encryption-key'
    );

    console.log('\nAll Patient Records:');
    console.log('- Encounter Records:', patientRecords.encounterRecords.length);
    console.log('- Lab Results:', patientRecords.labResults.length);
    console.log('- Imaging Reports:', patientRecords.imagingReports.length);
    console.log('- Mental Health Records:', patientRecords.mentalHealthRecords.length);

  } catch (error) {
    console.error('Error in IPFS integration:', error);
  }
}

// Example of uploading files with medical records
export async function demonstrateFileUpload() {
  // This would be called in a browser or Node.js environment with actual files
  console.log('File upload example:');
  console.log('1. Create File objects from user uploads');
  console.log('2. Pass files to createEncounterRecord or createImagingRecord');
  console.log('3. Files are automatically encrypted and stored on IPFS');
  console.log('4. File CIDs are referenced in the medical record data');
  
  /*
  // Browser example:
  const fileInput = document.getElementById('medical-file');
  const file = fileInput.files[0];
  
  await ipfsIntegration.createEncounterRecord(
    recordId,
    patientId,
    patientWallet,
    providerId,
    providerWallet,
    encounterData,
    [file], // Attach the file
    encryptionKey
  );
  */
}

// Simple demo that works without blockchain connection
export async function demonstrateIPFSOnly() {
  console.log('🚀 Testing IPFS Integration (No Blockchain Required)');
  
  try {
    // Validate IPFS configuration
    logEnvironmentStatus();
    // Just test the data structure creation
    const encounterData = createEncounterRecord(
      'patient-123',
      'provider-456',
      'Routine Checkup',
      'Annual physical examination',
      ['Z00.00 - General adult medical examination']
    );

    console.log('✅ Encounter Record Created:');
    console.log('- Record ID:', encounterData.record_id);
    console.log('- Record Type:', encounterData.record_type);
    console.log('- Chief Complaint:', encounterData.chief_complaint);
    console.log('- Reason for Visit:', encounterData.reason_for_visit);
    console.log('- Number of Diagnoses:', encounterData.diagnosis.length);

    const labData = createLabResultRecord(
      'patient-123',
      'provider-456',
      'Complete Blood Count',
      [
        {
          parameter_name: 'White Blood Cell Count',
          parameter_code: 'WBC',
          value: '7.2',
          unit: 'K/uL',
          reference_range_min: '4.0',
          reference_range_max: '11.0',
          interpretation: 'Normal',
          abnormal_flag: false
        }
      ]
    );

    console.log('\n✅ Lab Result Record Created:');
    console.log('- Record ID:', labData.record_id);
    console.log('- Test Name:', labData.test_name);
    console.log('- Number of Results:', labData.results_data.length);
    console.log('- Status:', labData.status);

    console.log('\n🎉 All medical record structures are working correctly!');
    console.log('📋 Ready to integrate with smart contracts when needed.');

  } catch (error) {
    console.error('❌ Error in IPFS demo:', error);
  }
}

// Run the demonstration
if (import.meta.url === `file://${process.argv[1]}`) {
  // Run the simple demo that doesn't require blockchain
  demonstrateIPFSOnly().catch(console.error);
  // demonstrateIPFSIntegration().catch(console.error); // Uncomment when you have contract setup
}