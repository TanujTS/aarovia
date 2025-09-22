import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, index, bigint } from 'drizzle-orm/pg-core';

/**
 * Off-chain indexing tables for blockchain events and IPFS metadata
 * These tables store indexed data from smart contracts for fast querying
 */

// Table to store all blockchain events for indexing
export const blockchainEvents = pgTable('blockchain_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Event identification
  eventName: varchar('event_name', { length: 100 }).notNull(),
  contractAddress: varchar('contract_address', { length: 42 }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
  blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
  logIndex: integer('log_index').notNull(),
  
  // Event data
  eventData: jsonb('event_data').notNull(), // Raw event parameters
  
  // Processing status
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at'),
  processingError: text('processing_error'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  eventNameIdx: index('blockchain_events_event_name_idx').on(table.eventName),
  contractAddressIdx: index('blockchain_events_contract_address_idx').on(table.contractAddress),
  transactionHashIdx: index('blockchain_events_transaction_hash_idx').on(table.transactionHash),
  blockNumberIdx: index('blockchain_events_block_number_idx').on(table.blockNumber),
  processedIdx: index('blockchain_events_processed_idx').on(table.processed),
  createdAtIdx: index('blockchain_events_created_at_idx').on(table.createdAt),
}));

// Indexed patient data from blockchain events
export const indexedPatients = pgTable('indexed_patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Blockchain data
  patientAddress: varchar('patient_address', { length: 42 }).notNull().unique(),
  medicalProfileCID: varchar('medical_profile_cid', { length: 100 }),
  
  // Cached IPFS metadata
  profileMetadata: jsonb('profile_metadata').$type<{
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  }>(),
  
  // Aggregated stats
  totalRecords: integer('total_records').default(0).notNull(),
  activeConsents: integer('active_consents').default(0).notNull(),
  lastActivity: timestamp('last_activity'),
  
  // Blockchain tracking
  registrationTxHash: varchar('registration_tx_hash', { length: 66 }),
  registrationBlockNumber: bigint('registration_block_number', { mode: 'number' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientAddressIdx: index('indexed_patients_address_idx').on(table.patientAddress),
  lastActivityIdx: index('indexed_patients_last_activity_idx').on(table.lastActivity),
}));

