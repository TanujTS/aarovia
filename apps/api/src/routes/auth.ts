import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

const router = Router();

// Middleware to verify wallet signature
async function verifySignature(address: string, signature: string, message: string): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
}

// Generate authentication challenge
router.post('/challenge', (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }
    
    // Generate a unique challenge message
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2);
    const message = `Sign this message to authenticate with Medical Records DApp.\n\nTimestamp: ${timestamp}\nNonce: ${nonce}\nAddress: ${address}`;
    
    res.json({
      message,
      timestamp,
      nonce
    });
  } catch (error) {
    console.error('Challenge generation error:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

// Verify signature and issue JWT
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, message, timestamp } = req.body;
    
    if (!address || !signature || !message || !timestamp) {
      return res.status(400).json({ error: 'Address, signature, message, and timestamp required' });
    }
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Check if timestamp is recent (within 5 minutes)
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Challenge expired' });
    }
    
    // Verify the signature
    const isValid = await verifySignature(address, signature, message);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        address: address.toLowerCase(),
        timestamp: now
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      address: address.toLowerCase(),
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify JWT token middleware
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Get current user info
router.get('/me', authenticateToken, (req: any, res) => {
  res.json({
    address: req.user.address,
    timestamp: req.user.timestamp
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

export default router;