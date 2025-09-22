import { db } from '@aarovia/database';
import { createEventListener, EventListenerConfig } from './eventListener';
import { createIpfsService, IpfsConfig } from './ipfsService';
import { 
  indexedPatients,
  indexedProviders,
  indexedMedicalRecords,
  blockchainEvents
} from '@aarovia/database';
import { desc, eq, isNull, count, and } from 'drizzle-orm';

/**
 * Database Connection and Indexing Service Manager
 * 
 * Manages the initialization and coordination of all indexing services:
 * - Blockchain event listener
 * - IPFS metadata hydration
 * - Database optimization and cleanup
 */

export interface IndexingServiceConfig {
  blockchain: EventListenerConfig;
  ipfs: IpfsConfig;
  processInterval?: number; // milliseconds
  batchSize?: number;
}

export class IndexingServiceManager {
  private eventListener: ReturnType<typeof createEventListener> | null = null;
  private ipfsService: ReturnType<typeof createIpfsService> | null = null;
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(private config: IndexingServiceConfig) {}

  /**
   * Initialize all indexing services
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing indexing services...');

      // Test database connection
      await this.testDatabaseConnection();

      // Initialize IPFS service
      this.ipfsService = createIpfsService(this.config.ipfs);
      console.log('IPFS service initialized');

      // Initialize blockchain event listener
      this.eventListener = createEventListener(this.config.blockchain);
      console.log('Event listener initialized');

      // Start processing unhydrated records
      await this.startProcessingLoop();

      console.log('All indexing services initialized successfully');
    } catch (error) {
      console.error('Error initializing indexing services:', error);
      throw error;
    }
  }

  /**
   * Start all services
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Indexing services are already running');
      return;
    }

    try {
      console.log('Starting indexing services...');

      // Start event listener
      if (this.eventListener) {
        await this.eventListener.startListening();
      }

      // Start IPFS processing loop
      await this.startProcessingLoop();

      this.isRunning = true;
      console.log('All indexing services started successfully');
    } catch (error) {
      console.error('Error starting indexing services:', error);
      throw error;
    }
  }

  /**
   * Stop all services
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Indexing services are not running');
      return;
    }

    try {
      console.log('Stopping indexing services...');

      // Stop processing loop
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      // Stop event listener
      if (this.eventListener) {
        await this.eventListener.stopListening();
      }

      this.isRunning = false;
      console.log('All indexing services stopped successfully');
    } catch (error) {
      console.error('Error stopping indexing services:', error);
      throw error;
    }
  }

  /**
   * Get service status and statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    stats: {
      totalPatients: number;
      totalProviders: number;
      totalRecords: number;
      unprocessedEvents: number;
      unhydratedRecords: number;
      cacheStats?: any;
    };
  }> {
    try {
      // Get counts from database
      const [patientCount] = await db
        .select({ count: count(indexedPatients.id) })
        .from(indexedPatients);

      const [providerCount] = await db
        .select({ count: count(indexedProviders.id) })
        .from(indexedProviders);

      const [recordCount] = await db
        .select({ count: count(indexedMedicalRecords.id) })
        .from(indexedMedicalRecords);

      const [unprocessedEventCount] = await db
        .select({ count: count(blockchainEvents.id) })
        .from(blockchainEvents)
        .where(eq(blockchainEvents.processed, false));

      const [unhydratedRecordCount] = await db
        .select({ count: count(indexedMedicalRecords.id) })
        .from(indexedMedicalRecords)
        .where(isNull(indexedMedicalRecords.recordMetadata));

      let cacheStats = undefined;
      if (this.ipfsService) {
        cacheStats = await this.ipfsService.getCacheStats();
      }

      return {
        isRunning: this.isRunning,
        stats: {
          totalPatients: patientCount.count,
          totalProviders: providerCount.count,
          totalRecords: recordCount.count,
          unprocessedEvents: unprocessedEventCount.count,
          unhydratedRecords: unhydratedRecordCount.count,
          cacheStats,
        },
      };
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        isRunning: this.isRunning,
        stats: {
          totalPatients: 0,
          totalProviders: 0,
          totalRecords: 0,
          unprocessedEvents: 0,
          unhydratedRecords: 0,
        },
      };
    }
  }

  /**
   * Manually trigger processing for a specific patient
   */
  async processPatient(patientAddress: string): Promise<void> {
    if (!this.ipfsService) {
      throw new Error('IPFS service not initialized');
    }

    try {
      console.log(`Processing patient: ${patientAddress}`);

      // Get patient data
      const patient = await db
        .select()
        .from(indexedPatients)
        .where(eq(indexedPatients.patientAddress, patientAddress.toLowerCase()))
        .limit(1);

      if (patient.length === 0) {
        throw new Error('Patient not found');
      }

      const patientData = patient[0];

      // Hydrate patient profile if needed
      if (patientData.medicalProfileCID && !patientData.profileMetadata) {
        await this.ipfsService.hydratePatientProfile(
          patientAddress,
          patientData.medicalProfileCID
        );
      }

      // Get unhydrated records for this patient
      const unhydratedRecords = await db
        .select({
          recordId: indexedMedicalRecords.recordId,
          recordDetailsCID: indexedMedicalRecords.recordDetailsCID,
        })
        .from(indexedMedicalRecords)
        .where(
          and(
            eq(indexedMedicalRecords.patientAddress, patientAddress.toLowerCase()),
            isNull(indexedMedicalRecords.recordMetadata)
          )
        );

      // Batch hydrate records
      if (unhydratedRecords.length > 0) {
        await this.ipfsService.batchHydrateRecords(unhydratedRecords);
      }

      console.log(`Patient processing completed: ${patientAddress}`);
    } catch (error) {
      console.error(`Error processing patient ${patientAddress}:`, error);
      throw error;
    }
  }

