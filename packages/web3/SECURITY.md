# Security Configuration Guide

This guide ensures all sensitive data is properly managed through environment variables with no hardcoded credentials.

## 🔐 Environment Variables Setup

### Required Variables

Create a `.env` file in the root directory with these variables:

```bash
# Pinata IPFS Configuration (REQUIRED)
PINATA_API_KEY="your-pinata-api-key-here"
PINATA_SECRET_KEY="your-pinata-secret-key-here"
PINATA_JWT="your-pinata-jwt-token-here"  # Optional but recommended

# Blockchain Configuration (REQUIRED for smart contract integration)
RPC_URL="https://your-rpc-url-here"                    # e.g., Optimism, Arbitrum
PRIVATE_KEY="your-private-key-here"                    # Wallet private key
CONTRACT_ADDRESS="your-medical-records-contract-address"

# Additional Contract Addresses (Optional)
PATIENT_REGISTRY_ADDRESS="your-patient-registry-address"
PROVIDER_REGISTRY_ADDRESS="your-provider-registry-address"

# Encryption (REQUIRED)
DEFAULT_ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Environment
NODE_ENV="development"
```

### Getting Your Credentials

#### 1. Pinata IPFS Credentials
1. Go to [https://pinata.cloud/](https://pinata.cloud/)
2. Create an account and verify your email
3. Go to **API Keys** section
4. Create a new API key with appropriate permissions
5. Copy the **API Key**, **Secret Key**, and **JWT Token**

#### 2. Blockchain RPC URL
- **Optimism**: `https://mainnet.optimism.io`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`
- **Ethereum**: `https://mainnet.infura.io/v3/YOUR-PROJECT-ID`
- **Base**: `https://mainnet.base.org`

#### 3. Private Key
⚠️ **NEVER commit your private key to version control!**

From MetaMask:
1. Open MetaMask
2. Click the account menu (3 dots)
3. Account Details → Export Private Key
4. Enter your password
5. Copy the private key (starts with `0x`)

#### 4. Contract Addresses
Deploy your smart contracts and note the addresses:
- MedicalRecords contract
- PatientRegistry contract  
- ProviderRegistry contract

## 🛡️ Security Best Practices

### 1. Environment File Security
```bash
# Add to .gitignore (already included)
.env
.env.local
.env.*.local

# Use different .env files for different environments
.env.development
.env.staging
.env.production
```

### 2. Key Rotation
- Rotate API keys monthly
- Generate new private keys for production
- Use different keys for development/staging/production

### 3. Access Control
```typescript
// Good: Environment variable validation
import { loadSecurityConfig } from './config/security-config.js';

try {
  const config = loadSecurityConfig();
  // Use config.pinata.apiKey, etc.
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}
```

```typescript
// Bad: Hardcoded credentials
const apiKey = '02cebf870a06149f9fef'; // ❌ NEVER do this
```

### 4. Production Deployment

#### Environment Variables on Vercel
```bash
vercel env add PINATA_API_KEY
vercel env add PINATA_SECRET_KEY  
vercel env add RPC_URL
# etc.
```

#### Environment Variables on Railway
```bash
railway variables set PINATA_API_KEY=your-key
railway variables set PINATA_SECRET_KEY=your-secret
# etc.
```

#### Docker Deployment
```dockerfile
# Use build-time args for non-sensitive config
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Use runtime environment variables for secrets
ENV PINATA_API_KEY=""
ENV PINATA_SECRET_KEY=""
ENV PRIVATE_KEY=""
```

## 🔍 Security Validation

Use the built-in security configuration utility:

```typescript
import { logEnvironmentStatus, loadSecurityConfig } from './config/security-config.js';

// Check environment status (safe - no secrets logged)
logEnvironmentStatus();

// Load and validate all configuration
try {
  const config = loadSecurityConfig();
  console.log('✅ All security configuration loaded successfully');
} catch (error) {
  console.error('❌ Security configuration error:', error.message);
}
```

## 🚨 Security Checklist

- [ ] No hardcoded API keys, private keys, or secrets in code
- [ ] All sensitive data loaded from environment variables
- [ ] `.env` files added to `.gitignore`
- [ ] Different credentials for development/staging/production
- [ ] Private keys are properly formatted (64 hex chars)
- [ ] Encryption keys are at least 32 characters
- [ ] RPC URLs are valid and accessible
- [ ] Contract addresses are deployed and verified
- [ ] Environment validation runs on application startup
- [ ] Error messages don't expose sensitive data

## 🔧 Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Missing required environment variables: PINATA_API_KEY, PRIVATE_KEY
   ```
   → Check your `.env` file exists and contains all required variables

2. **Invalid Private Key**
   ```
   Error: PRIVATE_KEY must be a valid Ethereum private key
   ```
   → Ensure private key is 64 hex characters, optionally prefixed with `0x`

3. **Short Encryption Key**
   ```
   Error: DEFAULT_ENCRYPTION_KEY must be at least 32 characters long
   ```
   → Generate a longer encryption key: `openssl rand -hex 32`

4. **Network Connection Issues**
   ```
   Error: Could not connect to RPC_URL
   ```
   → Verify your RPC URL is correct and accessible

### Generate Secure Keys

```bash
# Generate a secure encryption key
openssl rand -hex 32

# Generate a random UUID for development
uuidgen

# Generate a secure password
openssl rand -base64 32
```

## 📚 Additional Resources

- [Pinata API Documentation](https://docs.pinata.cloud/)
- [Ethereum Private Key Security](https://ethereum.org/en/developers/docs/accounts/#account-creation)
- [Environment Variables Best Practices](https://12factor.net/config)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)