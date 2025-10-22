# Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Setup
- [ ] Production server is provisioned and accessible
- [ ] Node.js 18+ is installed on production server
- [ ] MongoDB is installed and configured
- [ ] Redis is installed and configured (optional but recommended)
- [ ] Nginx is installed and configured
- [ ] PM2 is installed globally (`npm install -g pm2`)
- [ ] Docker and Docker Compose are installed (if using Docker deployment)

### Security Configuration
- [ ] Firewall is configured (only allow necessary ports: 22, 80, 443)
- [ ] SSH key-based authentication is set up
- [ ] SSL certificates are obtained and configured
- [ ] Environment variables are set securely
- [ ] Database authentication is enabled
- [ ] Redis password is set (if using Redis)

### Application Configuration
- [ ] `.env.production` file is created with production values
- [ ] JWT secrets are generated and set
- [ ] Cloudinary credentials are configured
- [ ] Frontend URL is set correctly
- [ ] Database connection string is correct
- [ ] All required environment variables are set

### Code Preparation
- [ ] All tests are passing (`npm test`)
- [ ] Code is linted and formatted (`npm run lint`)
- [ ] Dependencies are up to date
- [ ] Security vulnerabilities are addressed (`npm audit`)
- [ ] Application builds successfully
- [ ] Documentation is updated

## Deployment Steps

### 1. Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Create application directory
sudo mkdir -p /var/www/maison-darin-backend
sudo chown deploy:deploy /var/www/maison-darin-backend
```

### 2. Database Setup
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongo
> use maison-darin
> db.createUser({
    user: "maison_darin_user",
    pwd: "secure_password_here",
    roles: [{ role: "readWrite", db: "maison-darin" }]
  })
```

### 3. Application Deployment

#### Option A: Manual Deployment
```bash
# Clone repository
cd /var/www/maison-darin-backend
git clone <repository-url> .

# Install dependencies
npm ci --only=production

# Copy environment file
cp .env.example .env.production
# Edit .env.production with production values

# Run migrations
npm run migrate

# Seed database (if needed)
npm run seed

# Start with PM2
npm run pm2:start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option B: Docker Deployment
```bash
# Clone repository
cd /var/www/maison-darin-backend
git clone <repository-url> .

# Copy environment file
cp .env.example .env.production
# Edit .env.production with production values

# Deploy with Docker
npm run docker:run

# Check status
docker-compose ps
```

#### Option C: Automated Deployment
```bash
# Use deployment script
npm run deploy

# Or with Docker
npm run deploy:docker

# Or with database seeding
npm run deploy:seed
```

### 4. Nginx Configuration
```bash
# Install Nginx
sudo apt install nginx

# Copy configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/maison-darin-backend
sudo ln -s /etc/nginx/sites-available/maison-darin-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. SSL Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Post-Deployment Verification

### Health Checks
- [ ] Application is running (`pm2 status` or `docker-compose ps`)
- [ ] Health endpoint responds (`curl http://localhost:5000/health`)
- [ ] Database connection is working
- [ ] API endpoints are accessible
- [ ] Authentication is working
- [ ] File uploads are working (Cloudinary)
- [ ] Logs are being generated properly

### Performance Checks
- [ ] Response times are acceptable
- [ ] Memory usage is within limits
- [ ] CPU usage is normal
- [ ] Database queries are optimized
- [ ] Rate limiting is working

### Security Checks
- [ ] HTTPS is working properly
- [ ] Security headers are present
- [ ] Rate limiting is active
- [ ] Authentication is secure
- [ ] No sensitive data in logs
- [ ] Firewall rules are correct

## Monitoring Setup

### Application Monitoring
```bash
# Set up PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Set up log monitoring
sudo apt install logwatch
```

### Database Monitoring
- [ ] MongoDB monitoring is configured
- [ ] Database backups are scheduled
- [ ] Disk space monitoring is set up
- [ ] Performance metrics are tracked

### Backup Configuration
```bash
# Set up automated backups
crontab -e

# Add backup cron job (daily at 2 AM)
0 2 * * * cd /var/www/maison-darin-backend && npm run backup

# Add cleanup cron job (weekly)
0 3 * * 0 cd /var/www/maison-darin-backend && npm run backup:cleanup
```

## Maintenance Tasks

### Regular Tasks
- [ ] Monitor application logs
- [ ] Check system resources
- [ ] Update dependencies regularly
- [ ] Review security updates
- [ ] Test backup and restore procedures
- [ ] Monitor SSL certificate expiration

### Weekly Tasks
- [ ] Review application performance
- [ ] Check error rates
- [ ] Update system packages
- [ ] Clean up old logs
- [ ] Verify backup integrity

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Dependency updates
- [ ] Documentation updates
- [ ] Disaster recovery testing

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs maison-darin-api

# Check environment variables
pm2 env 0

# Check port availability
sudo netstat -tlnp | grep :5000
```

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongo --host localhost --port 27017

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### High Memory Usage
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart maison-darin-api

# Check system resources
htop
```

### Emergency Procedures

#### Application Rollback
```bash
# Stop current version
pm2 stop maison-darin-api

# Restore from backup
npm run backup:restore <backup-file>

# Start previous version
pm2 start maison-darin-api
```

#### Database Recovery
```bash
# Stop application
pm2 stop maison-darin-api

# Restore database
npm run backup:restore <database-backup>

# Start application
pm2 start maison-darin-api
```

## Contact Information

- **System Administrator**: [admin-email@domain.com]
- **Developer Team**: [dev-team@domain.com]
- **Emergency Contact**: [emergency@domain.com]

## Documentation Links

- [API Documentation](http://your-domain.com/docs)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Backup Procedures](./scripts/backup.js)