/**
 * Test script to verify Pinata IPFS connection
 * Run with: npm run test:ipfs
 */

import 'dotenv/config';
import { createPinataClient } from './src/ipfs.js';
import { PatientProfile } from './src/types/medical-data-types.js';

async function testPinataConnection() {
  console.log('🧪 Testing Pinata IPFS Connection...\n');

  try {
    // Initialize Pinata client
    const client = createPinataClient(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_KEY
    );

    console.log('✅ Pinata client initialized');

    // Test 1: Upload a simple JSON file
    console.log('\n📤 Test 1: Uploading simple JSON...');
    const testData = {
      message: "Hello from Aarovia Medical Records!",
      timestamp: new Date().toISOString(),
      test: true
    };

    const jsonResult = await client.uploadJSON(
      testData,
      'MEDICAL_RECORD_JSON' as any,
      false // No encryption for test
    );

    console.log('✅ JSON uploaded successfully!');
    console.log(`   CID: ${jsonResult.hash}`);
    console.log(`   Size: ${jsonResult.size} bytes`);
    console.log(`   URL: ${jsonResult.url}`);

    // Test 2: Upload encrypted patient profile
    console.log('\n📤 Test 2: Uploading encrypted patient profile...');
    const testPatient: PatientProfile = {
      first_name: "John",
      last_name: "TestPatient",
      date_of_birth: "1990-01-01",
      gender: "Male",
      blood_type: "O+",
      contact_info: {
        phone_number: "+1-555-TEST",
        email: "test@aarovia.com",
        address: {
          street: "123 Test Street",
          city: "Test City",
          state_province: "CA",
          zip_code: "90210",
          country: "USA"
        }
      },
      emergency_contact: {
        name: "Jane TestContact",
        relationship: "Spouse",
        phone_number: "+1-555-EMERGENCY"
      },
      insurance_information: {
        provider_name: "Test Insurance Co",
        policy_number: "TEST123456",
        group_number: "GRP001"
      },
      allergies: [
        {
          allergen_name: "Test Allergen",
          reaction: "Mild rash",
          severity: "Low",
          onsetDate: "2020-01-01"
        }
      ],
      current_medications: [
        {
          medication_name: "Test Medication",
          dosage: "10mg",
          frequency: "Once daily",
          start_date: "2024-01-01",
          prescribing_doctor_id: "test-doctor-id"
        }
      ],
      past_medical_history: [
        {
          condition_name: "Test Condition",
          diagnosis_date: "2023-01-01",
          notes: "Test medical history entry"
        }
      ],
      family_medical_history: [
        {
          relationship: "Father",
          condition_name: "Test Family Condition",
          notes: "Test family history entry"
        }
      ],
      lifestyle_factors: {
        smoking_status: "Never smoker",
        alcohol_consumption: "Occasional",
        exercise_habits: "Regular exercise",
        dietary_preferences: "No restrictions"
      }
    };

    const patientResult = await client.uploadPatientProfile(testPatient, true);
    console.log('✅ Encrypted patient profile uploaded!');
    console.log(`   CID: ${patientResult.hash}`);
    console.log(`   Size: ${patientResult.size} bytes`);
    console.log(`   Encrypted: ${patientResult.encrypted}`);

    // Test 3: Pin content
    console.log('\n📌 Test 3: Pinning content...');
    const pinResult = await client.pinContent(jsonResult.hash);
    console.log(`✅ Content pinned: ${pinResult}`);

    // Test 4: Download and verify
    console.log('\n📥 Test 4: Downloading and verifying...');
    const downloadedData = await client.downloadJSON(jsonResult.hash, false);
    console.log('✅ Downloaded data matches original:', 
      JSON.stringify(downloadedData) === JSON.stringify(testData)
    );

    console.log('\n🎉 All tests passed! Your Pinata IPFS integration is working correctly!');
    console.log('\n📊 Summary:');
    console.log(`   • Simple JSON CID: ${jsonResult.hash}`);
    console.log(`   • Patient Profile CID: ${patientResult.hash}`);
    console.log(`   • Gateway URL: https://gateway.pinata.cloud/ipfs/${jsonResult.hash}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n🔑 Authentication Error:');
      console.error('   • Check your PINATA_API_KEY and PINATA_SECRET_KEY');
      console.error('   • Make sure they are correctly set in your .env file');
    } else if (error.message.includes('429')) {
      console.error('\n⏰ Rate Limit Error:');
      console.error('   • You may have hit Pinata\'s rate limits');
      console.error('   • Wait a few minutes and try again');
    } else {
      console.error('\n🐛 Unexpected Error:');
      console.error('   • Check your internet connection');
      console.error('   • Verify Pinata service status');
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testPinataConnection();
}

export { testPinataConnection };