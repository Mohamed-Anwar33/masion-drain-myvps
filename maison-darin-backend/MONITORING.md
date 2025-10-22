# Monitoring and Health Checks

This document describes the comprehensive monitoring, health checking, and alerting system implemented for the Maison Darin backend API.

## Overview

The monitoring system provides:
- Real-time performance monitoring
- Health checks and status reporting
- Automated alerting and notifications
- Backup and recovery procedures
- System resource monitoring
- Database performance tracking

## Health Check Endpoints

### Basic Health Check
```
GET /health
GET /api/health
```
Returns basic system health status including database connectivity and uptime.

### Detailed Health Check
```
GET /api/health/detailed
```
Requires authentication. Returns comprehensive health information including:
- System resources (CPU, memory, uptime)
- Database statistics and connection pool status
- Circuit breaker status
- Performance metrics

### Database Health
```
GET /api/health/database
```
Specific database health check including connection status and circuit breaker state.

### Kubernetes/Docker Probes
```
GET /api/health/ready   # Readiness probe
GET /api/health/live    # Liveness probe
```
Lightweight endpoints for container orchestration health checks.

### Performance Metrics
```
GET /api/health/metrics          # Get performance metrics (auth required)
GET /api/health/alerts           # Get alert history (auth required)
POST /api/health/metrics/reset   # Reset metrics (auth required)
PUT /api/health/thresholds       # Update thresholds (auth required)
```

## Performance Monitoring

### Automatic Tracking
The system automatically tracks:
- **Request Metrics**: Response times, success/failure rates, throughput
- **Database Metrics**: Query times, connection pool usage, circuit breaker status
- **System Metrics**: CPU usage, memory consumption, uptime
- **Error Metrics**: Error rates, error types, recent errors

### Performance Thresholds
Default thresholds that trigger alerts:
- Response time: 5000ms
- Error rate: 5%
- CPU usage: 80%
- Memory usage: 85%
- Database query time: 1000ms

### Circuit Breaker Pattern
Implements circuit breaker for database operations:
- **CLOSED**: Normal operation
- **OPEN**: Database unavailable, operations blocked
- **HALF_OPEN**: Testing if database is back online

## Alerting System

### Alert Channels
Multiple alert channels are supported:

1. **File Logging** (always enabled)
   - Logs alerts to `logs/alerts.log`

2. **Console** (development only)
   - Displays alerts in console output

3. **Email** (if configured)
   - Requires SMTP configuration
   - Environment variables: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

4. **Webhook** (if configured)
   - Generic webhook for integration with external systems
   - Environment variable: `ALERT_WEBHOOK_URL`

5. **Slack** (if configured)
   - Slack webhook integration
   - Environment variable: `SLACK_WEBHOOK_URL`

### Alert Types
- `HIGH_CPU_USAGE`: CPU usage exceeds threshold
- `HIGH_MEMORY_USAGE`: Memory usage exceeds threshold
- `SLOW_RESPONSE`: API response time exceeds threshold
- `HIGH_ERROR_RATE`: Error rate exceeds threshold
- `SLOW_DATABASE_QUERY`: Database query time exceeds threshold
- `APPLICATION_ERROR`: Application errors and exceptions

### Alert Severity Levels
- **info**: Informational alerts
- **warning**: Warning conditions
- **error**: Error conditions
- **critical**: Critical system issues

## Monitoring Scripts

### System Monitor
```bash
# Single health check
npm run monitor

# Continuous monitoring
npm run monitor:watch

# Custom interval (every 10 minutes)
node scripts/monitor.js watch --interval 10
```

Features:
- System resource monitoring
- Process status checking (PM2 integration)
- Database connectivity testing
- API health verification
- Automated alerting

### Live Dashboard
```bash
# Start live dashboard
npm run dashboard

# Single snapshot
npm run dashboard:snapshot

# Generate system report
npm run dashboard:report

# Custom refresh interval
node scripts/dashboard.js live --refresh 10
```

The dashboard provides:
- Real-time system status
- Performance metrics visualization
- Resource usage monitoring
- Alert history
- Database statistics

### Deployment Health Check
```bash
# Basic health check
npm run health-check

# JSON output
npm run health-check:json

# Custom URL and exit codes
node scripts/deployment-health-check.js --url https://api.example.com --exit-code
```

Performs comprehensive deployment verification:
- Server connectivity
- API endpoint accessibility
- Database connectivity
- Environment configuration
- SSL/TLS verification (if HTTPS)
- Performance validation

## Backup and Recovery

