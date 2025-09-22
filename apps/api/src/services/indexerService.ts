import { db } from '@aarovia/database';
import {
  indexedPatients,
  indexedProviders,
  indexedMedicalRecords,
  indexedAccessGrants,
  searchIndex,
  IndexedPatient,
  IndexedProvider,
  IndexedMedicalRecord,
  IndexedAccessGrant
} from '@aarovia/database';
import { eq, and, or, desc, asc, count, sql, like, ilike, gte, lte, gt } from 'drizzle-orm';
import { getIpfsService } from './ipfsService';

/**
 * Off-chain Indexer Core Functions
 * 
 * Provides fast querying capabilities for blockchain data with IPFS metadata hydration.
 * These functions power the frontend dashboards with aggregated and searchable data.
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterCriteria {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  provider?: string;
  tags?: string[];
  searchQuery?: string;
}

export interface PatientDashboardSummary {
  patient: {
    address: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      bloodType?: string;
      allergies?: string[];
      chronicConditions?: string[];
    };
    registrationDate: Date;
    lastActivity?: Date;
  };
  stats: {
    totalRecords: number;
    activeConsents: number;
    recordsByCategory: Array<{ category: string; count: number }>;
    recentActivity: number; // Records in last 30 days
  };
  recentRecords: Array<{
    recordId: string;
    title: string;
    category: string;
    recordDate: Date;
    providerName?: string;
  }>;
  activeProviders: Array<{
    providerAddress: string;
    name?: string;
    specialty?: string;
    accessType: 'general' | 'record-specific';
    grantedAt: Date;
    expiryTimestamp?: number;
  }>;
}

export interface PatientRecord {
  recordId: string;
  title: string;
  description?: string;
  category: string;
  recordDate: Date;
  provider?: {
    address: string;
    name?: string;
    specialty?: string;
  };
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    tags?: string[];
  };
  uploadedAt: Date;
}

export interface ProviderAccessInfo {
  providerAddress: string;
  name?: string;
  specialty?: string;
  accessType: 'general' | 'record-specific';
  recordIds?: string[];
  grantedAt: Date;
  expiryTimestamp?: number;
  isActive: boolean;
}

export interface DoctorPatientInfo {
  patientAddress: string;
  patientName?: string;
  lastInteraction: Date;
  interactionType: 'record_upload' | 'access_granted' | 'access_used';
  recordCount: number;
  hasActiveAccess: boolean;
  accessType?: 'general' | 'record-specific';
}

/**
 * Get comprehensive dashboard summary for a patient
 */
