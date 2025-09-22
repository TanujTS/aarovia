import { ethers } from 'ethers';
import { db } from '@aarovia/database';
import { 
  blockchainEvents,
  indexedPatients,
  indexedProviders,
  indexedMedicalRecords,
  indexedAccessGrants,
  NewBlockchainEvent,
  NewIndexedPatient,
  NewIndexedProvider,
  NewIndexedMedicalRecord,
  NewIndexedAccessGrant
} from '@aarovia/database';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Blockchain Event Listener Service
 * 
 * This service listens to all smart contract events and stores them in the database
 * for fast off-chain querying. It processes events from:
 * - PatientRegistry contract
 * - ProviderRegistry contract  
 * - MedicalRecords contract
 * - AccessControl contract
 */

export interface ContractConfig {
  address: string;
  abi: any[];
  name: string;
}

export interface EventListenerConfig {
  providerUrl: string;
  contracts: ContractConfig[];
  startBlock?: number;
  batchSize?: number;
  pollInterval?: number;
}

export class BlockchainEventListener {
  private provider: ethers.JsonRpcProvider;
  private contracts: Map<string, ethers.Contract> = new Map();
  private isListening = false;
  private lastProcessedBlock = 0;
  
  constructor(private config: EventListenerConfig) {
    this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    this.initializeContracts();
  }

