import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relation: z.string()
  }).optional(),
  iceMode: z.object({
    enabled: z.boolean(),
    bloodType: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    chronicConditions: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional()
  }).optional()
});

// Get patient profile
router.get('/profile', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // TODO: Fetch from database
    // const patient = await db.select().from(patients).where(eq(patients.userId, userId));
    
    const mockProfile = {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: req.user!.address,
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1234567891',
        relation: 'Spouse'
      },
      iceMode: {
        enabled: true,
        bloodType: 'O+',
        allergies: ['Penicillin'],
        chronicConditions: ['Hypertension'],
        medications: ['Lisinopril 10mg']
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: mockProfile
    });
  } catch (error) {
    next(error);
  }
});

// Update patient profile
router.put('/profile', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const profileData = updateProfileSchema.parse(req.body);

    // TODO: Update in database
    // const updatedProfile = await db.update(patients)
    //   .set({ ...profileData, updatedAt: new Date() })
    //   .where(eq(patients.userId, userId))
    //   .returning();

    const updatedProfile = {
      id: userId,
      ...profileData,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
});

// Get ICE (In Case of Emergency) information
router.get('/ice/:patientId', async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // TODO: Fetch ICE data from database
    // Only return if ICE mode is enabled
    const iceData = {
      patientId,
      bloodType: 'O+',
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
      medications: ['Lisinopril 10mg'],
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1234567891',
        relation: 'Spouse'
      }
    };

    res.json({
      success: true,
      data: iceData
    });
  } catch (error) {
    next(error);
  }
});

// Get patient dashboard stats
router.get('/dashboard', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // TODO: Calculate real stats from database
    const stats = {
      totalRecords: 12,
      recentUploads: 3,
      activeShares: 2,
      storageUsed: '45.2 MB',
      lastActivity: new Date()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export { router as patientRoutes };
