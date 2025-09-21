#!/bin/bash

echo "🚀 Testing Fully Decentralized Medical Records Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((TESTS_FAILED++))
}

# Check if database package was removed
print_test "Checking if database package was removed"
if [ ! -d "packages/database" ]; then
    print_success "Database package successfully removed"
else
    print_error "Database package still exists"
fi

# Check if packages structure is correct
print_test "Verifying packages structure"
if [ -d "packages/config" ] && [ -d "packages/types" ] && [ -d "packages/web3" ]; then
    print_success "Core packages (config, types, web3) are present"
else
    print_error "Missing core packages"
fi

# Check smart contract
print_test "Verifying smart contract structure"
if [ -f "packages/web3/contracts/MedicalRecords.sol" ]; then
    # Check if contract has UserProfile struct
    if grep -q "struct UserProfile" packages/web3/contracts/MedicalRecords.sol; then
        print_success "Smart contract has UserProfile struct"
    else
        print_error "Smart contract missing UserProfile struct"
    fi
    
    # Check if contract has registerUser function
    if grep -q "function registerUser" packages/web3/contracts/MedicalRecords.sol; then
        print_success "Smart contract has registerUser function"
    else
        print_error "Smart contract missing registerUser function"
    fi
else
    print_error "Smart contract file not found"
fi

# Check API authentication routes
print_test "Verifying API authentication"
if [ -f "apps/api/src/routes/auth.ts" ]; then
    # Check for wallet-based auth
    if grep -q "verifySignature" apps/api/src/routes/auth.ts; then
        print_success "API has wallet signature verification"
    else
        print_error "API missing wallet signature verification"
    fi
    
    # Check for challenge endpoint
    if grep -q "/challenge" apps/api/src/routes/auth.ts; then
        print_success "API has challenge endpoint"
    else
        print_error "API missing challenge endpoint"
    fi
else
    print_error "Auth routes file not found"
fi

# Check records routes
print_test "Verifying records API"
if [ -f "apps/api/src/routes/records.ts" ]; then
    # Check for contract integration
    if grep -q "contract" apps/api/src/routes/records.ts; then
        print_success "Records API integrates with smart contract"
    else
        print_error "Records API missing smart contract integration"
    fi
else
    print_error "Records routes file not found"
fi

# Check frontend login page
print_test "Verifying frontend wallet integration"
if [ -f "apps/web/src/app/login/page.tsx" ]; then
    # Check for MetaMask integration
    if grep -q "window.ethereum" apps/web/src/app/login/page.tsx; then
        print_success "Frontend has MetaMask integration"
    else
        print_error "Frontend missing MetaMask integration"
    fi
    
    # Check for signature authentication
    if grep -q "personal_sign" apps/web/src/app/login/page.tsx; then
        print_success "Frontend has signature authentication"
    else
        print_error "Frontend missing signature authentication"
    fi
else
    print_error "Login page not found"
fi

# Check package.json for workspace cleanup
print_test "Verifying workspace configuration"
if [ -f "package.json" ]; then
    # Check if database workspace is removed
    if ! grep -q '"packages/database"' package.json; then
        print_success "Database workspace removed from package.json"
    else
        print_error "Database workspace still in package.json"
    fi
else
    print_error "Root package.json not found"
fi

# Check environment configuration
print_test "Verifying environment configuration"
if [ -f ".env" ]; then
    # Check if database variables are removed
    if ! grep -q "DATABASE_URL" .env; then
        print_success "Database environment variables removed"
    else
        print_error "Database environment variables still present"
    fi
    
    # Check for Web3 variables
    if grep -q "POLYGON_RPC_URL" .env; then
        print_success "Web3 environment variables present"
    else
        print_error "Web3 environment variables missing"
    fi
else
    print_error ".env file not found"
fi

# Test TypeScript compilation
print_test "Testing TypeScript compilation"
echo "Building API..."
cd apps/api
if npm run build > /dev/null 2>&1; then
    print_success "API TypeScript compilation successful"
else
    print_error "API TypeScript compilation failed"
fi
cd ../..

echo "Building Web..."
cd apps/web
if npm run build > /dev/null 2>&1; then
    print_success "Web TypeScript compilation successful"
else
    print_error "Web TypeScript compilation failed"
fi
cd ../..

echo "Building Web3 package..."
cd packages/web3
if npm run build > /dev/null 2>&1; then
    print_success "Web3 package compilation successful"
else
    print_error "Web3 package compilation failed"
fi
cd ../..

# Test smart contract compilation
print_test "Testing smart contract compilation"
cd packages/web3
if npx hardhat compile > /dev/null 2>&1; then
    print_success "Smart contract compilation successful"
else
    print_error "Smart contract compilation failed"
fi
cd ../..

# Summary
echo ""
echo "=================================================="
echo "🔍 TEST SUMMARY"
echo "=================================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "✅ Database successfully removed"
    echo "✅ Wallet-based authentication implemented"
    echo "✅ Smart contract expanded with user management"
    echo "✅ API routes updated for blockchain integration"
    echo "✅ Frontend MetaMask integration complete"
    echo "✅ TypeScript compilation successful"
    echo ""
    echo "🚀 Your medical records platform is now fully decentralized!"
    echo "📋 Next steps:"
    echo "   1. Deploy smart contract to Polygon Mumbai testnet"
    echo "   2. Update contract address in environment variables"
    echo "   3. Test the complete user flow"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please review the failed tests above and fix the issues."
    exit 1
fi
