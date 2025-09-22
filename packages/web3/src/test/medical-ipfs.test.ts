/**
 * Comprehensive Test Suite for Medical IPFS Implementation
 * Tests all medical data structures and IPFS functionality
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import {
  IPFSClient,
  createPinataClient
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

import {
  createCompletePatientProfile,
  createProviderWithInstitution,
  createEncounterWithAttachments,
  createLabResultRecord,
  createImagingReportWithDICOM,
  createMentalHealthRecord,
  retrieveCompletePatientData,
  batchUploadMedicalFiles
} from '../examples/complete-medical-examples.js';

describe('Medical IPFS Implementation Tests', () => {
  let client: IPFSClient;
  let testEncryptionKey: string;

  beforeAll(async () => {
    // Use local IPFS for testing if available, otherwise Pinata
    if (process.env.IPFS_HOST) {
      client = createLocalClient();
    } else {
      client = createPinataClient(
        process.env.PINATA_API_KEY!,
        process.env.PINATA_SECRET_KEY!
      );
    }
    
    testEncryptionKey = 'test-encryption-key-32-chars-long';
  });

  describe('Patient Profile Management', () => {
    test('should create and upload comprehensive patient profile', async () => {
      const patientProfile: PatientProfile = {
        first_name: "John",
        last_name: "Doe",
        date_of_birth: "1985-06-15",
        gender: "Male",
        blood_type: "A+",
        contact_info: {
          phone_number: "+1-555-0123",
          email: "john.doe@test.com",
          address: {
            street: "123 Test St",
            city: "Test City",
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
          provider_name: "Test Insurance",
          policy_number: "TEST123456",
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
            prescribing_doctor_id: "test-doctor-cid"
          }
        ],
        past_medical_history: [
          {
            condition_name: "Type 2 Diabetes",
            diagnosis_date: "2020-01-15",
            notes: "Well controlled"
          }
        ],
        family_medical_history: [
          {
            relationship: "Father",
            condition_name: "Heart Disease",
            notes: "Diagnosed at 65"
          }
        ],
        lifestyle_factors: {
          smoking_status: "Never smoker",
          alcohol_consumption: "Occasional",
          exercise_habits: "Regular walking",
          dietary_preferences: "Low carb"
        }
      };

      const result = await client.uploadPatientProfile(patientProfile, true, testEncryptionKey);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);
      expect(result.metadata.encrypted).toBe(true);

      // Test retrieval
      const retrieved = await client.downloadJSON<PatientProfile>(
        result.hash,
        true,
        testEncryptionKey
      );
      expect(retrieved.first_name).toBe(patientProfile.first_name);
      expect(retrieved.allergies).toHaveLength(1);
      expect(retrieved.current_medications).toHaveLength(1);
    }, 30000);

    test('should validate patient profile structure', () => {
      const patientProfile: PatientProfile = {
        first_name: "Test",
        last_name: "Patient",
        date_of_birth: "1990-01-01",
        gender: "Female",
        blood_type: "O+",
        contact_info: {
          phone_number: "+1-555-TEST",
          email: "test@example.com",
          address: {
            street: "123 Test",
            city: "Test",
            state_province: "CA",
            zip_code: "12345",
            country: "USA"
          }
        },
        emergency_contact: {
          name: "Emergency Contact",
          relationship: "Friend",
          phone_number: "+1-555-EMRG"
        }
      };

      // Test required fields are present
      expect(patientProfile.first_name).toBeDefined();
      expect(patientProfile.last_name).toBeDefined();
      expect(patientProfile.date_of_birth).toBeDefined();
      expect(patientProfile.contact_info).toBeDefined();
      expect(patientProfile.emergency_contact).toBeDefined();
    });
  });

  describe('Provider Profile Management', () => {
    test('should create and upload provider profile', async () => {
      const providerProfile: ProviderProfile = {
        name: "Dr. Test Provider",
        contact_info: {
          phone_number: "+1-555-DOCTOR",
          email: "doctor@test.com",
          address: {
            street: "456 Medical Plaza",
            city: "Test City",
            state_province: "CA",
            zip_code: "90210",
            country: "USA"
          }
        },
        specialty: "Internal Medicine",
        license_number: "MD-TEST-123",
        NPI_number: "1234567890",
        public_key_for_encryption: "test-public-key"
      };

      const result = await client.uploadProviderProfile(providerProfile, false);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Test retrieval
      const retrieved = await client.downloadJSON<ProviderProfile>(result.hash, false);
      expect(retrieved.name).toBe(providerProfile.name);
      expect(retrieved.specialty).toBe(providerProfile.specialty);
    }, 30000);
  });

  describe('Encounter Record Management', () => {
    test('should create and upload encounter record', async () => {
      const encounterRecord: EncounterRecord = {
        record_id: "ENC-TEST-001",
        record_type: "Encounter",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        encounter_id: "ENC-TEST-001",
        encounter_date_time: new Date().toISOString(),
        reason_for_visit: "Annual checkup",
        chief_complaint: "Routine examination",
        history_of_present_illness: "Patient feeling well",
        physical_examination_findings: "Normal examination",
        diagnosis: [
          {
            diagnosis_code: "Z00.00",
            diagnosis_description: "General examination",
            is_primary: true
          }
        ],
        treatments_prescribed: [
          {
            treatment_name: "Continue current regimen",
            details: "No changes needed"
          }
        ],
        follow_up_instructions: "Return in 1 year",
        notes: "Patient in good health"
      };

      const result = await client.uploadEncounterRecord(encounterRecord, true, testEncryptionKey);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Test retrieval
      const retrieved = await client.downloadJSON<EncounterRecord>(
        result.hash,
        true,
        testEncryptionKey
      );
      expect(retrieved.encounter_id).toBe(encounterRecord.encounter_id);
      expect(retrieved.diagnosis).toHaveLength(1);
    }, 30000);
  });

  describe('Lab Result Management', () => {
    test('should create and upload lab result record', async () => {
      const labResultRecord: LabResultRecord = {
        record_id: "LAB-TEST-001",
        record_type: "LabResult",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        lab_result_id: "LAB-TEST-001",
        test_name: "Complete Blood Count",
        test_code: "85025",
        collection_date: new Date().toISOString(),
        result_date: new Date().toISOString(),
        results_data: [
          {
            parameter_name: "White Blood Cell Count",
            parameter_code: "WBC",
            value: "7.2",
            unit: "K/uL",
            reference_range_min: "4.0",
            reference_range_max: "11.0",
            interpretation: "Normal",
            abnormal_flag: false
          }
        ],
        interpretation_notes: "All values normal",
        status: "Final"
      };

      const result = await client.uploadLabResultRecord(labResultRecord, true, testEncryptionKey);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Test retrieval
      const retrieved = await client.downloadJSON<LabResultRecord>(
        result.hash,
        true,
        testEncryptionKey
      );
      expect(retrieved.test_name).toBe(labResultRecord.test_name);
      expect(retrieved.results_data).toHaveLength(1);
    }, 30000);
  });

  describe('Imaging Report Management', () => {
    test('should create and upload imaging report', async () => {
      const imagingRecord: ImagingReportRecord = {
        record_id: "IMG-TEST-001",
        record_type: "ImagingReport",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        imaging_report_id: "IMG-TEST-001",
        modality: "X-Ray",
        body_part: "Chest",
        exam_name: "Chest X-Ray",
        exam_code: "71020",
        exam_date: new Date().toISOString(),
        report_date: new Date().toISOString(),
        radiologist_id: "test-radiologist",
        findings: "Normal chest X-ray",
        impression: "No abnormalities detected",
        recommendations: "No follow-up needed"
      };

      const result = await client.uploadImagingReportRecord(imagingRecord, true, testEncryptionKey);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Test retrieval
      const retrieved = await client.downloadJSON<ImagingReportRecord>(
        result.hash,
        true,
        testEncryptionKey
      );
      expect(retrieved.modality).toBe(imagingRecord.modality);
      expect(retrieved.body_part).toBe(imagingRecord.body_part);
    }, 30000);
  });

  describe('Mental Health Record Management', () => {
    test('should create and upload mental health record with encryption', async () => {
      const mentalHealthRecord: MentalHealthRecord = {
        record_id: "MH-TEST-001",
        record_type: "MentalHealth",
        created_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        session_id: "MH-SESSION-001",
        session_date: new Date().toISOString(),
        session_type: "Individual Therapy",
        therapist_provider_id: "test-therapist",
        presenting_concerns: "Test anxiety concerns",
        mental_status_exam: {
          appearance: "Well-groomed",
          behavior: "Cooperative",
          speech: "Normal",
          mood: "Anxious",
          affect: "Congruent",
          thought_process: "Linear",
          thought_content: "No delusions",
          perception: "No hallucinations",
          cognition: "Intact",
          insight: "Good",
          judgment: "Intact"
        },
        assessment: "Mild anxiety disorder",
        treatment_plan: "Continue therapy",
        goals: ["Reduce anxiety"],
        interventions: ["CBT techniques"],
        risk_assessment: {
          suicide_risk: "Low",
          homicide_risk: "None",
          self_harm_risk: "Low"
        }
      };

      const result = await client.uploadMentalHealthRecord(mentalHealthRecord, true, testEncryptionKey);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);
      expect(result.metadata.encrypted).toBe(true);

      // Test retrieval
      const retrieved = await client.downloadJSON<MentalHealthRecord>(
        result.hash,
        true,
        testEncryptionKey
      );
      expect(retrieved.session_type).toBe(mentalHealthRecord.session_type);
      expect(retrieved.risk_assessment.suicide_risk).toBe("Low");
    }, 30000);
  });

  describe('File Upload and Management', () => {
    test('should upload and download various file types', async () => {
      // Create test files
      const pdfFile = new File(
        [new Blob(['Test PDF content'], { type: 'application/pdf' })],
        'test-report.pdf',
        { type: 'application/pdf' }
      );

      const imageFile = new File(
        [new Blob(['Test image data'], { type: 'image/jpeg' })],
        'test-xray.jpg',
        { type: 'image/jpeg' }
      );

      // Upload PDF
      const pdfResult = await client.uploadFile(
        pdfFile,
        'DOCUMENT_PDF' as any,
        true,
        testEncryptionKey
      );
      expect(pdfResult.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Upload image
      const imageResult = await client.uploadFile(
        imageFile,
        'MEDICAL_IMAGE' as any,
        true,
        testEncryptionKey
      );
      expect(imageResult.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Download and verify
      const downloadedPDF = await client.downloadFile(
        pdfResult.hash,
        true,
        testEncryptionKey
      );
      expect(downloadedPDF.size).toBeGreaterThan(0);

      const downloadedImage = await client.downloadFile(
        imageResult.hash,
        true,
        testEncryptionKey
      );
      expect(downloadedImage.size).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Raw Medical File Management', () => {
    test('should upload raw medical file with metadata', async () => {
      const testFile = new File(
        [new Blob(['Test medical document content'], { type: 'application/pdf' })],
        'medical-document.pdf',
        { type: 'application/pdf' }
      );

      const metadata: RawMedicalFile = {
        file_name: testFile.name,
        file_type: 'PDF',
        file_category: 'SCANNED_DOCUMENT',
        file_size: testFile.size,
        upload_date: new Date().toISOString(),
        uploaded_by_provider_id: 'test-provider-cid',
        patient_id: 'test-patient-id',
        encryption_used: true,
        mime_type: testFile.type
      };

      const result = await client.uploadRawMedicalFile(testFile, metadata, true, testEncryptionKey);
      expect(result.fileCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);
      expect(result.metadataCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Verify metadata retrieval
      const retrievedMetadata = await client.downloadJSON<RawMedicalFile>(
        result.metadataCID,
        false
      );
      expect(retrievedMetadata.file_name).toBe(metadata.file_name);
      expect(retrievedMetadata.file_category).toBe(metadata.file_category);
    }, 30000);
  });

  describe('Institution Profile Management', () => {
    test('should create and upload institution profile', async () => {
      const institutionProfile: InstitutionProfile = {
        institution_id: "TEST-HOSP-001",
        institution_name: "Test General Hospital",
        institution_type: "HOSPITAL",
        contact_info: {
          phone_number: "+1-555-HOSPITAL",
          email: "info@testhosp.com",
          address: {
            street: "123 Hospital Ave",
            city: "Test City",
            state_province: "CA",
            zip_code: "90210",
            country: "USA"
          }
        },
        license_number: "HOSP-LIC-TEST",
        accreditation: [
          {
            accrediting_body: "Test Commission",
            accreditation_number: "TC-2023-001",
            expiry_date: "2026-12-31"
          }
        ],
        services_offered: ["Emergency", "Surgery", "Radiology"],
        emergency_services_available: true
      };

      const result = await client.uploadInstitutionProfile(institutionProfile, false);
      expect(result.hash).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Test retrieval
      const retrieved = await client.downloadJSON<InstitutionProfile>(result.hash, false);
      expect(retrieved.institution_name).toBe(institutionProfile.institution_name);
      expect(retrieved.services_offered).toHaveLength(3);
    }, 30000);
  });

  describe('Comprehensive Integration Tests', () => {
    test('should handle complete patient workflow', async () => {
      // This would test the complete workflow from patient registration
      // through encounter recording and file attachment
      
      // Create patient profile
      const patientCID = await createCompletePatientProfile();
      expect(patientCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Create provider with institution
      const { providerCID, institutionCID } = await createProviderWithInstitution();
      expect(providerCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);
      expect(institutionCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      // Create encounter with attachments
      const { encounterCID } = await createEncounterWithAttachments();
      expect(encounterCID).toMatch(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/);

      console.log('Integration test completed successfully');
      console.log(`Patient CID: ${patientCID}`);
      console.log(`Provider CID: ${providerCID}`);
      console.log(`Institution CID: ${institutionCID}`);
      console.log(`Encounter CID: ${encounterCID}`);
    }, 60000);
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid CID gracefully', async () => {
      await expect(
        client.downloadJSON('invalid-cid', false)
      ).rejects.toThrow();
    });

    test('should handle decryption with wrong key', async () => {
      const testData = { test: 'data' };
      const result = await client.uploadJSON(testData, true, testEncryptionKey);
      
      await expect(
        client.downloadJSON(result.hash, true, 'wrong-key')
      ).rejects.toThrow();
    });

    test('should validate file size limits', async () => {
      // Create a large file (assuming 100MB limit)
      const largeFile = new File(
        [new ArrayBuffer(101 * 1024 * 1024)], // 101MB
        'large-file.bin'
      );

      await expect(
        client.uploadFile(largeFile, 'DOCUMENT_PDF' as any, false)
      ).rejects.toThrow(/File size exceeds maximum/);
    });
  });
});

// Export test utilities for other test files
export {
  createCompletePatientProfile,
  createProviderWithInstitution,
  createEncounterWithAttachments,
  createLabResultRecord,
  createImagingReportWithDICOM,
  createMentalHealthRecord
};