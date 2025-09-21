#!/bin/bash

# Aarovia - Decentralized Medical Records Platform
# Setup script for Bun

set -e

echo "🏥 Aarovia - Decentralized Medical Records Platform Setup"
echo "=============================================="
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    echo "   OR"
    echo "   npm install -g bun"
    exit 1
fi

echo "✅ Bun $(bun --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create environment file
if [ ! -f .env.local ]; then
    echo "⚙️ Creating environment file..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local - Please update with your actual values"
    else
        echo "⚠️  .env.example not found, creating basic .env.local"
        cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/aarovia"

# API Configuration
API_PORT=3001
JWT_SECRET="your-jwt-secret-key"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Blockchain
NEXT_PUBLIC_CHAIN_ID="1"
NEXT_PUBLIC_RPC_URL="https://mainnet.infura.io/v3/your-key"

# IPFS
IPFS_GATEWAY_URL="https://gateway.pinata.cloud"
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_API_KEY="your-pinata-secret-key"
EOF
    fi
else
    echo "⚙️ Environment file already exists"
fi

# Build packages
echo "🔨 Building packages..."
bun run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with your database and API keys"
    echo "2. Set up your PostgreSQL database"
    echo "3. Deploy smart contracts (if using blockchain features)"
    echo "4. Run 'bun run dev' to start development servers"
    echo ""
    echo "Available commands:"
    echo "  bun run dev        - Start all development servers"
    echo "  bun run build      - Build all packages"
    echo "  bun run lint       - Lint all packages"
    echo "  bun run test       - Run tests"
    echo "  bun run db:generate - Generate database schemas"
    echo "  bun run db:push    - Push schemas to database"
    echo ""
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
