export * from './tables';
export * from './relations';

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
