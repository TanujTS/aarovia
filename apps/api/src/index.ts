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
import indexerRoutes from './routes/indexer-simple';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());

// CORS configuration for development
const allowedOrigins = [
  'http://localhost:3000',      // Next.js app
  'http://localhost:3001',      // Next.js app (alternative port)
  'http://127.0.0.1:3000',     // Next.js app (alternative)
  'http://127.0.0.1:3001',     // Next.js app (alternative)
  'http://localhost:5500',      // Live Server
  'http://127.0.0.1:5500',     // Live Server (alternative)
  'http://localhost:8080',      // Other dev servers
  'http://127.0.0.1:8080',     // Other dev servers (alternative)
  'file://',                    // Direct file access
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(morgan('combined'));


app.use(rateLimitMiddleware);


app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'medical-records-api'
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/web3', web3Routes);
app.use('/api/indexer', indexerRoutes);

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
