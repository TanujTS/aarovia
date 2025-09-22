import { Router } from 'express';
import {
  getPatientDashboardSummary,
  getPatientPastRecords,
  getPatientRecentUploads,
  getPatientAccessList,
  getDoctorRecentPatients,
  searchMedicalRecords,
} from '../services/indexerService';

/**
 * Simplified Indexer API Routes
 * Basic endpoints for testing the indexing functionality
 */

const router = Router();

/**
 * GET /api/indexer/patient/:address/dashboard
 * Get comprehensive dashboard summary for a patient
 */
router.get('/patient/:address/dashboard', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
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
});

/**
 * GET /api/indexer/patient/:address/records
 * Get paginated list of patient's medical records
 */
router.get('/patient/:address/records', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, category, dateFrom, dateTo, searchQuery } = req.query;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    const filterCriteria = {
      category: category as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      searchQuery: searchQuery as string,
    };

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: 'recordDate',
      sortOrder: 'desc' as const,
    };

    const result = await getPatientPastRecords(address, filterCriteria, pagination);

    res.json({
      success: true,
      data: result.records,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.totalCount / pagination.limit),
      }
    });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch patient records'
    });
  }
});

/**
 * GET /api/indexer/patient/:address/access
 * Get list of providers who have access to patient's records
 */
router.get('/patient/:address/access', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
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
});

/**
 * GET /api/indexer/provider/:address/patients
 * Get patients who recently interacted with a provider
 */
router.get('/provider/:address/patients', async (req, res) => {
  try {
    const { address } = req.params;
    const { count = 20 } = req.query;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid address',
        message: 'Please provide a valid Ethereum address'
      });
    }

    const patients = await getDoctorRecentPatients(address, parseInt(count as string));

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching provider patients:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recent patients'
    });
  }
});

/**
 * GET /api/indexer/search
 * Search medical records
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery, page = 1, limit = 20, providerAddress } = req.query;
    
    if (!searchQuery || (searchQuery as string).length < 3) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 3 characters long'
      });
    }

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await searchMedicalRecords(
      searchQuery as string,
      providerAddress as string,
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
        totalPages: Math.ceil(result.totalCount / pagination.limit),
      }
    });
  } catch (error) {
    console.error('Error searching medical records:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search medical records'
    });
  }
});

/**
 * GET /api/indexer/status
 * Get indexing system status
 */
router.get('/status', async (req, res) => {
  try {
    // Import the indexing service manager
    const { getIndexingService } = await import('../services/indexingManager');
    const indexingService = getIndexingService();
    
    if (!indexingService) {
      return res.json({
        success: true,
        data: {
          isRunning: false,
          message: 'Indexing service not initialized'
        }
      });
    }

    const status = await indexingService.getStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting indexing status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get indexing status'
    });
  }
});

export default router;