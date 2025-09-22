/**
 * Comprehensive Medical Data Structures for IPFS Storage
 * Exactly matching the specified format for off-chain data
 */

//contains compoonents like patient profile, provider profile, medical records etc
// Base types
export interface Address {
  street: string;
  city: string;
  state_province: string;
  zip_code: string;
  country: string;
}

export interface ContactInfo {
  phone_number: string;
  email: string;
  address: Address;
}

// 1. Patient Profile Details (JSON)
export interface PatientProfile {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO 8601 format
  gender: string;
  blood_type: string;
  contact_info: ContactInfo;
  emergency_contact: {
    name: string;
    relationship: string;
    phone_number: string;
  };
  insurance_information: {
    provider_name: string;
    policy_number: string;
    group_number: string;
  };
  allergies: Array<{
    allergen_name: string;
    reaction: string;
    severity: string;
    onsetDate: string;
  }>;
  current_medications: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    prescribing_doctor_id: string; // IPFS CID
  }>;
  past_medical_history: Array<{
    condition_name: string;
    diagnosis_date: string;
    resolution_date?: string;
    notes: string;
  }>;
  family_medical_history: Array<{
    relationship: string;
    condition_name: string;
    notes: string;
  }>;
  lifestyle_factors: {
    smoking_status: string;
    alcohol_consumption: string;
    exercise_habits: string;
    dietary_preferences: string;
  };
}

// 2. Provider Profile Details (JSON)
export interface ProviderProfile {
  name: string;
  contact_info: ContactInfo;
  specialty: string;
  license_number: string;
  NPI_number: string;
  associated_clinic_id?: string; // IPFS CID or specific ID
  associated_hospital_id?: string; // IPFS CID or specific ID
  public_key_for_encryption?: string; // For asymmetric encryption
}

// 3. Medical Record Details - Base interface
export interface BaseMedicalRecord {
  record_id: string; // For internal consistency, recordId from contract is primary
  record_type: string;
  created_date: string;
  last_updated: string;
  attachments?: Array<{
    attachment_name: string;
    file_type: string;
    file_CID: string; // IPFS CID for actual file content
    upload_date: string;
  }>;
}

// Encounter Record JSON
export interface EncounterRecord extends BaseMedicalRecord {
  encounter_id: string;
  encounter_date_time: string;
  reason_for_visit: string;
  chief_complaint: string;
  history_of_present_illness: string;
  physical_examination_findings: string;
  diagnosis: Array<{
    diagnosis_code: string;
    diagnosis_description: string;
    is_primary: boolean;
  }>;
  treatments_prescribed: Array<{
    treatment_name: string;
    details: string;
  }>;
  medications_prescribed_at_encounter: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    start_date: string;
    end_date?: string;
  }>;
  procedures_performed: Array<{
    procedure_code: string;
    procedure_description: string;
    procedure_date: string;
    notes: string;
  }>;
  referrals: Array<{
    referred_to_provider_id: string; // IPFS CID
    reason: string;
    referral_date: string;
  }>;
  follow_up_instructions: string;
  notes: string;
}

// Lab Result Record JSON
export interface LabResultRecord extends BaseMedicalRecord {
  lab_result_id: string;
  test_name: string;
  test_code: string;
  collection_date: string;
  result_date: string;
  results_data: Array<{
    parameter_name: string;
    parameter_code: string;
    value: string;
    unit: string;
    reference_range_min?: string;
    reference_range_max?: string;
    interpretation: string;
    abnormal_flag: boolean;
  }>;
  interpretation_notes: string;
  status: string;
  report_file_CID: string; // IPFS CID for the PDF lab report
}

// Imaging Report Record JSON
export interface ImagingReportRecord extends BaseMedicalRecord {
  imaging_report_id: string;
  modality: string;
  body_part: string;
  exam_name: string;
  exam_code: string;
  exam_date: string;
  report_date: string;
  radiologist_id: string; // IPFS CID
  findings: string;
  impression: string;
  recommendations: string;
  report_file_CID: string; // IPFS CID for the PDF report
  image_CIDs: Array<{
    image_name: string;
    file_type: string; // DICOM, JPG, PNG, etc.
    image_CID: string; // IPFS CID for DICOM/JPEG images
  }>;
}

