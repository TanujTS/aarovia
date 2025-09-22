# 🚀 Aarovia

A revolutionary blockchain-powered platform for secure, decentralized data management built on Polygon with IPFS storage and end-to-end encryption.

## ✨ Key Features

- **🔐 End-to-End Encryption**: All files are encrypted client-side before upload
- **🌐 Decentralized Storage**: Files stored on IPFS with Web3.Storage
- **⛓️ Blockchain Security**: Access control managed via smart contracts on Polygon
- **👛 Custodial Wallets**: Seamless user experience with server-managed wallets
- **📧 Email/OTP Authentication**: No crypto knowledge required for users
- **🆘 Emergency Access**: ICE (In Case of Emergency) profiles for critical situations
- **🔄 Access Control**: Grant/revoke access to records with expiration dates
- **📱 Responsive Design**: Modern UI that works on all devices

## 🏗️ Project Structure

This is a [Turborepo](https://turbo.build/repo) monorepo with the following structure:

```
devjams/
├── apps/
│   ├── web/              # Next.js 14 frontend with TypeScript
│   │   ├── src/app/      # App router pages (login, dashboard, upload, ICE)
│   │   ├── src/components/ # UI components and layout
│   │   └── src/utils/    # Client-side utilities and encryption
│   └── api/              # Express.js API server
│       ├── src/routes/   # API endpoints (auth, patients, records, web3)
│       ├── src/middleware/ # Auth, rate limiting, error handling
│       └── src/services/ # Business logic and contract interactions
├── packages/
│   ├── database/         # Drizzle ORM with PostgreSQL
│   │   ├── src/schema/   # User accounts, records, access control
│   │   └── migrations/   # Database schema changes
│   ├── web3/             # Blockchain and smart contracts
│   │   ├── contracts/    # Solidity smart contracts
│   │   ├── src/          # Wallet operations, IPFS, contract interactions
│   │   └── ignition/     # Hardhat deployment scripts
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── .env.example          # Environment variables template
├── DEPLOYMENT.md         # Detailed deployment guide
├── test-integration.sh   # Integration testing script
└── turbo.json            # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **Bun** - [Install Bun](https://bun.sh/)
- **PostgreSQL** - Local installation or cloud database
- **Polygon Mumbai Testnet** - Get MATIC from [faucet](https://faucet.polygon.technology/)
- **Web3.Storage Account** - Sign up at [web3.storage](https://web3.storage/)

### Automated Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd devjams

# Run the integration test (this also validates setup)
./test-integration.sh
```

### Manual Setup

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your database URL and API keys

# Build all packages
bun run build

# Start development servers
bun run dev
```

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Ethereum, Solidity, Ethers.js v6
- **Storage**: IPFS/Filecoin for decentralized file storage
- **Styling**: TailwindCSS, Radix UI components
- **Monorepo**: Turborepo for build orchestration

### Key Features
- **🔐 Patient-Controlled Access**: Patients own and control their medical data
- **⛓️ Blockchain Security**: Immutable record hashes stored on-chain
- **📁 Decentralized Storage**: Medical files stored on IPFS/Filecoin
- **🚨 Emergency Access**: ICE mode for critical health information
- **🏥 Provider Integration**: APIs for healthcare providers to integrate
- **🔍 Audit Trail**: Complete history of data access and sharing

## 📋 Available Scripts

### Development
```bash
bun run dev          # Start all development servers
bun run build        # Build all packages and apps
bun run lint         # Lint all packages
bun run type-check   # TypeScript type checking
bun run test         # Run tests across all packages
bun run clean        # Clean all build artifacts
```

### Database Operations
```bash
bun run db:generate  # Generate database migrations
bun run db:push      # Push schema changes to database
bun run db:migrate   # Run pending migrations
```

## 🏥 User Roles & Workflows

### 👨‍⚕️ For Patients
1. **Onboarding**: Connect wallet, create profile
2. **Upload Records**: Encrypt and store medical documents on IPFS
3. **Share Access**: Grant temporary access to healthcare providers
4. **Emergency Mode**: Set up ICE profile for emergencies
5. **Manage Access**: View and revoke provider permissions

### 🏥 For Healthcare Providers
1. **Registration**: Submit credentials for verification
2. **Request Access**: Ask patients for record access
3. **View Records**: Access patient data with granted permissions
4. **Upload Results**: Add test results and reports (with consent)
5. **Integration**: Use APIs to connect existing systems

### 🔧 For Administrators
1. **Provider Verification**: Verify healthcare provider credentials
2. **System Monitoring**: Monitor platform usage and security
3. **Compliance**: Ensure HIPAA/GDPR compliance

## 🌐 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/medical_records"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
PORT=3001

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL="https://mainnet.infura.io/v3/your-infura-key"

# Smart Contract Addresses (deploy these first)
MEDICAL_RECORDS_ACCESS_CONTRACT="0x..."
MEDICAL_RECORDS_STORAGE_CONTRACT="0x..."

# IPFS Configuration
IPFS_API_URL="https://ipfs.infura.io:5001"
IPFS_GATEWAY_URL="https://ipfs.io/ipfs/"

# Pinata (for IPFS pinning)
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"

# Environment
NODE_ENV="development"
```

## � Deployment Guide

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Backend (Railway/Heroku)
1. Create new app on Railway or Heroku
2. Connect GitHub repository
3. Set environment variables
4. Deploy with auto-deployments enabled

### Database (Neon/Supabase)
1. Create PostgreSQL database on Neon or Supabase
2. Update `DATABASE_URL` in environment variables
3. Run migrations: `bun run db:push`

### Smart Contracts (Hardhat)
```bash
# Deploy to testnet first
npx hardhat deploy --network sepolia

# Deploy to mainnet
npx hardhat deploy --network mainnet
```

## 📱 Getting Started Walkthrough

### Patient Journey
1. **Connect Wallet**: Use MetaMask or WalletConnect
2. **Create Profile**: Fill in basic information and emergency contacts
3. **Upload First Record**: Add a medical document (PDF, image, etc.)
4. **Set ICE Mode**: Configure emergency access information
5. **Share with Doctor**: Grant access to a healthcare provider

### Provider Journey
1. **Register**: Submit license and verification documents
2. **Wait for Approval**: Admin reviews and verifies credentials
3. **Request Access**: Ask patient for record access
4. **View Records**: Access granted patient information
5. **Upload Results**: Add new medical records for patients

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run specific package tests
bun run test --filter=@aarovia/api
bun run test --filter=@aarovia/web

# Run with coverage
bun run test -- --coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