export async function getPatientDashboardSummary(
  patientAddress: string
): Promise<PatientDashboardSummary | null> {
  try {
    const normalizedAddress = patientAddress.toLowerCase();

    // Get patient basic info
    const patient = await db
      .select()
      .from(indexedPatients)
      .where(eq(indexedPatients.patientAddress, normalizedAddress))
      .limit(1);

    if (patient.length === 0) {
      return null;
    }

    const patientData = patient[0];

    // Get records by category stats
    const categoryStats = await db
      .select({
        category: indexedMedicalRecords.category,
        count: count(indexedMedicalRecords.id)
      })
      .from(indexedMedicalRecords)
      .where(eq(indexedMedicalRecords.patientAddress, normalizedAddress))
      .groupBy(indexedMedicalRecords.category);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivityCount = await db
      .select({ count: count(indexedMedicalRecords.id) })
      .from(indexedMedicalRecords)
      .where(
        and(
          eq(indexedMedicalRecords.patientAddress, normalizedAddress),
          gte(indexedMedicalRecords.createdAt, thirtyDaysAgo)
        )
      );

    // Get recent records (last 5)
    const recentRecords = await db
      .select({
        recordId: indexedMedicalRecords.recordId,
        title: sql<string>`COALESCE(${indexedMedicalRecords.recordMetadata}->>'title', 'Untitled Record')`,
        category: indexedMedicalRecords.category,
        recordDate: indexedMedicalRecords.recordDate,
        providerAddress: indexedMedicalRecords.providerAddress,
        providerName: indexedProviders.name,
      })
      .from(indexedMedicalRecords)
      .leftJoin(indexedProviders, eq(indexedMedicalRecords.providerAddress, indexedProviders.providerAddress))
      .where(eq(indexedMedicalRecords.patientAddress, normalizedAddress))
      .orderBy(desc(indexedMedicalRecords.createdAt))
      .limit(5);

    // Get active providers with access
    const activeProviders = await db
      .select({
        providerAddress: indexedAccessGrants.providerAddress,
        name: indexedProviders.name,
        specialty: indexedProviders.specialty,
        accessType: indexedAccessGrants.accessType,
        grantedAt: indexedAccessGrants.createdAt,
        expiryTimestamp: indexedAccessGrants.expiryTimestamp,
      })
      .from(indexedAccessGrants)
      .leftJoin(indexedProviders, eq(indexedAccessGrants.providerAddress, indexedProviders.providerAddress))
      .where(
        and(
          eq(indexedAccessGrants.patientAddress, normalizedAddress),
          eq(indexedAccessGrants.isActive, true),
          eq(indexedAccessGrants.isRevoked, false)
        )
      )
      .orderBy(desc(indexedAccessGrants.createdAt));

    return {
      patient: {
        address: patientData.patientAddress,
        profile: patientData.profileMetadata || undefined,
        registrationDate: patientData.createdAt,
        lastActivity: patientData.lastActivity || undefined,
      },
      stats: {
        totalRecords: patientData.totalRecords,
        activeConsents: patientData.activeConsents,
        recordsByCategory: categoryStats.map(stat => ({
          category: stat.category || 'Unknown',
          count: stat.count
        })),
        recentActivity: recentActivityCount[0]?.count || 0,
      },
      recentRecords: recentRecords.map(record => ({
        recordId: record.recordId,
        title: record.title,
        category: record.category || 'Unknown',
        recordDate: record.recordDate || new Date(),
        providerName: record.providerName || undefined,
      })),
      activeProviders: activeProviders.map(provider => ({
        providerAddress: provider.providerAddress,
        name: provider.name || undefined,
        specialty: provider.specialty || undefined,
        accessType: provider.accessType,
        grantedAt: provider.grantedAt,
        expiryTimestamp: provider.expiryTimestamp ? Number(provider.expiryTimestamp) : undefined,
      })),
    };
  } catch (error) {
    console.error(`Error getting patient dashboard summary for ${patientAddress}:`, error);
    return null;
  }
}

/**
 * Get paginated list of patient's medical records with filtering
 */
