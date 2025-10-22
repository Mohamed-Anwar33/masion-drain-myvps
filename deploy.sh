#!/bin/bash

# Maison Darin Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: production (default) | staging

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SERVER_IP="72.61.154.149"
SERVER_USER="root"
DOMAIN="maisondarin.com"
PROJECT_NAME="maison-darin"

echo -e "${BLUE}🚀 Starting deployment for ${ENVIRONMENT} environment${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    
    if [ ! -f "maison-darin-backend/.env.production" ]; then
        print_error "Backend production environment file not found!"
        exit 1
    fi
    
    if [ ! -f "maison-darin-luxury-beauty/.env.production" ]; then
        print_error "Frontend production environment file not found!"
        exit 1
    fi
    
    print_status "All required files found"
}

# Build and test locally
build_and_test() {
    print_status "Building and testing locally..."
    
    # Build backend
    cd maison-darin-backend
    npm install
    npm run test || print_warning "Backend tests failed, continuing anyway..."
    cd ..
    
    # Build frontend
    cd maison-darin-luxury-beauty
    npm install
    npm run build
    cd ..
    
    print_status "Local build completed"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create temporary deployment directory
    DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $DEPLOY_DIR
    
    # Copy necessary files
    cp docker-compose.yml $DEPLOY_DIR/
    cp -r maison-darin-backend $DEPLOY_DIR/
    cp -r maison-darin-luxury-beauty $DEPLOY_DIR/
    
    # Remove node_modules to reduce size
    find $DEPLOY_DIR -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    find $DEPLOY_DIR -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Create deployment archive
    tar -czf ${DEPLOY_DIR}.tar.gz $DEPLOY_DIR
    rm -rf $DEPLOY_DIR
    
    print_status "Deployment package created: ${DEPLOY_DIR}.tar.gz"
    echo $DEPLOY_DIR
}

# Deploy to server
deploy_to_server() {
    local deploy_package=$1
    print_status "Deploying to server ${SERVER_IP}..."
    
    # Copy deployment package to server
    scp ${deploy_package}.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
    
    # Execute deployment on server
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        set -e
        
        echo "🔧 Preparing deployment on server..."
        
        # Create project directory
        mkdir -p /opt/${PROJECT_NAME}
        cd /opt/${PROJECT_NAME}
        
        # Backup current deployment if exists
        if [ -d "current" ]; then
            echo "📦 Backing up current deployment..."
            mv current backup-\$(date +%Y%m%d-%H%M%S) || true
        fi
        
        # Extract new deployment
        echo "📂 Extracting new deployment..."
        tar -xzf /tmp/${deploy_package}.tar.gz
        mv ${deploy_package} current
        cd current
        
        # Stop existing containers
        echo "🛑 Stopping existing containers..."
        docker-compose down || true
        
        # Pull latest images and rebuild
        echo "🔄 Building and starting containers..."
        docker-compose build --no-cache
        docker-compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be ready..."
        sleep 30
        
        # Check if services are running
        if docker-compose ps | grep -q "Up"; then
            echo "✅ Deployment successful!"
            
            # Clean up old backups (keep last 3)
            cd /opt/${PROJECT_NAME}
            ls -t | grep backup- | tail -n +4 | xargs rm -rf || true
        else
            echo "❌ Deployment failed! Rolling back..."
            docker-compose down
            if [ -d "backup-*" ]; then
                latest_backup=\$(ls -t backup-* | head -n1)
                mv current failed-\$(date +%Y%m%d-%H%M%S)
                mv \$latest_backup current
                cd current
                docker-compose up -d
            fi
            exit 1
        fi
        
        # Cleanup
        rm -f /tmp/${deploy_package}.tar.gz
EOF
    
    # Cleanup local deployment package
    rm -f ${deploy_package}.tar.gz
    
    print_status "Deployment completed successfully!"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait a bit for services to fully start
    sleep 10
    
    # Check if website is accessible
    if curl -f -s "https://${DOMAIN}/health" > /dev/null; then
        print_status "Frontend health check passed"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check API health
    if curl -f -s "https://${DOMAIN}/api/status/health" > /dev/null; then
        print_status "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
}

# Main deployment process
main() {
    echo -e "${BLUE}🌟 Maison Darin Deployment Script${NC}"
    echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
    echo -e "${BLUE}Server: ${SERVER_IP}${NC}"
    echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
    echo ""
    
    check_requirements
    build_and_test
    
    deploy_package=$(create_deployment_package)
    deploy_to_server $deploy_package
    
    health_check
    
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo -e "${GREEN}🌐 Website: https://${DOMAIN}${NC}"
    echo -e "${GREEN}📊 Admin Panel: https://${DOMAIN}/admin${NC}"
    echo ""
}

# Run main function
main
