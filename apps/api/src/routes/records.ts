import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ethers } from 'ethers';
import { authenticateToken } from './auth';
import { uploadToIPFS } from '@aarovia/web3';

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
      'text/plain',
      'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Smart contract connection
const getContract = () => {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
  const contractAddress = process.env.NEXT_PUBLIC_MEDICAL_RECORDS_CONTRACT;
  
  if (!contractAddress) {
    throw new Error('Medical records contract address not configured');
  }

  // Contract ABI (key functions only)
  const abi = [
    "function addRecord(string memory _title, string memory _description, string memory _category, string memory _ipfsHash, string memory _encryptedKey, string[] memory _tags) external",
    "function getUserRecords(address _user) external view returns (uint256[] memory)",
    "function getRecord(uint256 _recordId) external view returns (tuple(uint256 id, address owner, string title, string description, string category, string ipfsHash, string encryptedKey, uint256 createdAt, uint256 updatedAt, bool isActive, string[] tags))",
    "function grantAccess(uint256 _recordId, address _grantee, uint256 _expiresAt, string memory _encryptedKeyForGrantee) external",
    "function revokeAccess(uint256 _recordId, address _grantee) external",
    "function hasAccess(address _user, uint256 _recordId) external view returns (bool)",
    "function getGrantedRecords(address _user) external view returns (uint256[] memory)"
  ];

  return new ethers.Contract(contractAddress, abi, provider);
};

const createRecordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['lab-report', 'imaging', 'prescription', 'consultation', 'other']),
  encryptedKey: z.string().min(1, 'Encrypted key is required'),
  tags: z.array(z.string()).optional()
});

// Upload medical record
router.post('/upload', 
  authenticateToken, 
  upload.single('file'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const validation = createRecordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: validation.error.errors 
        });
      }

      const { title, description = '', category, encryptedKey, tags = [] } = validation.data;

      // Upload file to IPFS
      const ipfsHash = await uploadToIPFS(req.file.buffer);

      // Get contract with user's signer
      const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
      const privateKey = process.env.PRIVATE_KEY;
      
      if (!privateKey) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const signer = new ethers.Wallet(privateKey, provider);
      const contract = getContract().connect(signer);

      // Add record to blockchain
      const tx = await (contract as any).addRecord(
        title,
        description,
        category,
        ipfsHash,
        encryptedKey,
        tags
      );

      const receipt = await tx.wait();

      res.json({
        success: true,
        ipfsHash,
        transactionHash: receipt.hash,
        message: 'Medical record uploaded successfully'
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        error: 'Failed to upload record',
        details: error.message 
      });
    }
  }
);

// Get user's medical records
router.get('/my-records', authenticateToken, async (req: any, res) => {
  try {
    const userAddress = req.user.address;
    const contract = getContract();

    // Get record IDs for user
    const recordIds = await contract.getUserRecords(userAddress);
    
    // Fetch all records
    const records = await Promise.all(
      recordIds.map(async (id: any) => {
        try {
          const record = await contract.getRecord(id);
          return {
            id: record.id.toString(),
            title: record.title,
            description: record.description,
            category: record.category,
            ipfsHash: record.ipfsHash,
            encryptedKey: record.encryptedKey,
            createdAt: new Date(Number(record.createdAt) * 1000).toISOString(),
            updatedAt: new Date(Number(record.updatedAt) * 1000).toISOString(),
            isActive: record.isActive,
            tags: record.tags
          };
        } catch (error) {
          console.error(`Error fetching record ${id}:`, error);
          return null;
        }
      })
    );

    const validRecords = records.filter(record => record !== null && record.isActive);

    res.json({
      records: validRecords,
      count: validRecords.length
    });

  } catch (error: any) {
    console.error('Fetch records error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch records',
      details: error.message 
    });
  }
});

// Grant access to a record
router.post('/:recordId/grant-access', authenticateToken, async (req: any, res) => {
  try {
    const { recordId } = req.params;
    const { granteeAddress, expiresAt, encryptedKeyForGrantee } = req.body;

    if (!granteeAddress || !expiresAt || !encryptedKeyForGrantee) {
      return res.status(400).json({ 
        error: 'Grantee address, expiration time, and encrypted key are required' 
      });
    }

    if (!ethers.isAddress(granteeAddress)) {
      return res.status(400).json({ error: 'Invalid grantee address' });
    }

    const expirationTimestamp = Math.floor(new Date(expiresAt).getTime() / 1000);
    if (expirationTimestamp <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ error: 'Expiration must be in the future' });
    }

    // Get contract with user's signer
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const signer = new ethers.Wallet(privateKey, provider);
    const contract = getContract().connect(signer);

    const tx = await (contract as any).grantAccess(
      recordId,
      granteeAddress,
      expirationTimestamp,
      encryptedKeyForGrantee
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.hash,
      message: 'Access granted successfully'
    });

  } catch (error: any) {
    console.error('Grant access error:', error);
    res.status(500).json({ 
      error: 'Failed to grant access',
      details: error.message 
    });
  }
});

export default router;
