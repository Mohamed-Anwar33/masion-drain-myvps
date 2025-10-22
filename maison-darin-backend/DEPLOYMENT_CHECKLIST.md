# Deployment Checklist

This checklist ensures a smooth and secure deployment of the Maison Darin Backend API to production.

## 📋 Pre-Deployment Checklist

### 🔧 Environment Setup

- [ ] **Production Environment Variables**
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` set to appropriate port (default: 5000)
  - [ ] `MONGODB_URI` pointing to production MongoDB instance
  - [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong and unique
  - [ ] `CLOUDINARY_*` credentials are production keys
  - [ ] `FRONTEND_URL` set to production frontend domain
  - [ ] Rate limiting values appropriate for production load
  - [ ] Email configuration (if using email features)

- [ ] **Security Configuration**
  - [ ] JWT secrets are at least 32 characters long
  - [ ] Database credentials are secure and not default
  - [ ] Cloudinary API keys are production keys
  - [ ] CORS origins include only trusted domains
  - [ ] Rate limiting is configured appropriately

- [ ] **Database Setup**
  - [ ] Production MongoDB instance is running
  - [ ] Database connection is tested and working
  - [ ] Database indexes are created (run migrations)
  - [ ] Initial data is seeded (admin user, content, products)
  - [ ] Database backup strategy is in place

### 🧪 Testing & Quality Assurance

- [ ] **Code Quality**
  - [ ] All tests pass (`npm test`)
  - [ ] Code linting passes (`npm run lint`)
  - [ ] Test coverage is above 90%
  - [ ] No security vulnerabilities (`npm audit`)

- [ ] **Integration Testing**
  - [ ] API endpoints tested with production-like data
  - [ ] Frontend integration tested
  - [ ] Authentication flow tested
  - [ ] File upload functionality tested
  - [ ] Database operations tested

- [ ] **Performance Testing**
  - [ ] Load testing completed
  - [ ] Memory usage is acceptable
  - [ ] Response times are within acceptable limits
  - [ ] Database query performance is optimized

### 📚 Documentation

- [ ] **API Documentation**
  - [ ] Swagger documentation is up to date
  - [ ] Postman collection is current
  - [ ] README is comprehensive and accurate
  - [ ] Environment variables are documented

- [ ] **Deployment Documentation**
  - [ ] Deployment process is documented
  - [ ] Rollback procedures are documented
  - [ ] Monitoring and alerting setup is documented
  - [ ] Troubleshooting guide is available

## 🚀 Deployment Process

### 1. Infrastructure Setup

#### Option A: Docker Deployment (Recommended)

- [ ] **Docker Setup**
  ```bash
  # Build production image
  docker build -t maison-darin-backend:latest .
  
  # Test image locally
  docker run -p 5000:5000 --env-file .env.production maison-darin-backend:latest
  
  # Deploy with Docker Compose
  docker-compose -f docker-compose.yml up -d
  ```

- [ ] **Docker Compose Configuration**
  - [ ] Production docker-compose.yml is configured
  - [ ] Environment variables are properly set
  - [ ] Volumes are configured for data persistence
  - [ ] Networks are properly configured

#### Option B: PM2 Deployment

- [ ] **PM2 Setup**
  ```bash
  # Install PM2 globally
  npm install -g pm2
  
  # Start application with PM2
  pm2 start ecosystem.config.js --env production
  
  # Save PM2 configuration
  pm2 save
  pm2 startup
  ```

- [ ] **PM2 Configuration**
  - [ ] ecosystem.config.js is configured for production
  - [ ] Process monitoring is enabled
  - [ ] Log rotation is configured
  - [ ] Auto-restart on failure is enabled

### 2. Database Deployment

- [ ] **MongoDB Setup**
  ```bash
  # Run database migrations
  npm run migrate
  
  # Seed initial data
  npm run seed
  
  # Verify database connection
  npm run health-check
  ```

- [ ] **Database Configuration**
  - [ ] Production MongoDB instance is secured
  - [ ] Database indexes are created
  - [ ] Connection pooling is configured
  - [ ] Backup strategy is implemented

### 3. Reverse Proxy Setup (Nginx)

- [ ] **Nginx Configuration**
  ```bash
  # Copy nginx configuration
  sudo cp nginx/nginx.conf /etc/nginx/sites-available/maison-darin-backend
  
  # Enable site
  sudo ln -s /etc/nginx/sites-available/maison-darin-backend /etc/nginx/sites-enabled/
  
  # Test configuration
  sudo nginx -t
  
  # Reload nginx
  sudo systemctl reload nginx
  ```

- [ ] **SSL/TLS Setup**
  - [ ] SSL certificate is installed (Let's Encrypt recommended)
  - [ ] HTTPS redirect is configured
  - [ ] Security headers are configured
  - [ ] HTTP/2 is enabled

### 4. Monitoring & Logging

- [ ] **Health Monitoring**
  - [ ] Health check endpoints are accessible
  - [ ] Uptime monitoring is configured
  - [ ] Performance monitoring is enabled
  - [ ] Database monitoring is set up

- [ ] **Logging Setup**
  - [ ] Log files are properly configured
  - [ ] Log rotation is set up
  - [ ] Error alerting is configured
  - [ ] Log aggregation is set up (if applicable)

- [ ] **Alerting Configuration**
  - [ ] Email alerts for critical errors
  - [ ] Performance threshold alerts
  - [ ] Database connection alerts
  - [ ] Disk space monitoring

## 🔍 Post-Deployment Verification

### 1. Functional Testing

- [ ] **API Endpoints**
  - [ ] Health check endpoint responds correctly
  - [ ] Authentication endpoints work
  - [ ] Product CRUD operations work
  - [ ] Content management works
  - [ ] Media upload works
  - [ ] Order processing works

- [ ] **Frontend Integration**
  - [ ] Frontend can connect to API
  - [ ] CORS is working correctly
  - [ ] Authentication flow works end-to-end
  - [ ] All frontend features work with production API

### 2. Performance Verification

- [ ] **Response Times**
  - [ ] API response times are acceptable (< 500ms for most endpoints)
  - [ ] Database query performance is good
  - [ ] Image upload/processing is working
  - [ ] Search functionality is performant

- [ ] **Load Testing**
  - [ ] API can handle expected concurrent users
  - [ ] Database can handle expected load
  - [ ] Memory usage is stable under load
  - [ ] No memory leaks detected

### 3. Security Verification

- [ ] **Security Headers**
  - [ ] HTTPS is enforced
  - [ ] Security headers are present (CSP, HSTS, etc.)
  - [ ] CORS is properly configured
  - [ ] Rate limiting is working

- [ ] **Authentication & Authorization**
  - [ ] JWT tokens are working correctly
  - [ ] Token expiration is working
  - [ ] Protected endpoints require authentication
  - [ ] Admin-only endpoints are protected

### 4. Monitoring Verification

- [ ] **Health Checks**
  - [ ] Application health monitoring is working
  - [ ] Database health monitoring is working
  - [ ] Performance metrics are being collected
  - [ ] Alerts are configured and tested

- [ ] **Logging**
  - [ ] Application logs are being written
  - [ ] Error logs are being captured
  - [ ] Log rotation is working
  - [ ] Log aggregation is working (if configured)

## 🔄 Rollback Plan

### Preparation

- [ ] **Backup Strategy**
  - [ ] Database backup before deployment
  - [ ] Previous version Docker image/code backup
  - [ ] Configuration backup
  - [ ] Documentation of rollback steps

### Rollback Steps

1. **Immediate Rollback (Docker)**
   ```bash
   # Stop current version
   docker-compose down
   
   # Deploy previous version
   docker-compose -f docker-compose.rollback.yml up -d
   ```

2. **Immediate Rollback (PM2)**
   ```bash
   # Stop current application
   pm2 stop all
   
   # Deploy previous version
   git checkout <previous-version-tag>
   npm install
   pm2 start ecosystem.config.js --env production
   ```

3. **Database Rollback (if needed)**
   ```bash
   # Restore database from backup
   mongorestore --drop --db maison-darin /path/to/backup
   ```

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] **Application Health**
  - [ ] Check application uptime
  - [ ] Review error logs
  - [ ] Check performance metrics
  - [ ] Verify database connectivity

- [ ] **Security Monitoring**
  - [ ] Review authentication logs
  - [ ] Check for suspicious activity
  - [ ] Monitor rate limiting effectiveness
  - [ ] Review security alerts

### Weekly Checks

- [ ] **Performance Review**
  - [ ] Analyze response time trends
  - [ ] Review database performance
  - [ ] Check memory usage patterns
  - [ ] Review error rate trends

- [ ] **Maintenance Tasks**
  - [ ] Update dependencies (security patches)
  - [ ] Review and rotate logs
  - [ ] Check disk space usage
  - [ ] Review backup integrity

### Monthly Checks

- [ ] **Security Audit**
  - [ ] Run security vulnerability scan
  - [ ] Review access logs
  - [ ] Update security configurations
  - [ ] Review and update secrets/keys

- [ ] **Performance Optimization**
  - [ ] Database query optimization
  - [ ] Index optimization
  - [ ] Cache performance review
  - [ ] Resource usage optimization

## 🆘 Troubleshooting Guide

### Common Issues

#### Application Won't Start

1. **Check Environment Variables**
   ```bash
   # Verify all required variables are set
   node -e "require('./utils/validateEnv').validateEnv()"
   ```

2. **Check Database Connection**
   ```bash
   # Test MongoDB connection
   mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
   ```

3. **Check Port Availability**
   ```bash
   # Check if port is in use
   lsof -i :5000
   ```

#### High Response Times

1. **Check Database Performance**
   ```bash
   # Monitor database queries
   db.setProfilingLevel(2)
   db.system.profile.find().sort({ts: -1}).limit(5)
   ```

2. **Check Memory Usage**
   ```bash
   # Monitor memory usage
   pm2 monit
   ```

3. **Check Network Latency**
   ```bash
   # Test API response times
   curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/health"
   ```

#### Database Connection Issues

1. **Check MongoDB Status**
   ```bash
   sudo systemctl status mongod
   ```

2. **Check Connection String**
   ```bash
   echo $MONGODB_URI
   ```

3. **Test Connection**
   ```bash
   mongosh $MONGODB_URI --eval "db.runCommand({ping: 1})"
   ```

### Emergency Contacts

- **Development Team**: [team-email@domain.com]
- **DevOps Team**: [devops@domain.com]
- **Database Administrator**: [dba@domain.com]
- **Security Team**: [security@domain.com]

### Useful Commands

```bash
# Check application status
pm2 status

# View application logs
pm2 logs

# Restart application
pm2 restart all

# Check system resources
htop

# Check disk space
df -h

# Check network connections
netstat -tulpn

# Test API endpoints
curl -X GET http://localhost:5000/api/health

# Check database status
mongosh --eval "db.adminCommand('serverStatus')"
```

---

**Remember**: Always test the deployment process in a staging environment before deploying to production!