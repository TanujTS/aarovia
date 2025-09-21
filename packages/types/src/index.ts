// User and Authentication Types
export interface User {
  id: string;
  address: string;
  email: string;
  role: 'patient' | 'provider' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

// Patient Types
export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  iceMode?: {
    enabled: boolean;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    medications?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Provider Types
export interface Provider {
  id: string;
  userId: string;
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'individual';
  licenseNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  specialties?: string[];
  verificationDocuments?: string[];
  status: 'pending_verification' | 'verified' | 'suspended';
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Medical Record Types
export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId?: string;
  title: string;
  description?: string;
  category: 'lab-report' | 'imaging' | 'prescription' | 'consultation' | 'other';
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  ipfsHash: string;
  blockchainTxHash?: string;
  recordDate: Date;
  tags?: string[];
  encryptionKey: string;
  createdAt: Date;
  updatedAt: Date;
  provider?: {
    name: string;
    id: string;
  };
}

// Access Control Types
export interface AccessGrant {
  id: string;
  recordId: string;
  patientId: string;
  providerId: string;
  permissions: string[];
  expiresAt?: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  contractAddress?: string;
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessRequest {
  id: string;
  patientId: string;
  providerId: string;
  reason: string;
  recordTypes?: string[];
  requestedDuration?: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  responseMessage?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  message?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Web3 and Blockchain Types
export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  transactions: Transaction[];
}

export interface Transaction {
  hash: string;
  type: string;
  amount: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface SmartContract {
  address: string;
  name: string;
  type: string;
  interactions: number;
  lastInteraction: Date;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  estimatedCost: string;
}

// File Upload Types
export interface FileUpload {
  file: File;
  title: string;
  description?: string;
  category: MedicalRecord['category'];
  date: string;
  providerId?: string;
  tags?: string[];
}

// Dashboard Stats Types
export interface PatientDashboardStats {
  totalRecords: number;
  recentUploads: number;
  activeShares: number;
  storageUsed: string;
  lastActivity: Date;
}

export interface ProviderDashboardStats {
  totalPatients: number;
  recentAccess: number;
  pendingRequests: number;
  recordsAccessed: number;
  lastActivity: Date;
}
