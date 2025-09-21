# 🏥 Decentralized Medical Records Platform (MedChain)

A revolutionary blockchain-powered platform for secure, patient-controlled medical record management built with modern technologies.

## 🏗️ Project Structure

This is a [Turborepo](https://turbo.build/repo) monorepo with the following structure:

```
devjams/
├── apps/
│   ├── web/              # Next.js 14 frontend (Patient/Doctor dashboard)
│   │   ├── src/app/      # App router pages
│   │   ├── src/components/ # React components
│   │   └── src/styles/   # Global styles
│   └── api/              # Express.js API server
│       ├── src/routes/   # API endpoints
│       ├── src/middleware/ # Auth, validation, etc.
│       └── src/index.ts  # Server entry point
├── packages/
│   ├── database/         # Drizzle ORM schemas and migrations
│   │   ├── src/schema/   # Database tables and relations
│   │   └── drizzle.config.ts # Drizzle configuration
│   ├── web3/             # Blockchain integration utilities
│   │   ├── src/wallet.ts # Wallet operations
│   │   ├── src/contracts.ts # Smart contract interactions
│   │   └── src/ipfs.ts   # IPFS file storage
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── .env.example          # Environment variables template
├── setup.sh              # Automated setup script
└── turbo.json            # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL** - Local installation or [Neon DB](https://neon.tech/) cloud database
- **Git** - For version control

### Automated Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd devjams

# Run the automated setup script
./setup.sh
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
