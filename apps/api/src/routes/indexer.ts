import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import {
  getPatientDashboardSummary,
  getPatientPastRecords,
  getPatientRecentUploads,
  getPatientAccessList,
  getDoctorRecentPatients,
  searchMedicalRecords,
  FilterCriteria,
  PaginationOptions
} from '../services/indexerService';

/**
 * Indexer API Routes
 * 
 * Provides RESTful endpoints for off-chain indexed data queries.
 * All endpoints require authentication and proper access control.
 */

const router = Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const filterSchema = z.object({
  category: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  provider: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
});

const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/**
 * GET /api/indexer/patient/:address/dashboard
 * Get comprehensive dashboard summary for a patient
 */
router.get(
  '/patient/:address/dashboard',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const userAddress = req.user!.address.toLowerCase();

      // Authorization: Only the patient themselves can access their dashboard
      if (address.toLowerCase() !== userAddress) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own dashboard'
        });
      }

      const summary = await getPatientDashboardSummary(address);
      
      if (!summary) {
        return res.status(404).json({
          error: 'Patient not found',
          message: 'No patient data found for this address'
        });
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching patient dashboard:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch patient dashboard'
      });
    }
  }
);

/**
 * GET /api/indexer/patient/:address/records
 * Get paginated list of patient's medical records with filtering
 */
router.get(
  '/patient/:address/records',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
    query: paginationSchema.merge(filterSchema),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const userAddress = req.user!.address.toLowerCase();
      const userRole = req.user!.role;

      // Authorization check
      if (userRole === 'patient' && address.toLowerCase() !== userAddress) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patients can only access their own records'
        });
      }

      // TODO: For providers, check if they have access to this patient's records
      // This would require checking the indexedAccessGrants table

      type CombinedQuery = z.infer<typeof paginationSchema> & z.infer<typeof filterSchema>;
      const { page, limit, sortBy, sortOrder, ...filterCriteria } = req.query as unknown as CombinedQuery;
      
      const pagination: PaginationOptions = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      const result = await getPatientPastRecords(
        address,
        filterCriteria as FilterCriteria,
        pagination
      );

      res.json({
        success: true,
        data: result.records,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.totalCount / pagination.limit!),
        }
      });
    } catch (error) {
      console.error('Error fetching patient records:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch patient records'
      });
    }
  }
);

/**
 * GET /api/indexer/patient/:address/records/recent
 * Get patient's most recent uploads
 */
router.get(
  '/patient/:address/records/recent',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
    query: z.object({
      count: z.coerce.number().int().min(1).max(50).optional().default(10),
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const { count } = req.query as unknown as { count: number };
      const userAddress = req.user!.address.toLowerCase();
      const userRole = req.user!.role;

      // Authorization check
      if (userRole === 'patient' && address.toLowerCase() !== userAddress) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Patients can only access their own records'
        });
      }

      const records = await getPatientRecentUploads(address, count as number);

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      console.error('Error fetching patient recent uploads:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch recent uploads'
      });
    }
  }
);

/**
 * GET /api/indexer/patient/:address/access
 * Get list of providers who have access to patient's records
 */
router.get(
  '/patient/:address/access',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const userAddress = req.user!.address.toLowerCase();

      // Authorization: Only the patient themselves can view their access list
      if (address.toLowerCase() !== userAddress) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own access permissions'
        });
      }

      const accessList = await getPatientAccessList(address);

      res.json({
        success: true,
        data: accessList
      });
    } catch (error) {
      console.error('Error fetching patient access list:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch access list'
      });
    }
  }
);

/**
 * GET /api/indexer/provider/:address/patients/recent
 * Get patients who recently granted access to or interacted with a provider
 */
router.get(
  '/provider/:address/patients/recent',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
    query: z.object({
      count: z.coerce.number().int().min(1).max(100).optional().default(20),
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const { count } = req.query as unknown as { count: number };
      const userAddress = req.user!.address.toLowerCase();
      const userRole = req.user!.role;

      // Authorization: Only providers can access this endpoint
      if (userRole !== 'provider') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only providers can access patient lists'
        });
      }

      // Providers can only view their own patient list
      if (address.toLowerCase() !== userAddress) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own patient list'
        });
      }

      const patients = await getDoctorRecentPatients(address, count as number);

      res.json({
        success: true,
        data: patients
      });
    } catch (error) {
      console.error('Error fetching provider recent patients:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch recent patients'
      });
    }
  }
);

/**
 * GET /api/indexer/search/records
 * Search medical records across all accessible data
 */
router.get(
  '/search/records',
  authenticateToken,
  validateRequest({
    query: z.object({
      q: z.string().min(3, 'Search query must be at least 3 characters'),
    }).merge(paginationSchema),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { q: searchQuery, page, limit, sortBy, sortOrder } = req.query as unknown as ({ q: string } & z.infer<typeof paginationSchema>);
      const userAddress = req.user!.address.toLowerCase();
      const userRole = req.user!.role;

      const pagination: PaginationOptions = {
        page: page as number,
        limit: limit as number,
        sortBy,
        sortOrder,
      };

      let result;

      if (userRole === 'patient') {
        // Patients can only search their own records
        result = await getPatientPastRecords(
          userAddress,
          { searchQuery: searchQuery as string },
          pagination
        );
      } else if (userRole === 'provider') {
        // Providers can search across all records they have access to
        result = await searchMedicalRecords(
          searchQuery as string,
          userAddress,
          pagination
        );
      } else {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions to search records'
        });
      }

      res.json({
        success: true,
        data: result.records,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.totalCount / pagination.limit!),
        }
      });
    } catch (error) {
      console.error('Error searching medical records:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search medical records'
      });
    }
  }
);

/**
 * GET /api/indexer/stats
 * Get system-wide statistics (admin only)
 */
router.get(
  '/stats',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userRole = req.user!.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can view system statistics'
        });
      }

      // TODO: Implement system-wide statistics
      // This could include:
      // - Total patients/providers registered
      // - Total records uploaded
      // - Active access grants
      // - Search activity
      // - IPFS cache statistics

      res.json({
        success: true,
        data: {
          message: 'System statistics endpoint - to be implemented',
          totalPatients: 0,
          totalProviders: 0,
          totalRecords: 0,
          activeGrants: 0,
        }
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch system statistics'
      });
    }
  }
);

/**
 * POST /api/indexer/refresh/:address
 * Manually trigger IPFS metadata refresh for a patient (admin only)
 */
router.post(
  '/refresh/:address',
  authenticateToken,
  validateRequest({
    params: z.object({
      address: ethAddressSchema,
    }),
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { address } = req.params;
      const userRole = req.user!.role;

      if (userRole !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only administrators can trigger metadata refresh'
        });
      }

      // TODO: Trigger IPFS metadata refresh for the specified patient
      // This would involve:
      // 1. Getting all records for the patient
      // 2. Re-fetching IPFS metadata
      // 3. Updating the indexed data

      res.json({
        success: true,
        message: `Metadata refresh triggered for patient ${address}`,
        data: {
          patientAddress: address,
          status: 'queued'
        }
      });
    } catch (error) {
      console.error('Error triggering metadata refresh:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to trigger metadata refresh'
      });
    }
  }
);

export default router;