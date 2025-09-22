import axios from 'axios';
import { db } from '@aarovia/database';
import { 
  ipfsMetadataCache,
  indexedPatients,
  indexedMedicalRecords,
  searchIndex,
  NewIpfsMetadataCache,
  NewSearchIndex
} from '@aarovia/database';
import { eq, lt, desc, sql } from 'drizzle-orm';

/**
 * IPFS Integration Service
 * 
 * Handles fetching, caching, and processing of IPFS metadata for medical records
 * and patient profiles. Includes text extraction for search functionality.
 */

export interface IpfsConfig {
  gatewayUrl: string;
  timeout?: number;
  retryAttempts?: number;
  cacheExpiry?: number; // hours
}

export interface PatientProfileMetadata {
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
}

export interface MedicalRecordMetadata {
  title: string;
  description?: string;
  category: string;
  recordDate: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  keywords?: string[];
  // Extracted content for search
  content?: string;
  attachmentHashes?: string[];
}

export class IpfsService {
  private config: IpfsConfig;
  
  constructor(config: IpfsConfig) {
    this.config = {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      cacheExpiry: 24, // 24 hours
      ...config
    };
  }

  /**
   * Fetch metadata from IPFS with caching
   */
  async fetchMetadata<T = any>(cid: string, useCache = true): Promise<T | null> {
    try {
      // Check cache first
      if (useCache) {
        const cached = await this.getCachedMetadata(cid);
        if (cached) {
          await this.updateCacheAccess(cid);
          return cached as T;
        }
      }

      // Fetch from IPFS
      const metadata = await this.fetchFromIpfs(cid);
      if (!metadata) return null;

      // Cache the result
      if (useCache) {
        await this.cacheMetadata(cid, metadata);
      }

      return metadata as T;
    } catch (error) {
      console.error(`Error fetching IPFS metadata for CID ${cid}:`, error);
      return null;
    }
  }

  /**
   * Hydrate patient profile metadata from IPFS
   */
  async hydratePatientProfile(patientAddress: string, medicalProfileCID: string): Promise<boolean> {
    try {
      const metadata = await this.fetchMetadata<PatientProfileMetadata>(medicalProfileCID);
      if (!metadata) return false;

      // Update indexed patient with metadata
      await db.update(indexedPatients)
        .set({
          profileMetadata: metadata,
          updatedAt: new Date(),
        })
        .where(eq(indexedPatients.patientAddress, patientAddress.toLowerCase()));

      console.log(`Hydrated patient profile for ${patientAddress}`);
      return true;
    } catch (error) {
      console.error(`Error hydrating patient profile for ${patientAddress}:`, error);
      return false;
    }
  }

  /**
   * Hydrate medical record metadata from IPFS
   */
  async hydrateMedicalRecord(recordId: string, recordDetailsCID: string): Promise<boolean> {
    try {
      const metadata = await this.fetchMetadata<MedicalRecordMetadata>(recordDetailsCID);
      if (!metadata) return false;

      // Extract searchable text content
      const searchableText = this.extractSearchableText(metadata);

      // Update indexed medical record with metadata
      await db.update(indexedMedicalRecords)
        .set({
          recordMetadata: metadata,
          searchableText: searchableText,
          category: metadata.category,
          recordDate: new Date(metadata.recordDate),
          updatedAt: new Date(),
        })
        .where(eq(indexedMedicalRecords.recordId, recordId));

      // Create search index entry
      await this.createSearchIndex(recordId, metadata, searchableText);

      console.log(`Hydrated medical record ${recordId}`);
      return true;
    } catch (error) {
      console.error(`Error hydrating medical record ${recordId}:`, error);
      return false;
    }
  }

