export * from './tables';
export * from './relations';
export * from './indexing-tables';

// Export table schemas for TypeScript inference
export type User = typeof import('./tables').users.$inferSelect;
export type NewUser = typeof import('./tables').users.$inferInsert;

export type Patient = typeof import('./tables').patients.$inferSelect;
export type NewPatient = typeof import('./tables').patients.$inferInsert;

export type Provider = typeof import('./tables').providers.$inferSelect;
export type NewProvider = typeof import('./tables').providers.$inferInsert;

export type MedicalRecord = typeof import('./tables').medicalRecords.$inferSelect;
export type NewMedicalRecord = typeof import('./tables').medicalRecords.$inferInsert;

export type AccessGrant = typeof import('./tables').accessGrants.$inferSelect;
export type NewAccessGrant = typeof import('./tables').accessGrants.$inferInsert;

export type AccessRequest = typeof import('./tables').accessRequests.$inferSelect;
export type NewAccessRequest = typeof import('./tables').accessRequests.$inferInsert;

export type AuditLog = typeof import('./tables').auditLogs.$inferSelect;
export type NewAuditLog = typeof import('./tables').auditLogs.$inferInsert;

// Export indexing table types
export type BlockchainEvent = typeof import('./indexing-tables').blockchainEvents.$inferSelect;
export type NewBlockchainEvent = typeof import('./indexing-tables').blockchainEvents.$inferInsert;

export type IndexedPatient = typeof import('./indexing-tables').indexedPatients.$inferSelect;
export type NewIndexedPatient = typeof import('./indexing-tables').indexedPatients.$inferInsert;

export type IndexedProvider = typeof import('./indexing-tables').indexedProviders.$inferSelect;
export type NewIndexedProvider = typeof import('./indexing-tables').indexedProviders.$inferInsert;

export type IndexedMedicalRecord = typeof import('./indexing-tables').indexedMedicalRecords.$inferSelect;
export type NewIndexedMedicalRecord = typeof import('./indexing-tables').indexedMedicalRecords.$inferInsert;

export type IndexedAccessGrant = typeof import('./indexing-tables').indexedAccessGrants.$inferSelect;
export type NewIndexedAccessGrant = typeof import('./indexing-tables').indexedAccessGrants.$inferInsert;

export type IpfsMetadataCache = typeof import('./indexing-tables').ipfsMetadataCache.$inferSelect;
export type NewIpfsMetadataCache = typeof import('./indexing-tables').ipfsMetadataCache.$inferInsert;

export type SearchIndex = typeof import('./indexing-tables').searchIndex.$inferSelect;
export type NewSearchIndex = typeof import('./indexing-tables').searchIndex.$inferInsert;
