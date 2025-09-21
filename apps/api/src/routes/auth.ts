import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
// import { db } from '@medical-records/database';
// import { users } from '@medical-records/database/schema';
import { createError } from '../middleware/errorHandler';

const router = Router();

const loginSchema = z.object({
  address: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required')
});

const registerSchema = z.object({
  address: z.string().min(1, 'Wallet address is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['patient', 'provider']),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional()
  })
});

// Wallet-based authentication
router.post('/login', async (req, res, next) => {
  try {
    const { address, signature, message } = loginSchema.parse(req.body);

    // TODO: Verify signature with ethers.js
    // const isValidSignature = await verifySignature(address, message, signature);
    // if (!isValidSignature) {
    //   return next(createError('Invalid signature', 401));
    // }

    // TODO: Find user in database
    // const user = await db.select().from(users).where(eq(users.address, address));
    // if (!user.length) {
    //   return next(createError('User not found', 404));
    // }

    // Mock user for now
    const user = {
      id: '1',
      address,
      role: 'patient',
      email: 'user@example.com'
    };

    const jwtSecret = process.env.JWT_SECRET || 'aarovia-dev-fallback-secret-2025';
    
    const token = jwt.sign(
      { 
        id: user.id, 
        address: user.address, 
        role: user.role 
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
});

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const userData = registerSchema.parse(req.body);

    // TODO: Check if user already exists
    // const existingUser = await db.select().from(users)
    //   .where(eq(users.address, userData.address));
    
    // if (existingUser.length > 0) {
    //   return next(createError('User already exists', 409));
    // }

    // TODO: Create user in database
    // const newUser = await db.insert(users).values({
    //   ...userData,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // }).returning();

    const newUser = {
      id: '1',
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const token = jwt.sign(
      { 
        id: newUser.id, 
        address: newUser.address, 
        role: newUser.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createError(error.errors[0].message, 400));
    }
    next(error);
  }
});

// Get nonce for wallet signature
router.get('/nonce/:address', async (req, res, next) => {
  try {
    const { address } = req.params;
    
    // Generate a unique nonce for signature verification
    const nonce = `Please sign this message to authenticate: ${Date.now()}`;
    
    res.json({
      success: true,
      data: { nonce }
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
