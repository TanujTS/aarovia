import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const providerRegistrationSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  type: z.enum(['hospital', 'clinic', 'laboratory', 'pharmacy', 'individual']),
  licenseNumber: z.string().min(1, 'License number is required'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    website: z.string().url().optional()
  }),
  specialties: z.array(z.string()).optional(),
  verificationDocuments: z.array(z.string()).optional()
});

// Register as healthcare provider
router.post('/register', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const providerData = providerRegistrationSchema.parse(req.body);
    const userId = req.user!.id;

    // TODO: Store in database with pending verification status
    const newProvider = {
      id: `provider_${Date.now()}`,
      userId,
      ...providerData,
      status: 'pending_verification',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: newProvider,
      message: 'Provider registration submitted for verification'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
});

// Get provider profile
router.get('/profile', authenticateToken, requireRole(['provider']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // TODO: Fetch from database
    const mockProvider = {
      id: 'provider_1',
      userId,
      name: 'City Medical Center',
      type: 'hospital',
      licenseNumber: 'LIC123456',
      status: 'verified',
      address: {
        street: '123 Medical Drive',
        city: 'Healthcare City',
        state: 'HC',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        phone: '+1-555-0123',
        email: 'contact@citymedical.com',
        website: 'https://citymedical.com'
      },
      specialties: ['Cardiology', 'Neurology'],
      verifiedAt: new Date(),
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: mockProvider
    });
  } catch (error) {
    next(error);
  }
});

// Get patients who have shared records with this provider
router.get('/patients', authenticateToken, requireRole(['provider']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const providerId = req.user!.id; // Assuming user ID maps to provider ID

    // TODO: Fetch from database based on sharing permissions
    const mockPatients = [
      {
        id: 'patient_1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        sharedRecords: 3,
        lastAccessed: new Date(),
        permissions: ['read'],
        expiresAt: null
      },
      {
        id: 'patient_2',
        firstName: 'Jane',
        lastName: 'Smith', 
        dateOfBirth: '1985-05-15',
        sharedRecords: 1,
        lastAccessed: new Date(),
        permissions: ['read'],
        expiresAt: new Date('2024-12-31')
      }
    ];

    res.json({
      success: true,
      data: mockPatients
    });
  } catch (error) {
    next(error);
  }
});

// Request access to patient records
router.post('/request-access', authenticateToken, requireRole(['provider']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { patientId, reason, recordTypes, duration } = req.body;
    const providerId = req.user!.id;

    // TODO: Create access request in database
    // TODO: Send notification to patient
    const accessRequest = {
      id: `request_${Date.now()}`,
      providerId,
      patientId,
      reason,
      recordTypes: recordTypes || ['all'],
      duration: duration || '7d',
      status: 'pending',
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: accessRequest,
      message: 'Access request sent to patient'
    });
  } catch (error) {
    next(error);
  }
});

// Get accessible patient records
router.get('/records/:patientId', authenticateToken, requireRole(['provider']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { patientId } = req.params;
    const providerId = req.user!.id;

    // TODO: Check if provider has permission to access this patient's records
    // TODO: Fetch records from database

    const mockRecords = [
      {
        id: 'record_1',
        title: 'Blood Test Results',
        category: 'lab-report',
        date: '2024-01-15',
        ipfsHash: 'QmXYZ123',
        sharedAt: new Date(),
        permissions: ['read']
      }
    ];

    res.json({
      success: true,
      data: mockRecords
    });
  } catch (error) {
    next(error);
  }
});

// Search for providers (public endpoint)
router.get('/search', async (req, res, next) => {
  try {
    const { query, type, specialty, city } = req.query;

    // TODO: Search providers in database
    const mockProviders = [
      {
        id: 'provider_1',
        name: 'City Medical Center',
        type: 'hospital',
        specialties: ['Cardiology', 'Neurology'],
        city: 'Healthcare City',
        rating: 4.8,
        verified: true
      },
      {
        id: 'provider_2',
        name: 'Metro Lab Services',
        type: 'laboratory',
        specialties: ['Pathology', 'Radiology'],
        city: 'Healthcare City',
        rating: 4.6,
        verified: true
      }
    ];

    res.json({
      success: true,
      data: mockProviders
    });
  } catch (error) {
    next(error);
  }
});

export { router as providerRoutes };