// Prescription Record JSON
export interface PrescriptionRecord extends BaseMedicalRecord {
  prescription_id: string;
  prescribing_date: string;
  prescribing_provider_id: string; // IPFS CID
  pharmacy_id?: string; // IPFS CID
  medications: Array<{
    medication_name: string;
    generic_name?: string;
    strength: string;
    dosage_form: string;
    quantity: string;
    days_supply: number;
    directions_for_use: string;
    refills_remaining: number;
    ndc_number?: string;
  }>;
  diagnosis_codes: string[];
  special_instructions: string;
  dea_number?: string;
  prescription_file_CID?: string; // IPFS CID for scanned prescription
}

// Mental Health Record JSON
export interface MentalHealthRecord extends BaseMedicalRecord {
  session_id: string;
  session_date: string;
  session_type: string; // therapy, evaluation, etc.
  therapist_provider_id: string; // IPFS CID
  presenting_concerns: string;
  mental_status_exam: {
    appearance: string;
    behavior: string;
    speech: string;
    mood: string;
    affect: string;
    thought_process: string;
    thought_content: string;
    perception: string;
    cognition: string;
    insight: string;
    judgment: string;
  };
  assessment: string;
  treatment_plan: string;
  goals: string[];
  interventions: string[];
  homework_assignments?: string[];
  next_session_date?: string;
  risk_assessment: {
    suicide_risk: string;
    homicide_risk: string;
    self_harm_risk: string;
  };
  confidential_notes: string;
}

// Surgery Record JSON
export interface SurgeryRecord extends BaseMedicalRecord {
  surgery_id: string;
  procedure_date: string;
  surgeon_provider_id: string; // IPFS CID
  anesthesiologist_provider_id?: string; // IPFS CID
  procedure_codes: Array<{
    cpt_code: string;
    procedure_description: string;
  }>;
  pre_operative_diagnosis: string[];
  post_operative_diagnosis: string[];
  procedure_details: string;
  anesthesia_type: string;
  start_time: string;
  end_time: string;
  estimated_blood_loss: string;
  complications: string;
  specimens_collected: Array<{
    specimen_type: string;
    pathology_report_CID?: string; // IPFS CID
  }>;
  post_operative_instructions: string;
  operative_report_CID: string; // IPFS CID for operative report PDF
  consent_form_CID?: string; // IPFS CID for signed consent form
}

// Genetic Test Record JSON
export interface GeneticTestRecord extends BaseMedicalRecord {
  genetic_test_id: string;
  test_name: string;
  test_type: string; // diagnostic, predictive, carrier, etc.
  collection_date: string;
  result_date: string;
  laboratory_name: string;
  genetic_counselor_id?: string; // IPFS CID
  test_indication: string;
  genes_tested: string[];
  variants_detected: Array<{
    gene: string;
    variant: string;
    classification: string; // pathogenic, benign, VUS, etc.
    zygosity: string;
    clinical_significance: string;
  }>;
  interpretation: string;
  recommendations: string;
  family_implications: string;
  genetic_report_CID: string; // IPFS CID for genetic test report PDF
  counseling_notes_CID?: string; // IPFS CID for counseling session notes
}

// Union type for all medical record types
export type MedicalRecord = 
  | EncounterRecord 
  | LabResultRecord 
  | ImagingReportRecord 
  | PrescriptionRecord 
  | MentalHealthRecord 
  | SurgeryRecord 
  | GeneticTestRecord;

// Raw file types that are stored directly in IPFS
export interface RawMedicalFile {
  file_name: string;
  file_type: 'DICOM' | 'JPG' | 'PNG' | 'PDF' | 'TXT' | 'DOC' | 'DOCX' | 'XML';
  file_category: 'X_RAY' | 'LAB_REPORT' | 'CONSULTATION_NOTES' | 'SCANNED_DOCUMENT' | 'MEDICAL_IMAGE' | 'OTHER';
  file_size: number;
  upload_date: string;
  uploaded_by_provider_id: string; // IPFS CID
  patient_id: string;
  related_record_id?: string; // Link to medical record
  encryption_used: boolean;
  mime_type: string;
}

// Clinic/Hospital Profile (for associated institutions)
export interface InstitutionProfile {
  institution_id: string;
  institution_name: string;
  institution_type: 'CLINIC' | 'HOSPITAL' | 'DIAGNOSTIC_CENTER' | 'LABORATORY' | 'PHARMACY';
  contact_info: ContactInfo;
  license_number: string;
  accreditation: Array<{
    accrediting_body: string;
    accreditation_number: string;
    expiry_date: string;
  }>;
  services_offered: string[];
  department_info?: Array<{
    department_name: string;
    department_head_provider_id: string; // IPFS CID
    services: string[];
  }>;
  emergency_services_available: boolean;
  affiliated_networks: string[];
}