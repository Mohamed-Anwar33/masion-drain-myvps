#!/bin/bash

# Maison Darin Deployment Testing Script
# Usage: ./test-deployment.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOMAIN="maisondarin.com"
API_BASE="https://${DOMAIN}/api"
ADMIN_EMAIL="admin@maisondarin.com"
ADMIN_PASSWORD="Admin123456#"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

echo -e "${BLUE}🧪 Starting comprehensive deployment tests for ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo ""

# Function to print test results
print_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $test_name${NC}"
        if [ -n "$details" ]; then
            echo -e "${RED}   Details: $details${NC}"
        fi
        FAILED_TESTS+=("$test_name")
        ((TESTS_FAILED++))
    fi
}

# Test 1: Basic connectivity
test_basic_connectivity() {
    echo -e "${YELLOW}Testing basic connectivity...${NC}"
    
    # Test main domain
    if curl -f -s -o /dev/null "https://${DOMAIN}"; then
        print_test_result "Main domain accessibility" "PASS"
    else
        print_test_result "Main domain accessibility" "FAIL" "Cannot reach https://${DOMAIN}"
    fi
    
    # Test www redirect
    if curl -f -s -o /dev/null "https://www.${DOMAIN}"; then
        print_test_result "WWW domain accessibility" "PASS"
    else
        print_test_result "WWW domain accessibility" "FAIL" "Cannot reach https://www.${DOMAIN}"
    fi
}

# Test 2: API Health
test_api_health() {
    echo -e "${YELLOW}Testing API health...${NC}"
    
    # Test API health endpoint
    response=$(curl -s "${API_BASE}/status/health" || echo "ERROR")
    if echo "$response" | grep -q "healthy\|OK"; then
        print_test_result "API health endpoint" "PASS"
    else
        print_test_result "API health endpoint" "FAIL" "Response: $response"
    fi
    
    # Test API base endpoint
    response=$(curl -s "${API_BASE}" || echo "ERROR")
    if echo "$response" | grep -q "Maison Darin API"; then
        print_test_result "API base endpoint" "PASS"
    else
        print_test_result "API base endpoint" "FAIL" "Response: $response"
    fi
}

# Test 3: Database connectivity
test_database() {
    echo -e "${YELLOW}Testing database connectivity...${NC}"
    
    # Test products endpoint (should work without auth)
    response=$(curl -s "${API_BASE}/products" || echo "ERROR")
    if echo "$response" | grep -q "products\|data\|\[\]"; then
        print_test_result "Database connectivity (products)" "PASS"
    else
        print_test_result "Database connectivity (products)" "FAIL" "Response: $response"
    fi
    
    # Test public site settings
    response=$(curl -s "${API_BASE}/public/site-settings" || echo "ERROR")
    if echo "$response" | grep -q "success\|settings"; then
        print_test_result "Database connectivity (settings)" "PASS"
    else
        print_test_result "Database connectivity (settings)" "FAIL" "Response: $response"
    fi
}

# Test 4: Authentication system
test_authentication() {
    echo -e "${YELLOW}Testing authentication system...${NC}"
    
    # Test login endpoint
    login_response=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" || echo "ERROR")
    
    if echo "$login_response" | grep -q "token\|success"; then
        print_test_result "Admin login" "PASS"
        
        # Extract token for further tests
        TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        # Test protected endpoint
        if [ -n "$TOKEN" ]; then
            protected_response=$(curl -s "${API_BASE}/admin/dashboard/stats" \
                -H "Authorization: Bearer $TOKEN" || echo "ERROR")
            
            if echo "$protected_response" | grep -q "success\|stats\|data"; then
                print_test_result "Protected endpoint access" "PASS"
            else
                print_test_result "Protected endpoint access" "FAIL" "Response: $protected_response"
            fi
        fi
    else
        print_test_result "Admin login" "FAIL" "Response: $login_response"
    fi
}

# Test 5: File upload system
test_file_upload() {
    echo -e "${YELLOW}Testing file upload system...${NC}"
    
    if [ -n "$TOKEN" ]; then
        # Create a small test image
        echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test_image.png
        
        upload_response=$(curl -s -X POST "${API_BASE}/media/upload" \
            -H "Authorization: Bearer $TOKEN" \
            -F "image=@test_image.png" \
            -F "altEn=Test image" \
            -F "altAr=صورة تجريبية" \
            -F "folder=test" || echo "ERROR")
        
        if echo "$upload_response" | grep -q "success\|url\|cloudinary"; then
            print_test_result "File upload system" "PASS"
        else
            print_test_result "File upload system" "FAIL" "Response: $upload_response"
        fi
        
        # Cleanup
        rm -f test_image.png
    else
        print_test_result "File upload system" "SKIP" "No authentication token available"
    fi
}

# Test 6: PayPal integration
test_paypal() {
    echo -e "${YELLOW}Testing PayPal integration...${NC}"
    
    # Test PayPal settings endpoint (requires auth)
    if [ -n "$TOKEN" ]; then
        paypal_response=$(curl -s "${API_BASE}/paypal/settings" \
            -H "Authorization: Bearer $TOKEN" || echo "ERROR")
        
        if echo "$paypal_response" | grep -q "success\|paypalSettings"; then
            print_test_result "PayPal settings endpoint" "PASS"
        else
            print_test_result "PayPal settings endpoint" "FAIL" "Response: $paypal_response"
        fi
    else
        print_test_result "PayPal settings endpoint" "SKIP" "No authentication token available"
    fi
    
    # Test currency conversion
    currency_response=$(curl -s "${API_BASE}/paypal/currency-rates" || echo "ERROR")
    if echo "$currency_response" | grep -q "rates\|USD\|SAR"; then
        print_test_result "Currency conversion service" "PASS"
    else
        print_test_result "Currency conversion service" "FAIL" "Response: $currency_response"
    fi
}

