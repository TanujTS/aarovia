/**
 * Comprehensive IPFS Medical Data Examples
 * Demonstrates usage of all medical data structures with IPFS storage
 */

import {
  IPFSClient,
  StorageProvider,
  FileType,
  createPinataClient,
  createPatientProfile,
  createProviderProfile
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

/**
 * Example 1: Complete Patient Profile Creation and Storage
 */
export async function createCompletePatientProfile() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // Create comprehensive patient profile
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
      },
      {
        allergen_name: "Shellfish",
        reaction: "Anaphylaxis",
        severity: "Severe",
        onsetDate: "2008-07-22"
      }
    ],
    current_medications: [
      {
        medication_name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        start_date: "2020-01-15",
        prescribing_doctor_id: "QmProviderCID123" // IPFS CID of prescribing doctor
      },
      {
        medication_name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        start_date: "2021-03-10",
        prescribing_doctor_id: "QmProviderCID123"
      }
    ],
    past_medical_history: [
      {
        condition_name: "Type 2 Diabetes",
        diagnosis_date: "2020-01-15",
        notes: "Well controlled with medication and diet"
      },
      {
        condition_name: "Hypertension",
        diagnosis_date: "2021-03-10",
        notes: "Responding well to ACE inhibitor"
      }
    ],
    family_medical_history: [
      {
        relationship: "Father",
        condition_name: "Coronary Artery Disease",
        notes: "Diagnosed at age 65"
      },
      {
        relationship: "Mother",
        condition_name: "Breast Cancer",
        notes: "Diagnosed at age 58, in remission"
      }
    ],
    lifestyle_factors: {
      smoking_status: "Never smoker",
      alcohol_consumption: "Occasional social drinking",
      exercise_habits: "Walks 30 minutes daily",
      dietary_preferences: "Low carb diet"
    }
  };

  // Upload patient profile (encrypted for privacy)
  const uploadResult = await client.uploadPatientProfile(patientProfile, true);
  
  // Pin for persistence
  await client.pinContent(uploadResult.hash);

  console.log('Patient Profile CID:', uploadResult.hash);
  return uploadResult.hash;
}

/**
 * Example 2: Provider Profile with Institution Association
 */
export async function createProviderWithInstitution() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // First create institution profile
  const hospitalProfile: InstitutionProfile = {
    institution_id: "HOSP001",
    institution_name: "City General Hospital",
    institution_type: "HOSPITAL",
    contact_info: {
      phone_number: "+1-555-HOSP",
      email: "contact@citygeneral.com",
      address: {
        street: "456 Medical Plaza",
        city: "Anytown",
        state_province: "CA",
        zip_code: "90210",
        country: "USA"
      }
    },
    license_number: "HOSP-LIC-123",
    accreditation: [
      {
        accrediting_body: "Joint Commission",
        accreditation_number: "JC-2023-001",
        expiry_date: "2026-12-31"
      }
    ],
    services_offered: [
      "Emergency Medicine",
      "Cardiology",
      "Oncology",
      "Surgery",
      "Radiology"
    ],
    department_info: [
      {
        department_name: "Cardiology",
        department_head_provider_id: "QmCardioChiefCID",
        services: ["Cardiac Catheterization", "Echocardiography", "Stress Testing"]
      }
    ],
    emergency_services_available: true,
    affiliated_networks: ["Regional Health Network", "Academic Medical Center Consortium"]
  };

  // Upload institution profile
  const institutionUpload = await client.uploadInstitutionProfile(hospitalProfile, false);
  await client.pinContent(institutionUpload.hash);

  // Create provider profile with institution association
  const providerProfile: ProviderProfile = {
    name: "Dr. Sarah Johnson",
    contact_info: {
      phone_number: "+1-555-CARDIO",
      email: "s.johnson@citygeneral.com",
      address: {
        street: "456 Medical Plaza, Suite 200",
        city: "Anytown",
        state_province: "CA",
        zip_code: "90210",
        country: "USA"
      }
    },
    specialty: "Interventional Cardiology",
    license_number: "MD-CA-789012",
    NPI_number: "1234567890",
    associated_hospital_id: institutionUpload.hash, // Link to institution IPFS CID
    public_key_for_encryption: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQE..."
  };

  // Upload provider profile
  const providerUpload = await client.uploadProviderProfile(providerProfile, false);
  await client.pinContent(providerUpload.hash);

  return {
    institutionCID: institutionUpload.hash,
    providerCID: providerUpload.hash
  };
}

