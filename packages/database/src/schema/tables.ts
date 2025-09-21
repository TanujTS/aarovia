import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  address: varchar('address', { length: 42 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { enum: ['patient', 'provider', 'admin'] }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  addressIdx: index('users_address_idx').on(table.address),
  emailIdx: index('users_email_idx').on(table.email),
}));

export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  phone: varchar('phone', { length: 20 }),
  
  // Emergency contact information
  emergencyContact: jsonb('emergency_contact').$type<{
    name: string;
    phone: string;
    relation: string;
  }>(),
  
  // ICE (In Case of Emergency) mode settings
  iceMode: jsonb('ice_mode').$type<{
    enabled: boolean;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('patients_user_id_idx').on(table.userId),
}));

export const providers = pgTable('providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { enum: ['hospital', 'clinic', 'laboratory', 'pharmacy', 'individual'] }).notNull(),
  licenseNumber: varchar('license_number', { length: 100 }).notNull(),
  
  // Address information
  address: jsonb('address').$type<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>().notNull(),
  
  // Contact information  
  contact: jsonb('contact').$type<{
    phone: string;
    email: string;
    website?: string;
  }>().notNull(),
  
  specialties: jsonb('specialties').$type<string[]>(),
  verificationDocuments: jsonb('verification_documents').$type<string[]>(),
  
  status: varchar('status', { enum: ['pending_verification', 'verified', 'suspended'] }).default('pending_verification').notNull(),
  verifiedAt: timestamp('verified_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('providers_user_id_idx').on(table.userId),
  licenseIdx: index('providers_license_idx').on(table.licenseNumber),
  statusIdx: index('providers_status_idx').on(table.status),
}));

export const medicalRecords = pgTable('medical_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => providers.id),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { 
    enum: ['lab-report', 'imaging', 'prescription', 'consultation', 'other'] 
  }).notNull(),
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  fileMimeType: varchar('file_mime_type', { length: 100 }).notNull(),
  
  // Blockchain and IPFS information
  ipfsHash: varchar('ipfs_hash', { length: 100 }).notNull(),
  blockchainTxHash: varchar('blockchain_tx_hash', { length: 66 }),
  
  recordDate: timestamp('record_date').notNull(),
  tags: jsonb('tags').$type<string[]>(),
  
  // Encryption information
  encryptionKey: varchar('encryption_key', { length: 255 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdIdx: index('medical_records_patient_id_idx').on(table.patientId),
  providerIdIdx: index('medical_records_provider_id_idx').on(table.providerId),
  categoryIdx: index('medical_records_category_idx').on(table.category),
  recordDateIdx: index('medical_records_record_date_idx').on(table.recordDate),
  ipfsHashIdx: index('medical_records_ipfs_hash_idx').on(table.ipfsHash),
}));

export const accessGrants = pgTable('access_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordId: uuid('record_id').references(() => medicalRecords.id, { onDelete: 'cascade' }).notNull(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => providers.id, { onDelete: 'cascade' }).notNull(),
  
  permissions: jsonb('permissions').$type<string[]>().notNull(), // ['read', 'write', 'share']
  expiresAt: timestamp('expires_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  revokedAt: timestamp('revoked_at'),
  
  // Smart contract information
  contractAddress: varchar('contract_address', { length: 42 }),
  transactionHash: varchar('transaction_hash', { length: 66 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  recordIdIdx: index('access_grants_record_id_idx').on(table.recordId),
  patientIdIdx: index('access_grants_patient_id_idx').on(table.patientId),
  providerIdIdx: index('access_grants_provider_id_idx').on(table.providerId),
  expiresAtIdx: index('access_grants_expires_at_idx').on(table.expiresAt),
}));

export const accessRequests = pgTable('access_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => patients.id, { onDelete: 'cascade' }).notNull(),
  providerId: uuid('provider_id').references(() => providers.id, { onDelete: 'cascade' }).notNull(),
  
  reason: text('reason').notNull(),
  recordTypes: jsonb('record_types').$type<string[]>(),
  requestedDuration: varchar('requested_duration', { length: 50 }), // e.g., '7d', '30d', 'permanent'
  
  status: varchar('status', { enum: ['pending', 'approved', 'denied', 'expired'] }).default('pending').notNull(),
  responseMessage: text('response_message'),
  respondedAt: timestamp('responded_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  patientIdIdx: index('access_requests_patient_id_idx').on(table.patientId),
  providerIdIdx: index('access_requests_provider_id_idx').on(table.providerId),
  statusIdx: index('access_requests_status_idx').on(table.status),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  recordId: uuid('record_id').references(() => medicalRecords.id),
  
  action: varchar('action', { length: 100 }).notNull(), // 'create', 'read', 'update', 'delete', 'share', 'revoke'
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'medical_record', 'access_grant', etc.
  resourceId: uuid('resource_id'),
  
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  recordIdIdx: index('audit_logs_record_id_idx').on(table.recordId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));
