# Aarovia Off-chain Indexing System

A comprehensive off-chain indexing solution for the Aarovia medical records platform that provides fast querying capabilities for blockchain data with IPFS metadata hydration.

## Overview

The indexing system addresses the challenge of slow and expensive blockchain queries by:

- **Event Listening**: Monitors all smart contract events in real-time
- **Data Indexing**: Stores structured data in PostgreSQL for fast queries
- **IPFS Integration**: Caches and hydrates metadata from IPFS
- **Search Functionality**: Provides full-text search across medical records
- **API Endpoints**: RESTful interface for frontend applications

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Blockchain    │    │      IPFS       │    │   PostgreSQL    │
│   (Events)      │    │   (Metadata)    │    │   (Indexed)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Off-chain Indexing System                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  Event Listener │  IPFS Service   │    Indexer Functions        │
│                 │                 │                             │
│ • PatientReg    │ • Metadata      │ • getPatientDashboard       │
│ • ProviderReg   │   Fetching      │ • getPatientRecords         │
│ • RecordUpload  │ • Caching       │ • getDoctorPatients         │
│ • AccessGrant   │ • Search Index  │ • searchRecords             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   REST API      │
                    │   Endpoints     │
                    └─────────────────┘
```

## Components

### 1. Database Schema (`indexing-tables.ts`)

**Core Tables:**
- `blockchain_events` - Raw event storage with processing status
- `indexed_patients` - Patient profiles with aggregated stats
- `indexed_providers` - Provider information and metrics
- `indexed_medical_records` - Medical records with searchable content
- `indexed_access_grants` - Access permissions and history
- `ipfs_metadata_cache` - IPFS content caching
- `search_index` - Full-text search optimization

### 2. Event Listener Service (`eventListener.ts`)

**Features:**
- Monitors all smart contract events
- Handles connection failures and retries
- Processes events in batches
- Updates aggregated statistics
- Supports multiple contract types

**Supported Events:**
- `PatientRegistered` - New patient registration
- `ProviderRegistered` - New provider registration  
- `RecordUploaded` - Medical record creation
- `AccessGranted/Revoked` - Permission changes
- `GeneralAccessGranted/Revoked` - Broad access changes

### 3. IPFS Service (`ipfsService.ts`)

**Capabilities:**
- Fetches metadata from IPFS gateways
- Implements caching with TTL
- Batch processing for efficiency
- Retry logic for reliability
- Text extraction for search indexing

**Cache Management:**
- Configurable expiry times
- Access tracking and statistics
- Automatic cleanup of expired entries

### 4. Core Indexer Functions (`indexerService.ts`)

**Patient Functions:**
- `getPatientDashboardSummary()` - Complete patient overview
- `getPatientPastRecords()` - Filtered and paginated records
- `getPatientRecentUploads()` - Latest medical records
- `getPatientAccessList()` - Providers with access

**Provider Functions:**
- `getDoctorRecentPatients()` - Recent patient interactions
- `searchMedicalRecords()` - Cross-patient search (with permissions)

**Search Features:**
- Full-text search across record content
- Category and date filtering
- Provider-specific access control
- Pagination and sorting

### 5. REST API Endpoints (`indexer-simple.ts`)

**Patient Endpoints:**
```
GET /api/indexer/patient/:address/dashboard
GET /api/indexer/patient/:address/records
GET /api/indexer/patient/:address/access
```

**Provider Endpoints:**
```
GET /api/indexer/provider/:address/patients
```

**Search Endpoints:**
```
GET /api/indexer/search?q=query&page=1&limit=20
```

**System Endpoints:**
```
GET /api/indexer/status
```

### 6. Service Manager (`indexingManager.ts`)

**Responsibilities:**
- Coordinates all indexing services
- Manages service lifecycle
- Handles batch processing
- Provides system monitoring
- Implements cleanup routines

## Configuration

### Environment Variables

```bash
# Blockchain Configuration
RPC_URL=http://localhost:8545
PATIENT_REGISTRY_CONTRACT=0x...
PROVIDER_REGISTRY_CONTRACT=0x...
MEDICAL_RECORDS_CONTRACT=0x...
ACCESS_CONTROL_CONTRACT=0x...
START_BLOCK=0

# IPFS Configuration
IPFS_GATEWAY_URL=https://ipfs.io
IPFS_TIMEOUT=30000
IPFS_RETRY_ATTEMPTS=3
IPFS_CACHE_EXPIRY=24

# Processing Configuration
EVENT_BATCH_SIZE=1000
POLL_INTERVAL=30000
PROCESS_INTERVAL=60000
HYDRATION_BATCH_SIZE=50

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aarovia
```

## Usage

### Starting the Indexing System

```typescript
import { initializeIndexing } from './indexing';

// Start the complete indexing system
await initializeIndexing();
```

### Using Individual Services

```typescript
import { 
  getPatientDashboardSummary,
  getDoctorRecentPatients 
} from './services/indexerService';

// Get patient dashboard
const dashboard = await getPatientDashboardSummary('0x...');

// Get provider's recent patients
const patients = await getDoctorRecentPatients('0x...', 10);
```

### API Usage Examples

```bash
# Get patient dashboard
curl "http://localhost:3002/api/indexer/patient/0x.../dashboard"

# Search records
curl "http://localhost:3002/api/indexer/search?q=diabetes&page=1&limit=10"

# Get system status
curl "http://localhost:3002/api/indexer/status"
```

## Database Migrations

1. Add the indexing tables to your database:
```sql
-- Run the migrations from the database package
npm run db:migrate
```

2. The indexing tables will be created automatically when the service starts.

## Performance Considerations

### Indexing Strategy
- **Real-time Events**: New events processed immediately
- **Batch Hydration**: IPFS metadata fetched in batches
- **Caching**: Aggressive caching of IPFS content
- **Pagination**: All list endpoints support pagination

### Database Optimization
- **Indexes**: Strategic indexes on frequently queried fields
- **Aggregation**: Pre-computed statistics reduce query complexity
- **Full-text Search**: PostgreSQL tsvector for efficient search

### Scaling
- **Horizontal**: Multiple indexer instances can process different contracts
- **Vertical**: Increase batch sizes and polling intervals
- **Caching**: Redis can replace in-database caching for higher throughput

## Monitoring

The system provides comprehensive monitoring:

- **Service Status**: Health checks and uptime monitoring
- **Processing Stats**: Event processing rates and queue sizes  
- **Cache Metrics**: Hit rates and storage usage
- **Error Tracking**: Failed events and retry attempts

## Security

- **Access Control**: API endpoints respect user roles and permissions
- **Rate Limiting**: Prevents abuse of search and query endpoints
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Sensitive information is never exposed in errors

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live dashboard updates
2. **Advanced Search**: Machine learning-powered search and recommendations
3. **Analytics**: Detailed usage analytics and reporting
4. **Multi-chain**: Support for multiple blockchain networks
5. **Decentralized IPFS**: Direct IPFS node integration instead of gateways

## Troubleshooting

### Common Issues

**Service Won't Start:**
- Check database connection
- Verify contract addresses and ABIs
- Ensure RPC endpoint is accessible

**Missing Data:**
- Check if events are being processed (`blockchain_events` table)
- Verify IPFS gateway accessibility
- Review processing logs for errors

**Slow Queries:**
- Check database indexes
- Monitor IPFS response times
- Consider increasing cache expiry times

**High Memory Usage:**
- Reduce batch sizes
- Increase processing intervals
- Enable cache cleanup more frequently

For detailed logs and debugging, set the log level to debug and monitor the console output during operation.