  /**
   * Clean up expired cache and old events
   */
  async cleanup(): Promise<void> {
    if (!this.ipfsService) {
      console.warn('IPFS service not initialized, skipping cache cleanup');
      return;
    }

    try {
      console.log('Running cleanup tasks...');

      // Clean up expired IPFS cache
      await this.ipfsService.cleanupExpiredCache();

      // TODO: Clean up old processed events (keep last 30 days)
      // TODO: Archive old audit logs
      // TODO: Optimize database indexes

      console.log('Cleanup tasks completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    try {
      // Simple query to test connection
      await db.select().from(indexedPatients).limit(1);
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database');
    }
  }

  private async startProcessingLoop(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    const interval = this.config.processInterval || 60000; // 1 minute default

    this.processingInterval = setInterval(async () => {
      await this.processUnhydratedRecords();
    }, interval);

    // Run initial processing
    await this.processUnhydratedRecords();
  }

  private async processUnhydratedRecords(): Promise<void> {
    if (!this.ipfsService) return;

    try {
      const batchSize = this.config.batchSize || 50;

      // Get unhydrated patient profiles
      const unhydratedPatients = await db
        .select({
          patientAddress: indexedPatients.patientAddress,
          medicalProfileCID: indexedPatients.medicalProfileCID,
        })
        .from(indexedPatients)
        .where(isNull(indexedPatients.profileMetadata))
        .limit(batchSize);

      // Process patient profiles
      for (const patient of unhydratedPatients) {
        if (patient.medicalProfileCID) {
          await this.ipfsService.hydratePatientProfile(
            patient.patientAddress,
            patient.medicalProfileCID
          );
        }
      }

      // Get unhydrated medical records
      const unhydratedRecords = await db
        .select({
          recordId: indexedMedicalRecords.recordId,
          recordDetailsCID: indexedMedicalRecords.recordDetailsCID,
        })
        .from(indexedMedicalRecords)
        .where(isNull(indexedMedicalRecords.recordMetadata))
        .limit(batchSize);

      // Batch process records
      if (unhydratedRecords.length > 0) {
        await this.ipfsService.batchHydrateRecords(unhydratedRecords);
      }

      if (unhydratedPatients.length > 0 || unhydratedRecords.length > 0) {
        console.log(
          `Processed ${unhydratedPatients.length} patient profiles and ${unhydratedRecords.length} medical records`
        );
      }
    } catch (error) {
      console.error('Error in processing loop:', error);
    }
  }
}

// Export singleton instance
let serviceManager: IndexingServiceManager | null = null;

export function createIndexingService(config: IndexingServiceConfig): IndexingServiceManager {
  if (!serviceManager) {
    serviceManager = new IndexingServiceManager(config);
  }
  return serviceManager;
}

export function getIndexingService(): IndexingServiceManager | null {
  return serviceManager;
}