// Indexed provider data from blockchain events
export const indexedProviders = pgTable('indexed_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Blockchain data
  providerAddress: varchar('provider_address', { length: 42 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  specialty: varchar('specialty', { length: 100 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  
  // Aggregated stats
  totalPatients: integer('total_patients').default(0).notNull(),
  activeAccessGrants: integer('active_access_grants').default(0).notNull(),
  totalRecordsUploaded: integer('total_records_uploaded').default(0).notNull(),
  lastActivity: timestamp('last_activity'),
  
  // Blockchain tracking
  registrationTxHash: varchar('registration_tx_hash', { length: 66 }),
  registrationBlockNumber: bigint('registration_block_number', { mode: 'number' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  providerAddressIdx: index('indexed_providers_address_idx').on(table.providerAddress),
  specialtyIdx: index('indexed_providers_specialty_idx').on(table.specialty),
  lastActivityIdx: index('indexed_providers_last_activity_idx').on(table.lastActivity),
}));

// Indexed medical records from blockchain events
export const indexedMedicalRecords = pgTable('indexed_medical_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Blockchain data
  recordId: varchar('record_id', { length: 100 }).notNull().unique(),
  patientAddress: varchar('patient_address', { length: 42 }).notNull(),
  providerAddress: varchar('provider_address', { length: 42 }),
  recordDetailsCID: varchar('record_details_cid', { length: 100 }).notNull(),
  
  // Cached IPFS metadata
  recordMetadata: jsonb('record_metadata').$type<{
    title: string;
    description?: string;
    category: string;
    recordDate: string;
    fileSize?: number;
    mimeType?: string;
    tags?: string[];
    keywords?: string[]; // For search functionality
  }>(),
  
  // Search and indexing fields
  searchableText: text('searchable_text'), // Extracted text content for full-text search
  category: varchar('category', { length: 50 }),
  recordDate: timestamp('record_date'),
  
  // Blockchain tracking
  uploadTxHash: varchar('upload_tx_hash', { length: 66 }),
  uploadBlockNumber: bigint('upload_block_number', { mode: 'number' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  recordIdIdx: index('indexed_medical_records_record_id_idx').on(table.recordId),
  patientAddressIdx: index('indexed_medical_records_patient_address_idx').on(table.patientAddress),
  providerAddressIdx: index('indexed_medical_records_provider_address_idx').on(table.providerAddress),
  categoryIdx: index('indexed_medical_records_category_idx').on(table.category),
  recordDateIdx: index('indexed_medical_records_record_date_idx').on(table.recordDate),
  searchableTextIdx: index('indexed_medical_records_searchable_text_idx').on(table.searchableText),
}));

// Indexed access grants from blockchain events
export const indexedAccessGrants = pgTable('indexed_access_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Blockchain data
  patientAddress: varchar('patient_address', { length: 42 }).notNull(),
  providerAddress: varchar('provider_address', { length: 42 }).notNull(),
  recordId: varchar('record_id', { length: 100 }), // null for general access
  accessType: varchar('access_type', { enum: ['general', 'record-specific'] }).notNull(),
  expiryTimestamp: bigint('expiry_timestamp', { mode: 'number' }),
  
  // Status tracking
  isActive: boolean('is_active').default(true).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  
  // Blockchain tracking
  grantTxHash: varchar('grant_tx_hash', { length: 66 }),
  revokeTxHash: varchar('revoke_tx_hash', { length: 66 }),
  grantBlockNumber: bigint('grant_block_number', { mode: 'number' }),
  revokeBlockNumber: bigint('revoke_block_number', { mode: 'number' }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientAddressIdx: index('indexed_access_grants_patient_address_idx').on(table.patientAddress),
  providerAddressIdx: index('indexed_access_grants_provider_address_idx').on(table.providerAddress),
  recordIdIdx: index('indexed_access_grants_record_id_idx').on(table.recordId),
  accessTypeIdx: index('indexed_access_grants_access_type_idx').on(table.accessType),
  isActiveIdx: index('indexed_access_grants_is_active_idx').on(table.isActive),
  expiryTimestampIdx: index('indexed_access_grants_expiry_timestamp_idx').on(table.expiryTimestamp),
}));

// Cache table for IPFS metadata to avoid repeated fetches
export const ipfsMetadataCache = pgTable('ipfs_metadata_cache', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  cid: varchar('cid', { length: 100 }).notNull().unique(),
  metadata: jsonb('metadata').notNull(),
  
  // Cache management
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
  accessCount: integer('access_count').default(1).notNull(),
  
  // TTL management
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  cidIdx: index('ipfs_metadata_cache_cid_idx').on(table.cid),
  expiresAtIdx: index('ipfs_metadata_cache_expires_at_idx').on(table.expiresAt),
  lastAccessedIdx: index('ipfs_metadata_cache_last_accessed_idx').on(table.lastAccessed),
}));

// Search index for full-text search across records
export const searchIndex = pgTable('search_index', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Reference to the indexed record
  recordId: varchar('record_id', { length: 100 }).notNull(),
  patientAddress: varchar('patient_address', { length: 42 }).notNull(),
  
  // Search fields
  title: text('title'),
  content: text('content'),
  keywords: jsonb('keywords').$type<string[]>(),
  category: varchar('category', { length: 50 }),
  
  // Search optimization
  searchVector: text('search_vector'), // PostgreSQL tsvector for full-text search
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  recordIdIdx: index('search_index_record_id_idx').on(table.recordId),
  patientAddressIdx: index('search_index_patient_address_idx').on(table.patientAddress),
  categoryIdx: index('search_index_category_idx').on(table.category),
}));