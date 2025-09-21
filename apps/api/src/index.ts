import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { patientRoutes } from './routes/patients';
import { recordRoutes } from './routes/records';
import { providerRoutes } from './routes/providers';
import { web3Routes } from './routes/web3';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'medical-records-api'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/web3', web3Routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Medical Records API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
