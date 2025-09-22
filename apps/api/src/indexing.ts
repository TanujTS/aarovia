import dotenv from 'dotenv';
import { createIndexingService } from './services/indexingManager';

// Load environment variables
dotenv.config();

/**
 * Indexing Service Configuration and Initialization
 * 
 * This file configures and starts the off-chain indexing system for the Aarovia platform.
 * It includes blockchain event listening, IPFS metadata hydration, and database caching.
 */

// Contract ABIs (these would normally be imported from artifacts)
// For now, we'll use placeholder ABIs - in production these would be the actual contract ABIs
const PATIENT_REGISTRY_ABI = [
  "event PatientRegistered(address indexed patient, string medicalProfileCID)",
];

const PROVIDER_REGISTRY_ABI = [
  "event ProviderRegistered(address indexed provider, string name, string specialty, string licenseNumber)",
];

const MEDICAL_RECORDS_ABI = [
  "event RecordUploaded(string indexed recordId, address indexed patient, address indexed provider, string recordDetailsCID)",
];

const ACCESS_CONTROL_ABI = [
  "event AccessGranted(address indexed patient, address indexed provider, string recordId, uint8 accessType, uint256 expiryTimestamp)",
  "event AccessRevoked(address indexed patient, address indexed provider, string recordId, uint8 accessType)",
  "event GeneralAccessGranted(address indexed patient, address indexed provider, uint256 expiryTimestamp)",
  "event GeneralAccessRevoked(address indexed patient, address indexed provider)",
];

// Configuration
const indexingConfig = {
  blockchain: {
    providerUrl: process.env.RPC_URL || 'http://localhost:8545',
    contracts: [
      {
        name: 'PatientRegistry',
        address: process.env.PATIENT_REGISTRY_CONTRACT || '0x...',
        abi: PATIENT_REGISTRY_ABI,
      },
      {
        name: 'ProviderRegistry', 
        address: process.env.PROVIDER_REGISTRY_CONTRACT || '0x...',
        abi: PROVIDER_REGISTRY_ABI,
      },
      {
        name: 'MedicalRecords',
        address: process.env.MEDICAL_RECORDS_CONTRACT || '0x...',
        abi: MEDICAL_RECORDS_ABI,
      },
      {
        name: 'AccessControl',
        address: process.env.ACCESS_CONTROL_CONTRACT || '0x...',
        abi: ACCESS_CONTROL_ABI,
      },
    ],
    startBlock: parseInt(process.env.START_BLOCK || '0'),
    batchSize: parseInt(process.env.EVENT_BATCH_SIZE || '1000'),
    pollInterval: parseInt(process.env.POLL_INTERVAL || '30000'), // 30 seconds
  },
  ipfs: {
    gatewayUrl: process.env.IPFS_GATEWAY_URL || 'https://ipfs.io',
    timeout: parseInt(process.env.IPFS_TIMEOUT || '30000'),
    retryAttempts: parseInt(process.env.IPFS_RETRY_ATTEMPTS || '3'),
    cacheExpiry: parseInt(process.env.IPFS_CACHE_EXPIRY || '24'), // hours
  },
  processInterval: parseInt(process.env.PROCESS_INTERVAL || '60000'), // 1 minute
  batchSize: parseInt(process.env.HYDRATION_BATCH_SIZE || '50'),
};

// Initialize and start indexing service
export async function initializeIndexing(): Promise<void> {
  try {
    console.log('🚀 Starting Aarovia Off-chain Indexing System...');
    console.log('Configuration:', {
      blockchain: {
        provider: indexingConfig.blockchain.providerUrl,
        contracts: indexingConfig.blockchain.contracts.length,
        startBlock: indexingConfig.blockchain.startBlock,
      },
      ipfs: {
        gateway: indexingConfig.ipfs.gatewayUrl,
        cacheExpiry: `${indexingConfig.ipfs.cacheExpiry}h`,
      },
    });

    const indexingService = createIndexingService(indexingConfig);
    
    await indexingService.initialize();
    await indexingService.start();

    console.log('✅ Indexing system started successfully!');

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down indexing system...');
      await indexingService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down indexing system...');
      await indexingService.stop();
      process.exit(0);
    });

    // Set up periodic cleanup (every 24 hours)
    setInterval(async () => {
      try {
        console.log('🧹 Running periodic cleanup...');
        await indexingService.cleanup();
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Log status every 5 minutes
    setInterval(async () => {
      try {
        const status = await indexingService.getStatus();
        console.log('📊 Indexing Status:', {
          running: status.isRunning,
          patients: status.stats.totalPatients,
          providers: status.stats.totalProviders,
          records: status.stats.totalRecords,
          pending: status.stats.unprocessedEvents,
        });
      } catch (error) {
        console.error('Error getting status:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

  } catch (error) {
    console.error('❌ Failed to start indexing system:', error);
    process.exit(1);
  }
}

// Export for external use
export { indexingConfig };

// Auto-start if this file is run directly
if (require.main === module) {
  initializeIndexing();
}