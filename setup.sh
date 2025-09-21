#!/bin/bash

# Decentralized Medical Records Platform Setup Script

echo "🏥 Setting up Decentralized Medical Records Platform..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
cd packages/config && npm install && cd ../..
cd packages/types && npm install && cd ../..
cd packages/database && npm install && cd ../..
cd packages/web3 && npm install && cd ../..

# Create environment file
if [ ! -f .env.local ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please update with your actual values"
else
    echo "⚙️ Environment file already exists"
fi

# Build packages
echo "🔨 Building packages..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with your database and API keys"
    echo "2. Set up your PostgreSQL database"
    echo "3. Deploy smart contracts (if using blockchain features)"
    echo "4. Run 'npm run dev' to start development servers"
    echo ""
    echo "Available commands:"
    echo "  npm run dev        - Start all development servers"
    echo "  npm run build      - Build all packages"
    echo "  npm run lint       - Lint all packages"
    echo "  npm run test       - Run tests"
    echo "  npm run db:generate - Generate database schemas"
    echo "  npm run db:push    - Push schemas to database"
    echo ""
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
