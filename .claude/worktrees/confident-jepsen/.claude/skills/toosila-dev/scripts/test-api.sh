#!/bin/bash
# Toosila API Testing Script
# Usage: ./test-api.sh [base_url] [token]

BASE_URL="${1:-http://localhost:5001/api}"
TOKEN="${2:-}"

echo "🧪 Toosila API Test Suite"
echo "========================="
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing: $description... "
    
    if [ -n "$TOKEN" ]; then
        AUTH_HEADER="-H \"Authorization: Bearer $TOKEN\""
    else
        AUTH_HEADER=""
    fi
    
    if [ "$method" == "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" -H "Content-Type: application/json" $AUTH_HEADER)
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" -H "Content-Type: application/json" $AUTH_HEADER -d "$data")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo -e "${GREEN}✓ $HTTP_CODE${NC}"
    elif [ "$HTTP_CODE" -ge 400 ] && [ "$HTTP_CODE" -lt 500 ]; then
        echo -e "${YELLOW}⚠ $HTTP_CODE${NC}"
    else
        echo -e "${RED}✗ $HTTP_CODE${NC}"
    fi
}

echo "📡 Health & Public Endpoints"
echo "----------------------------"
test_endpoint "GET" "/health" "" "Health check"

echo ""
echo "🔐 Auth Endpoints"
echo "-----------------"
test_endpoint "POST" "/auth/login" '{"phone":"+9647701234567"}' "Login request"

if [ -n "$TOKEN" ]; then
    echo ""
    echo "👤 Protected Endpoints (with token)"
    echo "------------------------------------"
    test_endpoint "GET" "/auth/me" "" "Get current user"
    test_endpoint "GET" "/offers" "" "List offers"
    test_endpoint "GET" "/demands" "" "List demands"
    test_endpoint "GET" "/bookings" "" "List bookings"
    test_endpoint "GET" "/messages/conversations" "" "List conversations"
    test_endpoint "GET" "/messages/unread-count" "" "Unread count"
else
    echo ""
    echo -e "${YELLOW}⚠ No token provided. Skipping protected endpoints.${NC}"
    echo "Usage: ./test-api.sh $BASE_URL YOUR_JWT_TOKEN"
fi

echo ""
echo "✅ Test complete!"