export async function getPatientPastRecords(
  patientAddress: string,
  filterCriteria: FilterCriteria = {},
  pagination: PaginationOptions = {}
): Promise<{
  records: PatientRecord[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    const normalizedAddress = patientAddress.toLowerCase();
    const { page = 1, limit = 20, sortBy = 'recordDate', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(indexedMedicalRecords.patientAddress, normalizedAddress)];

    if (filterCriteria.category) {
      whereConditions.push(eq(indexedMedicalRecords.category, filterCriteria.category));
    }

    if (filterCriteria.dateFrom) {
      whereConditions.push(gte(indexedMedicalRecords.recordDate, filterCriteria.dateFrom));
    }

    if (filterCriteria.dateTo) {
      whereConditions.push(lte(indexedMedicalRecords.recordDate, filterCriteria.dateTo));
    }

    if (filterCriteria.provider) {
      whereConditions.push(eq(indexedMedicalRecords.providerAddress, filterCriteria.provider.toLowerCase()));
    }

    if (filterCriteria.searchQuery) {
      whereConditions.push(ilike(indexedMedicalRecords.searchableText, `%${filterCriteria.searchQuery}%`));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: count(indexedMedicalRecords.id) })
      .from(indexedMedicalRecords)
      .where(and(...whereConditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Get records
    const orderByColumn = sortBy === 'recordDate' ? indexedMedicalRecords.recordDate : indexedMedicalRecords.createdAt;
    const orderByFn = sortOrder === 'asc' ? asc : desc;

    const records = await db
      .select({
        recordId: indexedMedicalRecords.recordId,
        recordMetadata: indexedMedicalRecords.recordMetadata,
        category: indexedMedicalRecords.category,
        recordDate: indexedMedicalRecords.recordDate,
        providerAddress: indexedMedicalRecords.providerAddress,
        providerName: indexedProviders.name,
        providerSpecialty: indexedProviders.specialty,
        uploadedAt: indexedMedicalRecords.createdAt,
      })
      .from(indexedMedicalRecords)
      .leftJoin(indexedProviders, eq(indexedMedicalRecords.providerAddress, indexedProviders.providerAddress))
      .where(and(...whereConditions))
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset(offset);

    const mappedRecords: PatientRecord[] = records.map(record => ({
      recordId: record.recordId,
      title: (record.recordMetadata as any)?.title || 'Untitled Record',
      description: (record.recordMetadata as any)?.description,
      category: record.category || 'Unknown',
      recordDate: record.recordDate || new Date(),
      provider: record.providerAddress ? {
        address: record.providerAddress,
        name: record.providerName || undefined,
        specialty: record.providerSpecialty || undefined,
      } : undefined,
      metadata: {
        fileSize: (record.recordMetadata as any)?.fileSize,
        mimeType: (record.recordMetadata as any)?.mimeType,
        tags: (record.recordMetadata as any)?.tags,
      },
      uploadedAt: record.uploadedAt,
    }));

    return {
      records: mappedRecords,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error(`Error getting patient past records for ${patientAddress}:`, error);
    return { records: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Get patient's most recent uploads
 */
export async function getPatientRecentUploads(
  patientAddress: string,
  count: number = 10
): Promise<PatientRecord[]> {
  try {
    const normalizedAddress = patientAddress.toLowerCase();

    const records = await db
      .select({
        recordId: indexedMedicalRecords.recordId,
        recordMetadata: indexedMedicalRecords.recordMetadata,
        category: indexedMedicalRecords.category,
        recordDate: indexedMedicalRecords.recordDate,
        providerAddress: indexedMedicalRecords.providerAddress,
        providerName: indexedProviders.name,
        providerSpecialty: indexedProviders.specialty,
        uploadedAt: indexedMedicalRecords.createdAt,
      })
      .from(indexedMedicalRecords)
      .leftJoin(indexedProviders, eq(indexedMedicalRecords.providerAddress, indexedProviders.providerAddress))
      .where(eq(indexedMedicalRecords.patientAddress, normalizedAddress))
      .orderBy(desc(indexedMedicalRecords.createdAt))
      .limit(count);

    return records.map(record => ({
      recordId: record.recordId,
      title: (record.recordMetadata as any)?.title || 'Untitled Record',
      description: (record.recordMetadata as any)?.description,
      category: record.category || 'Unknown',
      recordDate: record.recordDate || new Date(),
      provider: record.providerAddress ? {
        address: record.providerAddress,
        name: record.providerName || undefined,
        specialty: record.providerSpecialty || undefined,
      } : undefined,
      metadata: {
        fileSize: (record.recordMetadata as any)?.fileSize,
        mimeType: (record.recordMetadata as any)?.mimeType,
        tags: (record.recordMetadata as any)?.tags,
      },
      uploadedAt: record.uploadedAt,
    }));
  } catch (error) {
    console.error(`Error getting patient recent uploads for ${patientAddress}:`, error);
    return [];
  }
}

/**
 * Get list of providers who have access to patient's records
 */
export async function getPatientAccessList(
  patientAddress: string
): Promise<ProviderAccessInfo[]> {
  try {
    const normalizedAddress = patientAddress.toLowerCase();

    const accessGrants = await db
      .select({
        providerAddress: indexedAccessGrants.providerAddress,
        providerName: indexedProviders.name,
        providerSpecialty: indexedProviders.specialty,
        accessType: indexedAccessGrants.accessType,
        recordId: indexedAccessGrants.recordId,
        grantedAt: indexedAccessGrants.createdAt,
        expiryTimestamp: indexedAccessGrants.expiryTimestamp,
        isActive: indexedAccessGrants.isActive,
      })
      .from(indexedAccessGrants)
      .leftJoin(indexedProviders, eq(indexedAccessGrants.providerAddress, indexedProviders.providerAddress))
      .where(
        and(
          eq(indexedAccessGrants.patientAddress, normalizedAddress),
          eq(indexedAccessGrants.isRevoked, false)
        )
      )
      .orderBy(desc(indexedAccessGrants.createdAt));

    // Group by provider to consolidate access grants
    const providerAccessMap = new Map<string, ProviderAccessInfo>();

    for (const grant of accessGrants) {
      const providerId = grant.providerAddress;
      
      if (!providerAccessMap.has(providerId)) {
        providerAccessMap.set(providerId, {
          providerAddress: grant.providerAddress,
          name: grant.providerName || undefined,
          specialty: grant.providerSpecialty || undefined,
          accessType: grant.accessType,
          recordIds: [],
          grantedAt: grant.grantedAt,
          expiryTimestamp: grant.expiryTimestamp ? Number(grant.expiryTimestamp) : undefined,
          isActive: grant.isActive,
        });
      }

      const providerAccess = providerAccessMap.get(providerId)!;
      
      // Add record-specific access
      if (grant.recordId) {
        providerAccess.recordIds!.push(grant.recordId);
      }
      
      // Update to general access if any general access exists
      if (grant.accessType === 'general') {
        providerAccess.accessType = 'general';
      }
    }

    return Array.from(providerAccessMap.values());
  } catch (error) {
    console.error(`Error getting patient access list for ${patientAddress}:`, error);
    return [];
  }
}

/**
 * Get patients who recently granted access to or interacted with a doctor
 */
export async function getDoctorRecentPatients(
  doctorAddress: string,
  maxResults: number = 20
): Promise<DoctorPatientInfo[]> {
  try {
    const normalizedAddress = doctorAddress.toLowerCase();

    // Get recent access grants
    const recentAccess = await db
      .select({
        patientAddress: indexedAccessGrants.patientAddress,
        grantedAt: indexedAccessGrants.createdAt,
        accessType: indexedAccessGrants.accessType,
        isActive: indexedAccessGrants.isActive,
      })
      .from(indexedAccessGrants)
      .where(eq(indexedAccessGrants.providerAddress, normalizedAddress))
      .orderBy(desc(indexedAccessGrants.createdAt))
  .limit(maxResults * 2); // Get more to account for duplicates

    // Get recent record uploads by this doctor
    const recentUploads = await db
      .select({
        patientAddress: indexedMedicalRecords.patientAddress,
        uploadedAt: indexedMedicalRecords.createdAt,
      })
      .from(indexedMedicalRecords)
      .where(eq(indexedMedicalRecords.providerAddress, normalizedAddress))
      .orderBy(desc(indexedMedicalRecords.createdAt))
  .limit(maxResults * 2);

    // Combine and deduplicate by patient
    const patientInteractions = new Map<string, DoctorPatientInfo>();

    // Process access grants
    for (const access of recentAccess) {
      const patientId = access.patientAddress;
      const existing = patientInteractions.get(patientId);
      
      if (!existing || access.grantedAt > existing.lastInteraction) {
        patientInteractions.set(patientId, {
          patientAddress: access.patientAddress,
          lastInteraction: access.grantedAt,
          interactionType: 'access_granted',
          recordCount: 0, // Will be populated below
          hasActiveAccess: access.isActive,
          accessType: access.accessType,
        });
      }
    }

    // Process record uploads
    for (const upload of recentUploads) {
      const patientId = upload.patientAddress;
      const existing = patientInteractions.get(patientId);
      
      if (!existing || upload.uploadedAt > existing.lastInteraction) {
        patientInteractions.set(patientId, {
          patientAddress: upload.patientAddress,
          lastInteraction: upload.uploadedAt,
          interactionType: 'record_upload',
          recordCount: 0,
          hasActiveAccess: existing?.hasActiveAccess || false,
          accessType: existing?.accessType,
        });
      }
    }

    // Get record counts and patient names
    const patientAddresses = Array.from(patientInteractions.keys());
    
    if (patientAddresses.length === 0) {
      return [];
    }

    // Get record counts for each patient (uploaded by this doctor)
    const recordCounts = await db
      .select({
        patientAddress: indexedMedicalRecords.patientAddress,
        count: count(indexedMedicalRecords.id)
      })
      .from(indexedMedicalRecords)
      .where(
        and(
          eq(indexedMedicalRecords.providerAddress, normalizedAddress),
          sql`${indexedMedicalRecords.patientAddress} = ANY(${patientAddresses})`
        )
      )
      .groupBy(indexedMedicalRecords.patientAddress);

    // Get patient profile data
    const patientProfiles = await db
      .select({
        patientAddress: indexedPatients.patientAddress,
        profileMetadata: indexedPatients.profileMetadata,
      })
      .from(indexedPatients)
      .where(sql`${indexedPatients.patientAddress} = ANY(${patientAddresses})`);

    // Update patient info with counts and names
    for (const recordCount of recordCounts) {
      const patient = patientInteractions.get(recordCount.patientAddress);
      if (patient) {
        patient.recordCount = recordCount.count;
      }
    }

    for (const profile of patientProfiles) {
      const patient = patientInteractions.get(profile.patientAddress);
      if (patient && profile.profileMetadata) {
        const metadata = profile.profileMetadata as any;
        if (metadata.firstName || metadata.lastName) {
          patient.patientName = `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim();
        }
      }
    }

    // Sort by last interaction and return top results
    const sortedPatients = Array.from(patientInteractions.values())
      .sort((a, b) => b.lastInteraction.getTime() - a.lastInteraction.getTime())
      .slice(0, maxResults);

    return sortedPatients;
  } catch (error) {
    console.error(`Error getting doctor recent patients for ${doctorAddress}:`, error);
    return [];
  }
}

/**
 * Search medical records across all patients (for provider use with proper access)
 */
export async function searchMedicalRecords(
  searchQuery: string,
  providerAddress?: string,
  pagination: PaginationOptions = {}
): Promise<{
  records: PatientRecord[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const whereConditions = [
      ilike(searchIndex.content, `%${searchQuery}%`)
    ];

    // If provider is specified, only show records they have access to
    if (providerAddress) {
      const normalizedProvider = providerAddress.toLowerCase();
      
      // Subquery for patients where provider has general access
      const generalAccessQuery = db
        .select({ patientAddress: indexedAccessGrants.patientAddress })
        .from(indexedAccessGrants)
        .where(
          and(
            eq(indexedAccessGrants.providerAddress, normalizedProvider),
            eq(indexedAccessGrants.accessType, 'general'),
            eq(indexedAccessGrants.isActive, true),
            eq(indexedAccessGrants.isRevoked, false)
          )
        );

      // Subquery for specific record access
      const recordAccessQuery = db
        .select({ recordId: indexedAccessGrants.recordId })
        .from(indexedAccessGrants)
        .where(
          and(
            eq(indexedAccessGrants.providerAddress, normalizedProvider),
            eq(indexedAccessGrants.accessType, 'record-specific'),
            eq(indexedAccessGrants.isActive, true),
            eq(indexedAccessGrants.isRevoked, false)
          )
        );

      const providerAccessSql = or(
        sql`${searchIndex.patientAddress} IN (${generalAccessQuery})`,
        sql`${searchIndex.recordId} IN (${recordAccessQuery})`
      );
      if (providerAccessSql) {
        whereConditions.push(providerAccessSql);
      }
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: count(searchIndex.id) })
      .from(searchIndex)
  .where(and(...whereConditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Get search results
    const searchResults = await db
      .select({
        recordId: searchIndex.recordId,
        patientAddress: searchIndex.patientAddress,
        title: searchIndex.title,
        category: searchIndex.category,
      })
      .from(searchIndex)
  .where(and(...whereConditions))
      .limit(limit)
      .offset(offset);

    // Get full record details
    const recordIds = searchResults.map(r => r.recordId);
    
    if (recordIds.length === 0) {
      return { records: [], totalCount: 0, hasMore: false };
    }

    const fullRecords = await db
      .select({
        recordId: indexedMedicalRecords.recordId,
        recordMetadata: indexedMedicalRecords.recordMetadata,
        category: indexedMedicalRecords.category,
        recordDate: indexedMedicalRecords.recordDate,
        providerAddress: indexedMedicalRecords.providerAddress,
        providerName: indexedProviders.name,
        providerSpecialty: indexedProviders.specialty,
        uploadedAt: indexedMedicalRecords.createdAt,
      })
      .from(indexedMedicalRecords)
      .leftJoin(indexedProviders, eq(indexedMedicalRecords.providerAddress, indexedProviders.providerAddress))
      .where(sql`${indexedMedicalRecords.recordId} = ANY(${recordIds})`);

    const mappedRecords: PatientRecord[] = fullRecords.map(record => ({
      recordId: record.recordId,
      title: (record.recordMetadata as any)?.title || 'Untitled Record',
      description: (record.recordMetadata as any)?.description,
      category: record.category || 'Unknown',
      recordDate: record.recordDate || new Date(),
      provider: record.providerAddress ? {
        address: record.providerAddress,
        name: record.providerName || undefined,
        specialty: record.providerSpecialty || undefined,
      } : undefined,
      metadata: {
        fileSize: (record.recordMetadata as any)?.fileSize,
        mimeType: (record.recordMetadata as any)?.mimeType,
        tags: (record.recordMetadata as any)?.tags,
      },
      uploadedAt: record.uploadedAt,
    }));

    return {
      records: mappedRecords,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    console.error('Error searching medical records:', error);
    return { records: [], totalCount: 0, hasMore: false };
  }
}