  private initializeContracts() {
    for (const contractConfig of this.config.contracts) {
      const contract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        this.provider
      );
      this.contracts.set(contractConfig.name, contract);
    }
  }

  /**
   * Start listening to blockchain events
   */
  async startListening() {
    if (this.isListening) {
      console.log('Event listener is already running');
      return;
    }

    console.log('Starting blockchain event listener...');
    this.isListening = true;

    // Get the last processed block from database
    await this.loadLastProcessedBlock();

    // Set up event listeners for all contracts
    await this.setupEventListeners();

    // Start polling for missed events
    this.startEventPolling();

    console.log(`Event listener started. Monitoring from block ${this.lastProcessedBlock}`);
  }

  /**
   * Stop listening to blockchain events
   */
  async stopListening() {
    console.log('Stopping blockchain event listener...');
    this.isListening = false;
    
    // Remove all event listeners
    for (const contract of this.contracts.values()) {
      contract.removeAllListeners();
    }
    
    console.log('Event listener stopped');
  }

  private async loadLastProcessedBlock() {
    try {
      const lastEvent = await db
        .select({ blockNumber: blockchainEvents.blockNumber })
        .from(blockchainEvents)
        .orderBy(desc(blockchainEvents.blockNumber))
        .limit(1);

      if (lastEvent.length > 0) {
        this.lastProcessedBlock = lastEvent[0].blockNumber;
      } else {
        // If no events in database, start from config or current block - 1000
        this.lastProcessedBlock = this.config.startBlock || 
          (await this.provider.getBlockNumber()) - 1000;
      }
    } catch (error) {
      console.error('Error loading last processed block:', error);
      this.lastProcessedBlock = this.config.startBlock || 
        (await this.provider.getBlockNumber()) - 1000;
    }
  }

  private async setupEventListeners() {
    // Patient Registry Events
    const patientRegistry = this.contracts.get('PatientRegistry');
    if (patientRegistry) {
      patientRegistry.on('PatientRegistered', async (patientAddress, medicalProfileCID, event) => {
        await this.handlePatientRegistered(patientAddress, medicalProfileCID, event);
      });
    }

    // Provider Registry Events
    const providerRegistry = this.contracts.get('ProviderRegistry');
    if (providerRegistry) {
      providerRegistry.on('ProviderRegistered', async (providerAddress, name, specialty, licenseNumber, event) => {
        await this.handleProviderRegistered(providerAddress, name, specialty, licenseNumber, event);
      });
    }

    // Medical Records Events
    const medicalRecords = this.contracts.get('MedicalRecords');
    if (medicalRecords) {
      medicalRecords.on('RecordUploaded', async (recordId, patientAddress, providerAddress, recordDetailsCID, event) => {
        await this.handleRecordUploaded(recordId, patientAddress, providerAddress, recordDetailsCID, event);
      });
    }

    // Access Control Events
    const accessControl = this.contracts.get('AccessControl');
    if (accessControl) {
      accessControl.on('AccessGranted', async (patientAddress, providerAddress, recordId, accessType, expiryTimestamp, event) => {
        await this.handleAccessGranted(patientAddress, providerAddress, recordId, accessType, expiryTimestamp, event);
      });

      accessControl.on('AccessRevoked', async (patientAddress, providerAddress, recordId, accessType, event) => {
        await this.handleAccessRevoked(patientAddress, providerAddress, recordId, accessType, event);
      });

      accessControl.on('GeneralAccessGranted', async (patientAddress, providerAddress, expiryTimestamp, event) => {
        await this.handleGeneralAccessGranted(patientAddress, providerAddress, expiryTimestamp, event);
      });

      accessControl.on('GeneralAccessRevoked', async (patientAddress, providerAddress, event) => {
        await this.handleGeneralAccessRevoked(patientAddress, providerAddress, event);
      });
    }
  }

  private startEventPolling() {
    const pollInterval = this.config.pollInterval || 30000; // 30 seconds default
    
    setInterval(async () => {
      if (!this.isListening) return;
      
      try {
        await this.processPastEvents();
      } catch (error) {
        console.error('Error in event polling:', error);
      }
    }, pollInterval);
  }

  private async processPastEvents() {
    const currentBlock = await this.provider.getBlockNumber();
    const batchSize = this.config.batchSize || 1000;
    
    if (currentBlock <= this.lastProcessedBlock) return;

    console.log(`Processing events from block ${this.lastProcessedBlock + 1} to ${currentBlock}`);

    for (let fromBlock = this.lastProcessedBlock + 1; fromBlock <= currentBlock; fromBlock += batchSize) {
      const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);
      
      for (const [contractName, contract] of this.contracts) {
        try {
          const events = await contract.queryFilter('*', fromBlock, toBlock);
          
          for (const event of events) {
            await this.storeRawEvent(contractName, event);
          }
        } catch (error) {
          console.error(`Error querying events for ${contractName}:`, error);
        }
      }
      
      this.lastProcessedBlock = toBlock;
    }
  }

  private isEventLog(event: ethers.Log | ethers.EventLog): event is ethers.EventLog {
    return (event as ethers.EventLog).args !== undefined && 'eventName' in (event as any);
  }

  private async storeRawEvent(contractName: string, event: ethers.Log | ethers.EventLog) {
    try {
      const isEvt = this.isEventLog(event);
      const newEvent: NewBlockchainEvent = {
        eventName: isEvt && event.eventName ? event.eventName : 'Unknown',
        contractAddress: event.address,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        logIndex: event.index,
        eventData: {
          contractName,
          args: isEvt && event.args ? Object.fromEntries(
            Object.entries(event.args).filter(([key]) => isNaN(Number(key)))
          ) : {},
          topics: event.topics,
        },
        processed: false,
      };

      await db.insert(blockchainEvents).values(newEvent);
    } catch (error) {
      console.error('Error storing raw event:', error);
    }
  }

  // Event Handlers
  private async handlePatientRegistered(patientAddress: string, medicalProfileCID: string, event: ethers.Log | ethers.EventLog) {
    try {
      await this.storeRawEvent('PatientRegistry', event);

      // Create or update indexed patient
      const newPatient: NewIndexedPatient = {
        patientAddress: patientAddress.toLowerCase(),
        medicalProfileCID,
        profileMetadata: null, // Will be hydrated by IPFS service
        totalRecords: 0,
        activeConsents: 0,
        registrationTxHash: event.transactionHash,
        registrationBlockNumber: event.blockNumber,
        lastActivity: new Date(),
      };

      await db.insert(indexedPatients)
        .values(newPatient)
        .onConflictDoUpdate({
          target: indexedPatients.patientAddress,
          set: {
            medicalProfileCID,
            registrationTxHash: event.transactionHash,
            registrationBlockNumber: event.blockNumber,
            updatedAt: new Date(),
          }
        });

      console.log(`Patient registered: ${patientAddress}`);
    } catch (error) {
      console.error('Error handling PatientRegistered event:', error);
    }
  }

  private async handleProviderRegistered(providerAddress: string, name: string, specialty: string, licenseNumber: string, event: ethers.Log | ethers.EventLog) {
    try {
      await this.storeRawEvent('ProviderRegistry', event);

      const newProvider: NewIndexedProvider = {
        providerAddress: providerAddress.toLowerCase(),
        name,
        specialty,
        licenseNumber,
        totalPatients: 0,
        activeAccessGrants: 0,
        totalRecordsUploaded: 0,
        registrationTxHash: event.transactionHash,
        registrationBlockNumber: event.blockNumber,
        lastActivity: new Date(),
      };

      await db.insert(indexedProviders)
        .values(newProvider)
        .onConflictDoUpdate({
          target: indexedProviders.providerAddress,
          set: {
            name,
            specialty,
            licenseNumber,
            registrationTxHash: event.transactionHash,
            registrationBlockNumber: event.blockNumber,
            updatedAt: new Date(),
          }
        });

      console.log(`Provider registered: ${providerAddress} - ${name}`);
    } catch (error) {
      console.error('Error handling ProviderRegistered event:', error);
    }
  }

  private async handleRecordUploaded(recordId: string, patientAddress: string, providerAddress: string, recordDetailsCID: string, event: ethers.Log | ethers.EventLog) {
    try {
      await this.storeRawEvent('MedicalRecords', event);

      const newRecord: NewIndexedMedicalRecord = {
        recordId,
        patientAddress: patientAddress.toLowerCase(),
        providerAddress: providerAddress?.toLowerCase() || null,
        recordDetailsCID,
        recordMetadata: null, // Will be hydrated by IPFS service
        searchableText: null,
        category: null,
        recordDate: null,
        uploadTxHash: event.transactionHash,
        uploadBlockNumber: event.blockNumber,
      };

      await db.insert(indexedMedicalRecords)
        .values(newRecord)
        .onConflictDoUpdate({
          target: indexedMedicalRecords.recordId,
          set: {
            recordDetailsCID,
            uploadTxHash: event.transactionHash,
            uploadBlockNumber: event.blockNumber,
            updatedAt: new Date(),
          }
        });

      // Update patient's total records count
      await db.update(indexedPatients)
        .set({ 
          totalRecords: sql`total_records + 1`,
          lastActivity: new Date(),
          updatedAt: new Date()
        })
        .where(eq(indexedPatients.patientAddress, patientAddress.toLowerCase()));

      // Update provider's total records uploaded
      if (providerAddress) {
        await db.update(indexedProviders)
          .set({ 
            totalRecordsUploaded: sql`total_records_uploaded + 1`,
            lastActivity: new Date(),
            updatedAt: new Date()
          })
          .where(eq(indexedProviders.providerAddress, providerAddress.toLowerCase()));
      }

      console.log(`Record uploaded: ${recordId} for patient ${patientAddress}`);
    } catch (error) {
      console.error('Error handling RecordUploaded event:', error);
    }
  }

  private async handleAccessGranted(patientAddress: string, providerAddress: string, recordId: string, accessType: number, expiryTimestamp: bigint, event: ethers.Log | ethers.EventLog) {
    try {
      await this.storeRawEvent('AccessControl', event);

      const accessTypeStr = accessType === 0 ? 'general' : 'record-specific';
      
      const newAccessGrant: NewIndexedAccessGrant = {
        patientAddress: patientAddress.toLowerCase(),
        providerAddress: providerAddress.toLowerCase(),
        recordId: recordId || null,
        accessType: accessTypeStr,
        expiryTimestamp: Number(expiryTimestamp),
        isActive: true,
        isRevoked: false,
        grantTxHash: event.transactionHash,
        grantBlockNumber: event.blockNumber,
      };

      await db.insert(indexedAccessGrants).values(newAccessGrant);

      // Update aggregated counts
      await this.updateAccessGrantCounts(patientAddress, providerAddress, 1);

      console.log(`Access granted: ${providerAddress} -> ${patientAddress} (${accessTypeStr})`);
    } catch (error) {
      console.error('Error handling AccessGranted event:', error);
    }
  }

  private async handleAccessRevoked(patientAddress: string, providerAddress: string, recordId: string, accessType: number, event: ethers.Log | ethers.EventLog) {
    try {
      await this.storeRawEvent('AccessControl', event);

      const accessTypeStr = accessType === 0 ? 'general' : 'record-specific';

      // Update the access grant to revoked
      const whereConds: any[] = [
        eq(indexedAccessGrants.patientAddress, patientAddress.toLowerCase()),
        eq(indexedAccessGrants.providerAddress, providerAddress.toLowerCase()),
        eq(indexedAccessGrants.accessType, accessTypeStr),
        eq(indexedAccessGrants.isActive, true)
      ];
      if (recordId) {
        whereConds.push(eq(indexedAccessGrants.recordId, recordId));
      } else {
        // Match general access entries where record_id is NULL
        whereConds.push(sql`${indexedAccessGrants.recordId} IS NULL`);
      }

      await db.update(indexedAccessGrants)
        .set({
          isActive: false,
          isRevoked: true,
          revokedAt: new Date(),
          revokeTxHash: event.transactionHash,
          revokeBlockNumber: event.blockNumber,
          updatedAt: new Date(),
        })
        .where(and(...whereConds));

      // Update aggregated counts
      await this.updateAccessGrantCounts(patientAddress, providerAddress, -1);

      console.log(`Access revoked: ${providerAddress} -> ${patientAddress} (${accessTypeStr})`);
    } catch (error) {
      console.error('Error handling AccessRevoked event:', error);
    }
  }

  private async handleGeneralAccessGranted(patientAddress: string, providerAddress: string, expiryTimestamp: bigint, event: ethers.Log | ethers.EventLog) {
    await this.handleAccessGranted(patientAddress, providerAddress, '', 0, expiryTimestamp, event);
  }

  private async handleGeneralAccessRevoked(patientAddress: string, providerAddress: string, event: ethers.Log | ethers.EventLog) {
    await this.handleAccessRevoked(patientAddress, providerAddress, '', 0, event);
  }

  private async updateAccessGrantCounts(patientAddress: string, providerAddress: string, delta: number) {
    try {
      // Update patient's active consents count
      await db.update(indexedPatients)
        .set({ 
          activeConsents: sql`active_consents + ${delta}`,
          lastActivity: new Date(),
          updatedAt: new Date()
        })
        .where(eq(indexedPatients.patientAddress, patientAddress.toLowerCase()));

      // Update provider's active access grants count
      await db.update(indexedProviders)
        .set({ 
          activeAccessGrants: sql`active_access_grants + ${delta}`,
          lastActivity: new Date(),
          updatedAt: new Date()
        })
        .where(eq(indexedProviders.providerAddress, providerAddress.toLowerCase()));
    } catch (error) {
      console.error('Error updating access grant counts:', error);
    }
  }
}

// Export singleton instance
let eventListener: BlockchainEventListener | null = null;

export function createEventListener(config: EventListenerConfig): BlockchainEventListener {
  if (!eventListener) {
    eventListener = new BlockchainEventListener(config);
  }
  return eventListener;
}

export function getEventListener(): BlockchainEventListener | null {
  return eventListener;
}