/**
 * Example 3: Complete Encounter Record with Attachments
 */
export async function createEncounterWithAttachments() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // Upload encounter notes as PDF (simulated)
  const encounterNotesPDF = new File(
    [new Blob(['Encounter notes content...'], { type: 'application/pdf' })],
    'encounter-notes.pdf',
    { type: 'application/pdf' }
  );
  
  const notesUpload = await client.uploadFile(
    encounterNotesPDF,
    FileType.CONSULTATION_NOTES,
    true
  );

  // Create comprehensive encounter record
  const encounterRecord: EncounterRecord = {
    record_id: "ENC-2025-001",
    record_type: "Encounter",
    created_date: "2025-09-22T10:00:00Z",
    last_updated: "2025-09-22T10:00:00Z",
    encounter_id: "ENC-2025-001",
    encounter_date_time: "2025-09-22T10:00:00Z",
    reason_for_visit: "Annual physical examination",
    chief_complaint: "Routine checkup, patient feeling well",
    history_of_present_illness: "Patient reports no new symptoms since last visit. Continues medication compliance.",
    physical_examination_findings: "BP: 130/80, HR: 72, Temp: 98.6°F. Heart sounds normal, lungs clear, no acute distress.",
    diagnosis: [
      {
        diagnosis_code: "Z00.00",
        diagnosis_description: "Encounter for general adult medical examination without abnormal findings",
        is_primary: true
      },
      {
        diagnosis_code: "E11.9",
        diagnosis_description: "Type 2 diabetes mellitus without complications",
        is_primary: false
      }
    ],
    treatments_prescribed: [
      {
        treatment_name: "Continue current diabetes management",
        details: "Maintain current Metformin dosage, continue dietary modifications"
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
    follow_up_instructions: "Return in 6 months for follow-up. Continue current medications. Schedule HbA1c in 3 months.",
    notes: "Patient doing well overall. Good medication compliance. Encouraged to continue lifestyle modifications.",
    attachments: [
      {
        attachment_name: "Encounter Notes",
        file_type: "PDF",
        file_CID: notesUpload.hash,
        upload_date: "2025-09-22T10:00:00Z"
      }
    ]
  };

  // Upload encounter record
  const encounterUpload = await client.uploadEncounterRecord(encounterRecord, true);
  await client.pinContent(encounterUpload.hash);

  return {
    encounterCID: encounterUpload.hash,
    attachmentCIDs: [notesUpload.hash]
  };
}

/**
 * Example 4: Lab Result Record with PDF Report
 */
export async function createLabResultRecord() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // Upload lab report PDF (simulated)
  const labReportPDF = new File(
    [new Blob(['Lab report PDF content...'], { type: 'application/pdf' })],
    'cbc-report.pdf',
    { type: 'application/pdf' }
  );
  
  const reportUpload = await client.uploadFile(
    labReportPDF,
    FileType.LAB_RESULT,
    true
  );

  // Create detailed lab result record
  const labResultRecord: LabResultRecord = {
    record_id: "LAB-2025-001",
    record_type: "LabResult",
    created_date: "2025-09-22T08:00:00Z",
    last_updated: "2025-09-22T08:00:00Z",
    lab_result_id: "LAB-2025-001",
    test_name: "Complete Blood Count (CBC)",
    test_code: "85025",
    collection_date: "2025-09-20T07:30:00Z",
    result_date: "2025-09-21T14:00:00Z",
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
      },
      {
        parameter_name: "Red Blood Cell Count",
        parameter_code: "RBC",
        value: "4.5",
        unit: "M/uL",
        reference_range_min: "4.2",
        reference_range_max: "5.4",
        interpretation: "Normal",
        abnormal_flag: false
      },
      {
        parameter_name: "Hemoglobin",
        parameter_code: "HGB",
        value: "13.8",
        unit: "g/dL",
        reference_range_min: "12.0",
        reference_range_max: "16.0",
        interpretation: "Normal",
        abnormal_flag: false
      },
      {
        parameter_name: "Hematocrit",
        parameter_code: "HCT",
        value: "41.2",
        unit: "%",
        reference_range_min: "36.0",
        reference_range_max: "46.0",
        interpretation: "Normal",
        abnormal_flag: false
      }
    ],
    interpretation_notes: "All values within normal limits. No signs of anemia or infection.",
    status: "Final",
    report_file_CID: reportUpload.hash
  };

  // Upload lab result record
  const labUpload = await client.uploadLabResultRecord(labResultRecord, true);
  await client.pinContent(labUpload.hash);

  return {
    labResultCID: labUpload.hash,
    reportCID: reportUpload.hash
  };
}

