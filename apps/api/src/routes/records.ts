import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/dicom'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const createRecordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['lab-report', 'imaging', 'prescription', 'consultation', 'other']),
  date: z.string(),
  providerId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Upload medical record
router.post('/upload', 
  authenticateToken, 
  requireRole(['patient', 'provider']), 
  upload.single('file'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        return next(createError('File is required', 400));
      }

      const recordData = createRecordSchema.parse(req.body);
      const userId = req.user!.id;

      // TODO: 
      // 1. Encrypt file
      // 2. Upload to IPFS/Filecoin
      // 3. Store hash and metadata on blockchain
      // 4. Save record info to database

      const mockRecord = {
        id: `record_${Date.now()}`,
        userId,
        ...recordData,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileMimeType: req.file.mimetype,
        ipfsHash: `Qm${Math.random().toString(36).substring(2)}`, // Mock IPFS hash
        blockchainTxHash: `0x${Math.random().toString(16).substring(2)}`, // Mock tx hash
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.status(201).json({
        success: true,
        data: mockRecord
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(createError(error.errors[0].message, 400));
      }
      next(error);
    }
  }
);

// Get patient's medical records
router.get('/', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { category, page = 1, limit = 10 } = req.query;

    // TODO: Fetch from database with pagination and filtering
    const mockRecords = [
      {
        id: 'record_1',
        title: 'Blood Test Results',
        description: 'Complete Blood Count',
        category: 'lab-report',
        date: '2024-01-15',
        fileName: 'blood-test-jan-2024.pdf',
        fileSize: 524288,
        ipfsHash: 'QmXYZ123',
        createdAt: new Date('2024-01-15'),
        provider: {
          name: 'City Medical Lab'
        }
      },
      {
        id: 'record_2', 
        title: 'Chest X-Ray',
        description: 'Routine chest examination',
        category: 'imaging',
        date: '2024-01-10',
        fileName: 'chest-xray.jpg',
        fileSize: 2097152,
        ipfsHash: 'QmABC456',
        createdAt: new Date('2024-01-10'),
        provider: {
          name: 'General Hospital'
        }
      }
    ];

    res.json({
      success: true,
      data: {
        records: mockRecords,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockRecords.length,
          totalPages: Math.ceil(mockRecords.length / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific medical record
router.get('/:recordId', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { recordId } = req.params;
    const userId = req.user!.id;

    // TODO: Check permissions and fetch from database
    const mockRecord = {
      id: recordId,
      title: 'Blood Test Results',
      description: 'Complete Blood Count',
      category: 'lab-report',
      date: '2024-01-15',
      fileName: 'blood-test-jan-2024.pdf',
      fileSize: 524288,
      ipfsHash: 'QmXYZ123',
      downloadUrl: `https://ipfs.io/ipfs/QmXYZ123`,
      createdAt: new Date('2024-01-15'),
      provider: {
        name: 'City Medical Lab',
        id: 'provider_1'
      },
      sharedWith: []
    };

    res.json({
      success: true,
      data: mockRecord
    });
  } catch (error) {
    next(error);
  }
});

// Share record with provider
router.post('/:recordId/share', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { recordId } = req.params;
    const { providerId, expiresAt, permissions } = req.body;

    // TODO: Create sharing smart contract or database entry
    const shareData = {
      id: `share_${Date.now()}`,
      recordId,
      providerId,
      patientId: req.user!.id,
      permissions: permissions || ['read'],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      data: shareData
    });
  } catch (error) {
    next(error);
  }
});

// Revoke record sharing
router.delete('/:recordId/share/:shareId', authenticateToken, requireRole(['patient']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { recordId, shareId } = req.params;

    // TODO: Revoke sharing permissions in smart contract or database
    
    res.json({
      success: true,
      message: 'Sharing permissions revoked'
    });
  } catch (error) {
    next(error);
  }
});

export { router as recordRoutes };