  /**
   * Batch hydrate multiple records
   */
  async batchHydrateRecords(records: Array<{ recordId: string, recordDetailsCID: string }>): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(record => this.hydrateMedicalRecord(record.recordId, record.recordDetailsCID))
      );
      
      // Small delay between batches to avoid overwhelming IPFS gateway
      if (i + batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const expiredCutoff = new Date();
      expiredCutoff.setHours(expiredCutoff.getHours() - (this.config.cacheExpiry || 24));

      await db.delete(ipfsMetadataCache)
        .where(lt(ipfsMetadataCache.fetchedAt, expiredCutoff));

      console.log('Cleaned up expired IPFS cache entries');
    } catch (error) {
      console.error('Error cleaning up IPFS cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    avgAccessCount: number;
  }> {
    try {
      const stats = await db
        .select({
          count: sql<number>`count(*)`,
          avgAccess: sql<number>`avg(access_count)`,
        })
        .from(ipfsMetadataCache);

      return {
        totalEntries: stats[0]?.count || 0,
        totalSize: 0, // Could be calculated from metadata size
        avgAccessCount: stats[0]?.avgAccess || 0,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalEntries: 0, totalSize: 0, avgAccessCount: 0 };
    }
  }

  private async getCachedMetadata(cid: string): Promise<any | null> {
    try {
      const cached = await db
        .select()
        .from(ipfsMetadataCache)
        .where(eq(ipfsMetadataCache.cid, cid))
        .limit(1);

      if (cached.length === 0) return null;

      const entry = cached[0];
      
      // Check if expired
      if (entry.expiresAt && new Date() > entry.expiresAt) {
        await db.delete(ipfsMetadataCache)
          .where(eq(ipfsMetadataCache.cid, cid));
        return null;
      }

      return entry.metadata;
    } catch (error) {
      console.error(`Error getting cached metadata for ${cid}:`, error);
      return null;
    }
  }

  private async updateCacheAccess(cid: string): Promise<void> {
    try {
      await db.update(ipfsMetadataCache)
        .set({
          lastAccessed: new Date(),
          accessCount: sql`access_count + 1`,
        })
        .where(eq(ipfsMetadataCache.cid, cid));
    } catch (error) {
      console.error(`Error updating cache access for ${cid}:`, error);
    }
  }

  private async cacheMetadata(cid: string, metadata: any): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (this.config.cacheExpiry || 24));

      const newCache: NewIpfsMetadataCache = {
        cid,
        metadata,
        expiresAt,
        fetchedAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
      };

      await db.insert(ipfsMetadataCache)
        .values(newCache)
        .onConflictDoUpdate({
          target: ipfsMetadataCache.cid,
          set: {
            metadata,
            fetchedAt: new Date(),
            lastAccessed: new Date(),
            expiresAt,
            accessCount: sql`access_count + 1`,
          }
        });
    } catch (error) {
      console.error(`Error caching metadata for ${cid}:`, error);
    }
  }

  private async fetchFromIpfs(cid: string): Promise<any | null> {
    const maxRetries = this.config.retryAttempts || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.config.gatewayUrl}/ipfs/${cid}`;
        
        const response = await axios.get(url, {
          timeout: this.config.timeout,
          headers: {
            'Accept': 'application/json',
          }
        });

        if (response.status === 200 && response.data) {
          return response.data;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`IPFS fetch attempt ${attempt}/${maxRetries} failed for ${cid}:`, error instanceof Error ? error.message : String(error));
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return null;
  }

  private extractSearchableText(metadata: MedicalRecordMetadata): string {
    const textParts: string[] = [];
    
    if (metadata.title) textParts.push(metadata.title);
    if (metadata.description) textParts.push(metadata.description);
    if (metadata.category) textParts.push(metadata.category);
    if (metadata.tags) textParts.push(...metadata.tags);
    if (metadata.keywords) textParts.push(...metadata.keywords);
    if (metadata.content) textParts.push(metadata.content);
    
    return textParts.join(' ').toLowerCase();
  }

  private async createSearchIndex(recordId: string, metadata: MedicalRecordMetadata, searchableText: string): Promise<void> {
    try {
      // Get patient address for this record
      const record = await db
        .select({ patientAddress: indexedMedicalRecords.patientAddress })
        .from(indexedMedicalRecords)
        .where(eq(indexedMedicalRecords.recordId, recordId))
        .limit(1);

      if (record.length === 0) return;

      const newSearchIndex: NewSearchIndex = {
        recordId,
        patientAddress: record[0].patientAddress,
        title: metadata.title,
        content: searchableText,
        keywords: metadata.keywords || [],
        category: metadata.category,
        // PostgreSQL full-text search vector can be generated in database
        searchVector: null,
      };

      await db.insert(searchIndex)
        .values(newSearchIndex)
        .onConflictDoUpdate({
          target: searchIndex.recordId,
          set: {
            title: metadata.title,
            content: searchableText,
            keywords: metadata.keywords || [],
            category: metadata.category,
            updatedAt: new Date(),
          }
        });
    } catch (error) {
      console.error(`Error creating search index for ${recordId}:`, error);
    }
  }
}

// Export singleton instance
let ipfsService: IpfsService | null = null;

export function createIpfsService(config: IpfsConfig): IpfsService {
  if (!ipfsService) {
    ipfsService = new IpfsService(config);
  }
  return ipfsService;
}

export function getIpfsService(): IpfsService | null {
  return ipfsService;
}