/**
 * Example 5: Imaging Report with DICOM Images
 */
export async function createImagingReportWithDICOM() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // Upload DICOM images (simulated)
  const dicomImage1 = new File(
    [new Blob(['DICOM image data...'], { type: 'application/dicom' })],
    'chest-xray-001.dcm',
    { type: 'application/dicom' }
  );

  const dicomImage2 = new File(
    [new Blob(['DICOM image data...'], { type: 'application/dicom' })],
    'chest-xray-002.dcm',
    { type: 'application/dicom' }
  );

  const image1Upload = await client.uploadFile(dicomImage1, FileType.DICOM_IMAGE, true);
  const image2Upload = await client.uploadFile(dicomImage2, FileType.DICOM_IMAGE, true);

  // Upload radiologist report PDF
  const radiologyReportPDF = new File(
    [new Blob(['Radiology report content...'], { type: 'application/pdf' })],
    'chest-xray-report.pdf',
    { type: 'application/pdf' }
  );

  const reportUpload = await client.uploadFile(radiologyReportPDF, FileType.DOCUMENT_PDF, true);

  // Create imaging report record
  const imagingRecord: ImagingReportRecord = {
    record_id: "IMG-2025-001",
    record_type: "ImagingReport",
    created_date: "2025-09-22T09:00:00Z",
    last_updated: "2025-09-22T09:00:00Z",
    imaging_report_id: "IMG-2025-001",
    modality: "X-Ray",
    body_part: "Chest",
    exam_name: "Chest X-Ray, 2 Views",
    exam_code: "71020",
    exam_date: "2025-09-21T10:00:00Z",
    report_date: "2025-09-21T15:30:00Z",
    radiologist_id: "QmRadiologistCID",
    findings: "The lungs are clear bilaterally. No evidence of consolidation, pleural effusion, or pneumothorax. Cardiac silhouette is normal in size and configuration. Mediastinal contours are unremarkable.",
    impression: "Normal chest X-ray.",
    recommendations: "No further imaging needed at this time. Clinical correlation recommended.",
    report_file_CID: reportUpload.hash,
    image_CIDs: [
      {
        image_name: "Chest X-Ray PA View",
        file_type: "DICOM",
        image_CID: image1Upload.hash
      },
      {
        image_name: "Chest X-Ray Lateral View",
        file_type: "DICOM",
        image_CID: image2Upload.hash
      }
    ]
  };

  // Upload imaging record
  const imagingUpload = await client.uploadImagingReportRecord(imagingRecord, true);
  await client.pinContent(imagingUpload.hash);

  return {
    imagingReportCID: imagingUpload.hash,
    reportPDFCID: reportUpload.hash,
    imageCIDs: [image1Upload.hash, image2Upload.hash]
  };
}

/**
 * Example 6: Mental Health Record (Highly Sensitive)
 */
