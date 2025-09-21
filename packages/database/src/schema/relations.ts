import { relations } from 'drizzle-orm';
import { 
  users, 
  patients, 
  providers, 
  medicalRecords, 
  accessGrants, 
  accessRequests, 
  auditLogs 
} from './tables';

// Define relationships between tables
export const usersRelations = relations(users, ({ one, many }) => ({
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  provider: one(providers, {
    fields: [users.id],
    references: [providers.userId],
  }),
  auditLogs: many(auditLogs),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  medicalRecords: many(medicalRecords),
  accessGrants: many(accessGrants),
  accessRequests: many(accessRequests),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, {
    fields: [providers.userId],
    references: [users.id],
  }),
  medicalRecords: many(medicalRecords),
  accessGrants: many(accessGrants),
  accessRequests: many(accessRequests),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
  provider: one(providers, {
    fields: [medicalRecords.providerId],
    references: [providers.id],
  }),
  accessGrants: many(accessGrants),
  auditLogs: many(auditLogs),
}));

export const accessGrantsRelations = relations(accessGrants, ({ one }) => ({
  record: one(medicalRecords, {
    fields: [accessGrants.recordId],
    references: [medicalRecords.id],
  }),
  patient: one(patients, {
    fields: [accessGrants.patientId],
    references: [patients.id],
  }),
  provider: one(providers, {
    fields: [accessGrants.providerId],
    references: [providers.id],
  }),
}));

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  patient: one(patients, {
    fields: [accessRequests.patientId],
    references: [patients.id],
  }),
  provider: one(providers, {
    fields: [accessRequests.providerId],
    references: [providers.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  record: one(medicalRecords, {
    fields: [auditLogs.recordId],
    references: [medicalRecords.id],
  }),
}));
