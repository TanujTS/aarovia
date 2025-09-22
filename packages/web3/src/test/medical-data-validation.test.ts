/**
 * Simple Test Suite for Medical IPFS Implementation
 * Basic tests for core functionality
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { IPFSClient, createPinataClient, FileType } from '../ipfs.js';
import {
  PatientProfile,
  ProviderProfile,
  EncounterRecord,
  LabResultRecord,
  ImagingReportRecord,
  MentalHealthRecord,
  RawMedicalFile,
  InstitutionProfile
} from '../types/medical-data-types.js';

describe('Medical IPFS Basic Tests', () => {
  let client: IPFSClient;

  beforeAll(async () => {
    client = createPinataClient(
      process.env.PINATA_API_KEY || 'test-key',
      process.env.PINATA_SECRET_KEY || 'test-secret'
    );
  });

  describe('Data Structure Validation', () => {
    test('should validate complete patient profile structure', () => {
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

      // Test required fields are present
      expect(patientProfile.first_name).toBeDefined();
      expect(patientProfile.last_name).toBeDefined();
      expect(patientProfile.date_of_birth).toBeDefined();
      expect(patientProfile.contact_info).toBeDefined();
      expect(patientProfile.emergency_contact).toBeDefined();
      expect(patientProfile.insurance_information).toBeDefined();
      expect(patientProfile.allergies).toHaveLength(1);
      expect(patientProfile.current_medications).toHaveLength(1);
      expect(patientProfile.past_medical_history).toHaveLength(1);
      expect(patientProfile.family_medical_history).toHaveLength(1);
    });

    test('should validate provider profile structure', () => {
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

      expect(providerProfile.name).toBeDefined();
      expect(providerProfile.specialty).toBeDefined();
      expect(providerProfile.license_number).toBeDefined();
      expect(providerProfile.NPI_number).toBeDefined();
    });

    test('should validate encounter record structure', () => {
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
        medications_prescribed_at_encounter: [
          {
            medication_name: "Vitamin D",
            dosage: "1000 IU",
            frequency: "Daily",
            start_date: "2025-09-22",
            end_date: "2026-09-22"
          }
        ],
        procedures_performed: [
          {
            procedure_code: "99213",
            procedure_description: "Office visit",
            procedure_date: "2025-09-22",
            notes: "Routine checkup"
          }
        ],
        referrals: [
          {
            referred_to_provider_id: "test-specialist",
            reason: "Routine follow-up",
            referral_date: "2025-09-22"
          }
        ],
        follow_up_instructions: "Return in 1 year",
        notes: "Patient in good health"
      };

      expect(encounterRecord.encounter_id).toBeDefined();
      expect(encounterRecord.diagnosis).toHaveLength(1);
      expect(encounterRecord.medications_prescribed_at_encounter).toHaveLength(1);
      expect(encounterRecord.procedures_performed).toHaveLength(1);
      expect(encounterRecord.referrals).toHaveLength(1);
    });

    test('should validate lab result record structure', () => {
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
        status: "Final",
        report_file_CID: "QmTestReportCID123"
      };

      expect(labResultRecord.test_name).toBeDefined();
      expect(labResultRecord.results_data).toHaveLength(1);
      expect(labResultRecord.report_file_CID).toBeDefined();
    });

    test('should validate imaging report record structure', () => {
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
        recommendations: "No follow-up needed",
        report_file_CID: "QmTestImageReportCID",
        image_CIDs: [
          {
            image_name: "Chest X-Ray PA",
            file_type: "DICOM",
            image_CID: "QmTestImageCID1"
          }
        ]
      };

      expect(imagingRecord.modality).toBeDefined();
      expect(imagingRecord.body_part).toBeDefined();
      expect(imagingRecord.report_file_CID).toBeDefined();
      expect(imagingRecord.image_CIDs).toHaveLength(1);
    });

    test('should validate mental health record structure', () => {
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
        },
        confidential_notes: "Confidential therapy notes"
      };

      expect(mentalHealthRecord.session_type).toBeDefined();
      expect(mentalHealthRecord.mental_status_exam).toBeDefined();
      expect(mentalHealthRecord.risk_assessment).toBeDefined();
      expect(mentalHealthRecord.confidential_notes).toBeDefined();
    });

    test('should validate raw medical file structure', () => {
      const rawMedicalFile: RawMedicalFile = {
        file_name: "test-document.pdf",
        file_type: "PDF",
        file_category: "SCANNED_DOCUMENT",
        file_size: 1024,
        upload_date: new Date().toISOString(),
        uploaded_by_provider_id: "test-provider-cid",
        patient_id: "test-patient-id",
        encryption_used: true,
        mime_type: "application/pdf"
      };

      expect(rawMedicalFile.file_name).toBeDefined();
      expect(rawMedicalFile.file_category).toBeDefined();
      expect(rawMedicalFile.uploaded_by_provider_id).toBeDefined();
      expect(rawMedicalFile.patient_id).toBeDefined();
    });

    test('should validate institution profile structure', () => {
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
        emergency_services_available: true,
        affiliated_networks: ["Test Network", "Academic Consortium"]
      };

      expect(institutionProfile.institution_name).toBeDefined();
      expect(institutionProfile.services_offered).toHaveLength(3);
      expect(institutionProfile.affiliated_networks).toHaveLength(2);
    });
  });

  describe('File Type Validation', () => {
    test('should validate all FileType enum values', () => {
      const expectedFileTypes = [
        'PATIENT_PROFILE',
        'PROVIDER_PROFILE',
        'INSTITUTION_PROFILE',
        'ENCOUNTER_RECORD',
        'LAB_RESULT',
        'IMAGING_REPORT',
        'PRESCRIPTION',
        'MENTAL_HEALTH_RECORD',
        'SURGERY_RECORD',
        'GENETIC_TEST_RECORD',
        'MEDICAL_IMAGE',
        'DICOM_IMAGE',
        'DOCUMENT_PDF',
        'CONSULTATION_NOTES',
        'DISCHARGE_SUMMARY',
        'TREATMENT_PLAN',
        'INSURANCE_DOCUMENT',
        'CONSENT_FORM',
        'RAW_MEDICAL_FILE'
      ];

      // This would check that all expected file types exist in the enum
      expectedFileTypes.forEach(fileType => {
        expect(FileType[fileType as keyof typeof FileType]).toBeDefined();
      });
    });
  });

  describe('API Method Signatures', () => {
    test('should have correct upload method signatures', () => {
      // Test that methods exist and can be called (without actually calling them)
      expect(typeof client.uploadPatientProfile).toBe('function');
      expect(typeof client.uploadProviderProfile).toBe('function');
      expect(typeof client.uploadEncounterRecord).toBe('function');
      expect(typeof client.uploadLabResultRecord).toBe('function');
      expect(typeof client.uploadImagingReportRecord).toBe('function');
      expect(typeof client.uploadMentalHealthRecord).toBe('function');
      expect(typeof client.uploadRawMedicalFile).toBe('function');
      expect(typeof client.uploadInstitutionProfile).toBe('function');
    });

    test('should have correct download method signatures', () => {
      expect(typeof client.downloadJSON).toBe('function');
      expect(typeof client.downloadFile).toBe('function');
    });

    test('should have utility methods', () => {
      expect(typeof client.pinContent).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate client configuration', () => {
      expect(client).toBeDefined();
    });
  });
});