# Test 7: Email system
test_email() {
    echo -e "${YELLOW}Testing email system...${NC}"
    
    if [ -n "$TOKEN" ]; then
        # Test email settings
        email_response=$(curl -s "${API_BASE}/site-settings/email" \
            -H "Authorization: Bearer $TOKEN" || echo "ERROR")
        
        if echo "$email_response" | grep -q "success\|emailSettings"; then
            print_test_result "Email settings endpoint" "PASS"
        else
            print_test_result "Email settings endpoint" "FAIL" "Response: $email_response"
        fi
    else
        print_test_result "Email settings endpoint" "SKIP" "No authentication token available"
    fi
    
    # Test contact form (public endpoint)
    contact_response=$(curl -s -X POST "${API_BASE}/contact" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"Test message","category":"general","priority":"normal"}' || echo "ERROR")
    
    if echo "$contact_response" | grep -q "success\|message"; then
        print_test_result "Contact form submission" "PASS"
    else
        print_test_result "Contact form submission" "FAIL" "Response: $contact_response"
    fi
}

# Test 8: Frontend pages
test_frontend_pages() {
    echo -e "${YELLOW}Testing frontend pages...${NC}"
    
    # Test main pages
    pages=("/" "/products" "/about" "/contact" "/admin")
    
    for page in "${pages[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}${page}")
        
        if [ "$response" = "200" ]; then
            print_test_result "Frontend page: $page" "PASS"
        else
            print_test_result "Frontend page: $page" "FAIL" "HTTP $response"
        fi
    done
}

# Test 9: Performance and security
test_performance_security() {
    echo -e "${YELLOW}Testing performance and security...${NC}"
    
    # Test HTTPS redirect
    http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}")
    if [ "$http_response" = "301" ] || [ "$http_response" = "302" ]; then
        print_test_result "HTTPS redirect" "PASS"
    else
        print_test_result "HTTPS redirect" "FAIL" "HTTP $http_response"
    fi
    
    # Test security headers
    headers=$(curl -s -I "https://${DOMAIN}" | tr -d '\r')
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_test_result "X-Frame-Options header" "PASS"
    else
        print_test_result "X-Frame-Options header" "FAIL"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_test_result "X-Content-Type-Options header" "PASS"
    else
        print_test_result "X-Content-Type-Options header" "FAIL"
    fi
    
    # Test gzip compression
    if echo "$headers" | grep -qi "content-encoding.*gzip"; then
        print_test_result "Gzip compression" "PASS"
    else
        print_test_result "Gzip compression" "FAIL"
    fi
}

# Test 10: Docker containers health
test_docker_health() {
    echo -e "${YELLOW}Testing Docker containers health...${NC}"
    
    # This test only works if run on the server
    if command -v docker &> /dev/null; then
        # Check if containers are running
        if docker ps | grep -q "maison-darin"; then
            print_test_result "Docker containers running" "PASS"
        else
            print_test_result "Docker containers running" "FAIL"
        fi
        
        # Check container health
        backend_health=$(docker inspect --format='{{.State.Health.Status}}' maison-darin-backend 2>/dev/null || echo "unknown")
        if [ "$backend_health" = "healthy" ]; then
            print_test_result "Backend container health" "PASS"
        else
            print_test_result "Backend container health" "FAIL" "Status: $backend_health"
        fi
        
        frontend_health=$(docker inspect --format='{{.State.Health.Status}}' maison-darin-frontend 2>/dev/null || echo "unknown")
        if [ "$frontend_health" = "healthy" ]; then
            print_test_result "Frontend container health" "PASS"
        else
            print_test_result "Frontend container health" "FAIL" "Status: $frontend_health"
        fi
    else
        print_test_result "Docker containers health" "SKIP" "Docker not available on this machine"
    fi
}

# Run all tests
main() {
    echo -e "${BLUE}🌟 Maison Darin Deployment Test Suite${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
    echo ""
    
    test_basic_connectivity
    echo ""
    
    test_api_health
    echo ""
    
    test_database
    echo ""
    
    test_authentication
    echo ""
    
    test_file_upload
    echo ""
    
    test_paypal
    echo ""
    
    test_email
    echo ""
    
    test_frontend_pages
    echo ""
    
    test_performance_security
    echo ""
    
    test_docker_health
    echo ""
    
    # Summary
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo -e "${GREEN}✅ Tests Passed: ${TESTS_PASSED}${NC}"
    echo -e "${RED}❌ Tests Failed: ${TESTS_FAILED}${NC}"
    
    if [ ${TESTS_FAILED} -gt 0 ]; then
        echo -e "${RED}Failed Tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo -e "${RED}  - $test${NC}"
        done
        echo ""
        echo -e "${RED}🚨 Some tests failed. Please check the deployment.${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
        echo -e "${GREEN}🌐 Website: https://${DOMAIN}${NC}"
        echo -e "${GREEN}📊 Admin Panel: https://${DOMAIN}/admin${NC}"
    fi
}

# Run the tests
main
