/**
 * Example: Medical Records IPFS Integration Usage
 * This shows how to integrate IPFS with your existing medical records app
 */

import { createPinataClient } from './src/ipfs.js';
import { PatientProfile, ProviderProfile, EncounterRecord } from './src/types/medical-data-types.js';

// Initialize IPFS client with your Pinata credentials
const ipfsClient = createPinataClient(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_KEY!
);

/**
 * Example 1: Patient Registration with IPFS Storage
 */
export async function registerPatientWithIPFS(patientData: PatientProfile) {
  try {
    console.log('📋 Registering patient with IPFS storage...');

    // 1. Upload patient profile to IPFS (encrypted)
    const ipfsResult = await ipfsClient.uploadPatientProfile(patientData, true);
    console.log(`✅ Patient profile uploaded to IPFS: ${ipfsResult.hash}`);

    // 2. Pin the content for persistence
    await ipfsClient.pinContent(ipfsResult.hash);
    console.log('📌 Content pinned for persistence');

    // 3. Here you would store the CID in your smart contract
    // await medicalRecordsContract.storePatientProfile(patientId, ipfsResult.hash);
    
    return {
      success: true,
      patientCID: ipfsResult.hash,
      ipfsUrl: ipfsResult.url,
      encrypted: ipfsResult.encrypted
    };

  } catch (error) {
    console.error('❌ Patient registration failed:', error);
    throw error;
  }
}

/**
 * Example 2: Provider Registration with IPFS Storage
 */
export async function registerProviderWithIPFS(providerData: ProviderProfile) {
  try {
    console.log('👨‍⚕️ Registering provider with IPFS storage...');

    // Provider profiles are typically not encrypted (public information)
    const ipfsResult = await ipfsClient.uploadProviderProfile(providerData, false);
    console.log(`✅ Provider profile uploaded to IPFS: ${ipfsResult.hash}`);

    await ipfsClient.pinContent(ipfsResult.hash);
    
    return {
      success: true,
      providerCID: ipfsResult.hash,
      ipfsUrl: ipfsResult.url
    };

  } catch (error) {
    console.error('❌ Provider registration failed:', error);
    throw error;
  }
}

/**
 * Example 3: Medical Record Creation with IPFS Storage
 */
export async function createMedicalRecordWithIPFS(
  encounterData: EncounterRecord,
  attachments: File[] = []
) {
  try {
    console.log('📝 Creating medical record with IPFS storage...');

    // 1. Upload any file attachments first
    const attachmentCIDs = [];
    for (const file of attachments) {
      const fileResult = await ipfsClient.uploadFile(
        file,
        'MEDICAL_IMAGE' as any, // Determine type based on file
        true // Encrypt medical files
      );
      attachmentCIDs.push({
        attachment_name: file.name,
        file_type: file.type,
        file_CID: fileResult.hash,
        upload_date: new Date().toISOString()
      });
      await ipfsClient.pinContent(fileResult.hash);
    }

    // 2. Add attachments to encounter record
    const completeRecord: EncounterRecord = {
      ...encounterData,
      attachments: attachmentCIDs
    };

    // 3. Upload the complete encounter record (encrypted)
    const recordResult = await ipfsClient.uploadEncounterRecord(completeRecord, true);
    console.log(`✅ Medical record uploaded to IPFS: ${recordResult.hash}`);

    await ipfsClient.pinContent(recordResult.hash);

    return {
      success: true,
      recordCID: recordResult.hash,
      attachmentCIDs: attachmentCIDs.map(a => a.file_CID),
      ipfsUrl: recordResult.url
    };

  } catch (error) {
    console.error('❌ Medical record creation failed:', error);
    throw error;
  }
}

/**
 * Example 4: Retrieve Patient Data from IPFS
 */
export async function getPatientDataFromIPFS(
  patientCID: string, 
  encryptionKey: string
) {
  try {
    console.log(`📥 Retrieving patient data from IPFS: ${patientCID}`);

    // Download and decrypt patient profile
    const patientData = await ipfsClient.downloadJSON<PatientProfile>(
      patientCID,
      true, // encrypted
      encryptionKey
    );

    console.log(`✅ Retrieved patient: ${patientData.first_name} ${patientData.last_name}`);
    return patientData;

  } catch (error) {
    console.error('❌ Failed to retrieve patient data:', error);
    throw error;
  }
}

/**
 * Example 5: Integration with Your API Routes
 */
export class MedicalRecordsIPFSService {
  private ipfsClient = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  async uploadPatientProfile(profile: PatientProfile): Promise<string> {
    const result = await this.ipfsClient.uploadPatientProfile(profile, true);
    await this.ipfsClient.pinContent(result.hash);
    return result.hash;
  }

  async uploadProviderProfile(profile: ProviderProfile): Promise<string> {
    const result = await this.ipfsClient.uploadProviderProfile(profile, false);
    await this.ipfsClient.pinContent(result.hash);
    return result.hash;
  }

  async uploadMedicalRecord(record: EncounterRecord): Promise<string> {
    const result = await this.ipfsClient.uploadEncounterRecord(record, true);
    await this.ipfsClient.pinContent(result.hash);
    return result.hash;
  }

  async downloadPatientProfile(cid: string, encryptionKey: string): Promise<PatientProfile> {
    return this.ipfsClient.downloadJSON<PatientProfile>(cid, true, encryptionKey);
  }

  async downloadProviderProfile(cid: string): Promise<ProviderProfile> {
    return this.ipfsClient.downloadJSON<ProviderProfile>(cid, false);
  }

  async downloadMedicalRecord(cid: string, encryptionKey: string): Promise<EncounterRecord> {
    return this.ipfsClient.downloadJSON<EncounterRecord>(cid, true, encryptionKey);
  }
}

/**
 * Example 6: Next.js API Route Integration
 */
export function createPatientAPIHandler() {
  const ipfsService = new MedicalRecordsIPFSService();

  return async function handler(req: any, res: any) {
    if (req.method === 'POST') {
      try {
        const { patientData } = req.body;

        // Upload to IPFS
        const cid = await ipfsService.uploadPatientProfile(patientData);

        // Store CID in database/smart contract
        // await database.patients.create({ id: patientId, ipfsCID: cid });
        // await smartContract.storePatientProfile(patientId, cid);

        res.status(200).json({
          success: true,
          message: 'Patient profile uploaded to IPFS',
          ipfsCID: cid,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`
        });

      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to upload patient profile'
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  };
}

// Export the service for use in other parts of your app
export default MedicalRecordsIPFSService;