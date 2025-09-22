/**
 * Simple IPFS connection test
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

console.log('🧪 Testing Pinata IPFS Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`   PINATA_API_KEY: ${process.env.PINATA_API_KEY ? 'Set ✅' : 'Missing ❌'}`);
console.log(`   PINATA_SECRET_KEY: ${process.env.PINATA_SECRET_KEY ? 'Set ✅' : 'Missing ❌'}`);

if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
  console.error('\n❌ Missing Pinata credentials in environment variables');
  process.exit(1);
}

// Test Pinata connection with a simple API call
async function testPinataConnection() {
  try {
    const testData = {
      message: "Hello from Aarovia Medical Records!",
      timestamp: new Date().toISOString(),
      test: true
    };

    const jsonString = JSON.stringify(testData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'test-data.json', { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
      name: 'aarovia-test-file',
      keyvalues: {
        type: 'test-data',
        timestamp: Date.now().toString()
      }
    }));

    console.log('\n📤 Uploading test file to Pinata...');

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Upload successful!');
    console.log(`   CID: ${result.IpfsHash}`);
    console.log(`   Size: ${result.PinSize} bytes`);
    console.log(`   Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);

    // Test download
    console.log('\n📥 Testing download...');
    const downloadResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    
    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.statusText}`);
    }

    const downloadedData = await downloadResponse.json();
    const dataMatches = JSON.stringify(downloadedData) === JSON.stringify(testData);
    
    console.log(`✅ Download successful! Data matches: ${dataMatches}`);

    console.log('\n🎉 All tests passed! Your Pinata IPFS integration is working correctly!');
    console.log('\n📊 Test Summary:');
    console.log(`   • File uploaded: test-data.json`);
    console.log(`   • IPFS CID: ${result.IpfsHash}`);
    console.log(`   • File size: ${result.PinSize} bytes`);
    console.log(`   • Data integrity: ${dataMatches ? 'Verified ✅' : 'Failed ❌'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n🔑 Authentication Error:');
      console.error('   • Check your PINATA_API_KEY and PINATA_SECRET_KEY');
      console.error('   • Make sure they are correctly set in your .env file');
      console.error('   • Verify the credentials are active in your Pinata dashboard');
    } else if (error.message.includes('429')) {
      console.error('\n⏰ Rate Limit Error:');
      console.error('   • You may have hit Pinata\'s rate limits');
      console.error('   • Wait a few minutes and try again');
    } else {
      console.error('\n🐛 Unexpected Error:');
      console.error('   • Check your internet connection');
      console.error('   • Verify Pinata service status at https://status.pinata.cloud/');
    }
    
    process.exit(1);
  }
}

testPinataConnection();