export async function createMentalHealthRecord() {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  const mentalHealthRecord: MentalHealthRecord = {
    record_id: "MH-2025-001",
    record_type: "MentalHealth",
    created_date: "2025-09-22T14:00:00Z",
    last_updated: "2025-09-22T14:00:00Z",
    session_id: "MH-SESSION-001",
    session_date: "2025-09-22T14:00:00Z",
    session_type: "Individual Therapy",
    therapist_provider_id: "QmTherapistCID",
    presenting_concerns: "Patient reports increased anxiety related to work stress and relationship difficulties.",
    mental_status_exam: {
      appearance: "Well-groomed, appropriate dress",
      behavior: "Cooperative, good eye contact",
      speech: "Normal rate and volume",
      mood: "Anxious",
      affect: "Congruent with stated mood",
      thought_process: "Linear and goal-directed",
      thought_content: "No delusions or obsessions reported",
      perception: "No hallucinations reported",
      cognition: "Intact orientation, memory, and concentration",
      insight: "Good insight into current stressors",
      judgment: "Intact"
    },
    assessment: "Adjustment disorder with anxiety. Patient demonstrating good coping skills but would benefit from stress management techniques.",
    treatment_plan: "Continue weekly individual therapy sessions. Introduce cognitive-behavioral techniques for anxiety management.",
    goals: [
      "Reduce anxiety symptoms",
      "Develop effective coping strategies",
      "Improve work-life balance"
    ],
    interventions: [
      "Cognitive restructuring",
      "Progressive muscle relaxation",
      "Mindfulness techniques"
    ],
    homework_assignments: [
      "Practice daily mindfulness meditation for 10 minutes",
      "Complete thought record worksheet when experiencing anxiety"
    ],
    next_session_date: "2025-09-29T14:00:00Z",
    risk_assessment: {
      suicide_risk: "Low - no suicidal ideation reported",
      homicide_risk: "None",
      self_harm_risk: "Low"
    },
    confidential_notes: "Patient discussed sensitive family dynamics. Maintain strict confidentiality."
  };

  // Mental health records require maximum encryption
  const mentalHealthUpload = await client.uploadMentalHealthRecord(mentalHealthRecord, true);
  await client.pinContent(mentalHealthUpload.hash);

  return mentalHealthUpload.hash;
}

/**
 * Example 7: Complete Medical Record Retrieval
 */
export async function retrieveCompletePatientData(
  patientProfileCID: string,
  encounterCID: string,
  labResultCID: string,
  encryptionKey: string
) {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  // Retrieve patient profile
  const patientProfile = await client.downloadJSON<PatientProfile>(
    patientProfileCID,
    true,
    encryptionKey
  );

  // Retrieve encounter record
  const encounterRecord = await client.downloadJSON<EncounterRecord>(
    encounterCID,
    true,
    encryptionKey
  );

  // Retrieve lab results
  const labResults = await client.downloadJSON<LabResultRecord>(
    labResultCID,
    true,
    encryptionKey
  );

  // Download attachments from encounter
  const attachments: { [key: string]: Blob } = {};
  if (encounterRecord.attachments) {
    for (const attachment of encounterRecord.attachments) {
      const blob = await client.downloadFile(
        attachment.file_CID,
        true,
        encryptionKey
      );
      attachments[attachment.attachment_name] = blob;
    }
  }

  return {
    patientProfile,
    encounterRecord,
    labResults,
    attachments
  };
}

/**
 * Example 8: Batch Upload of Raw Medical Files
 */
export async function batchUploadMedicalFiles(
  files: File[],
  patientId: string,
  providerCID: string
) {
  const client = createPinataClient(
    process.env.PINATA_API_KEY!,
    process.env.PINATA_SECRET_KEY!
  );

  const uploadResults = [];

  for (const file of files) {
    // Determine file category based on name/type
    let category: RawMedicalFile['file_category'] = 'OTHER';
    if (file.name.toLowerCase().includes('xray') || file.name.toLowerCase().includes('x-ray')) {
      category = 'X_RAY';
    } else if (file.type === 'application/pdf' && file.name.toLowerCase().includes('lab')) {
      category = 'LAB_REPORT';
    } else if (file.type === 'application/pdf') {
      category = 'SCANNED_DOCUMENT';
    } else if (file.type.startsWith('image/')) {
      category = 'MEDICAL_IMAGE';
    }

    // Create metadata
    const metadata: RawMedicalFile = {
      file_name: file.name,
      file_type: file.name.split('.').pop()?.toUpperCase() as any || 'UNKNOWN',
      file_category: category,
      file_size: file.size,
      upload_date: new Date().toISOString(),
      uploaded_by_provider_id: providerCID,
      patient_id: patientId,
      encryption_used: true,
      mime_type: file.type
    };

    // Upload file with metadata
    const result = await client.uploadRawMedicalFile(file, metadata, true);
    uploadResults.push(result);

    // Pin both file and metadata
    await client.pinContent(result.fileCID);
    await client.pinContent(result.metadataCID);
  }

  return uploadResults;
}