### Backup Operations
```bash
# Create full backup (database + application)
npm run backup

# Database backup only
npm run backup:db

# List available backups
npm run backup:list

# Verify backup integrity
npm run backup:verify <backup-file>

# Test restore process
npm run backup:test-restore <backup-file>

# Scheduled backup with verification
npm run backup:scheduled

# Check backup status
npm run backup:status

# Cleanup old backups
npm run backup:cleanup
```

### Backup Features
- **Automated Verification**: Backups are automatically verified for integrity
- **Test Restore**: Non-destructive restore testing
- **Compression**: Backups are compressed to save space
- **Cleanup**: Automatic cleanup of old backups
- **Multiple Formats**: Supports both mongodump and JSON formats
- **Alert Integration**: Backup failures trigger alerts

### Recovery Procedures
```bash
# Restore from backup
npm run backup:restore <backup-file>

# Restore specific backup
node scripts/backup.js restore backups/db-backup-2024-01-15T10-30-00.tar.gz
```

## Configuration

### Environment Variables

#### Monitoring Configuration
```bash
# Database monitoring
DB_HEALTH_CHECK_INTERVAL=30000    # Health check interval (ms)
DB_MAX_RETRIES=5                  # Max connection retries
DB_RETRY_DELAY=5000              # Retry delay (ms)
DB_MONITOR_POOL=true             # Enable connection pool monitoring

# Performance thresholds
PERF_RESPONSE_TIME_THRESHOLD=5000  # Response time threshold (ms)
PERF_ERROR_RATE_THRESHOLD=0.05     # Error rate threshold (5%)
PERF_CPU_THRESHOLD=80              # CPU usage threshold (%)
PERF_MEMORY_THRESHOLD=85           # Memory usage threshold (%)
```

#### Alert Configuration
```bash
# Email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=app-password
ALERT_EMAIL_RECIPIENTS=admin@example.com,ops@example.com

# Webhook alerts
ALERT_WEBHOOK_URL=https://hooks.example.com/alerts

# Slack alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

#### Backup Configuration
```bash
# Backup settings
BACKUP_RETENTION_DAYS=30          # Keep backups for 30 days
BACKUP_SCHEDULE=0 2 * * *         # Daily at 2 AM (cron format)
BACKUP_COMPRESSION=true           # Enable compression
```

### Docker Health Checks
The Docker configuration includes health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js
```

### PM2 Configuration
PM2 ecosystem includes monitoring:

```javascript
{
  name: 'maison-darin-api',
  script: 'server.js',
  instances: 'max',
  exec_mode: 'cluster',
  health_check_grace_period: 3000,
  health_check_fatal_exceptions: true
}
```

## Integration Examples

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: maison-darin-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: maison-darin-api:latest
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Nginx Health Check
```nginx
upstream api_backend {
    server localhost:5000;
    
    # Health check
    health_check uri=/api/health interval=10s;
}
```

### Monitoring with Prometheus
```javascript
// Custom metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  
  // Convert to Prometheus format
  const prometheusMetrics = `
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{status="success"} ${metrics.requests.successful}
api_requests_total{status="error"} ${metrics.requests.failed}

# HELP api_response_time_seconds API response time in seconds
# TYPE api_response_time_seconds histogram
api_response_time_seconds_sum ${metrics.requests.averageResponseTime / 1000}
api_response_time_seconds_count ${metrics.requests.total}
  `;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for memory leaks in application code
   - Monitor database connection pool size
   - Review caching strategies

2. **Slow Response Times**
   - Analyze database query performance
   - Check system resource usage
   - Review API endpoint optimization

3. **Database Connection Issues**
   - Verify MongoDB connectivity
   - Check connection pool configuration
   - Review circuit breaker status

4. **Alert Fatigue**
   - Adjust alert thresholds
   - Implement alert cooldown periods
   - Review alert severity levels

### Debug Commands
```bash
# Check system resources
node scripts/monitor.js check

# View recent alerts
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/health/alerts

# Check database status
curl http://localhost:5000/api/health/database

# Generate diagnostic report
npm run dashboard:report
```

## Best Practices

1. **Regular Monitoring**
   - Set up continuous monitoring in production
   - Review performance metrics regularly
   - Monitor alert trends

2. **Backup Strategy**
   - Schedule regular automated backups
   - Test restore procedures periodically
   - Maintain backup retention policies

3. **Alert Management**
   - Configure appropriate alert thresholds
   - Set up multiple alert channels
   - Implement escalation procedures

4. **Performance Optimization**
   - Monitor database query performance
   - Optimize slow endpoints
   - Implement caching strategies

5. **Capacity Planning**
   - Monitor resource usage trends
   - Plan for traffic growth
   - Scale infrastructure proactively

This monitoring system provides comprehensive visibility into the health and performance of the Maison Darin backend API, enabling proactive maintenance and rapid issue resolution.