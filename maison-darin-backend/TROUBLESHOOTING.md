# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Maison Darin Backend API.

## 🚨 Common Issues

### 1. Application Won't Start

#### Issue: "Environment validation failed"
```
❌ Environment validation failed: JWT_SECRET must be at least 32 characters long
```

**Solution:**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update your .env file
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
```

#### Issue: "Cannot connect to MongoDB"
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
1. **Check if MongoDB is running:**
   ```bash
   # On macOS
   brew services list | grep mongodb
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl status mongod
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   ```

2. **Verify MongoDB connection string:**
   ```bash
   # Test connection
   mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
   ```

3. **Check MongoDB logs:**
   ```bash
   # On macOS
   tail -f /usr/local/var/log/mongodb/mongo.log
   
   # On Ubuntu/Debian
   sudo tail -f /var/log/mongodb/mongod.log
   ```

#### Issue: "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm run dev
```

#### Issue: "Cloudinary configuration error"
```
TypeError: Cannot read properties of undefined (reading 'config')
```

**Solution:**
```bash
# Verify Cloudinary credentials in .env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Test Cloudinary connection
node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log('Cloudinary config:', cloudinary.config());
"
```

### 2. Authentication Issues

#### Issue: "Invalid token" errors
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

**Solutions:**
1. **Check token format:**
   ```javascript
   // Correct format
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   // Common mistakes
   Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... // Missing "Bearer "
   Authorization: Bearer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... // Extra colon
   ```

2. **Check token expiration:**
   ```javascript
   // Decode token to check expiration
   const jwt = require('jsonwebtoken');
   const token = 'your-token-here';
   
   try {
     const decoded = jwt.decode(token);
     console.log('Token expires at:', new Date(decoded.exp * 1000));
     console.log('Current time:', new Date());
   } catch (error) {
     console.log('Invalid token format');
   }
   ```

3. **Refresh expired tokens:**
   ```javascript
   // Use refresh token to get new access token
   const refreshResponse = await fetch('/api/auth/refresh', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ refreshToken: storedRefreshToken })
   });
   ```

#### Issue: "Login fails with correct credentials"
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Solutions:**
1. **Check if admin user exists:**
   ```bash
   # Connect to MongoDB
   mongosh $MONGODB_URI
   
   # Check users collection
   use maison-darin
   db.users.find({})
   ```

2. **Create admin user if missing:**
   ```bash
   npm run seed
   # Or manually create user
   node scripts/createAdmin.js
   ```

3. **Reset admin password:**
   ```javascript
   // Create a script to reset password
   const bcrypt = require('bcrypt');
   const User = require('./models/User');
   
   async function resetPassword() {
     const hashedPassword = await bcrypt.hash('newpassword', 12);
     await User.updateOne(
       { email: 'admin@example.com' },
       { password: hashedPassword }
     );
     console.log('Password reset successfully');
   }
   ```

### 3. Database Issues

#### Issue: "Validation error" when creating documents
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Product validation failed",
    "details": [
      {
        "field": "name.ar",
        "message": "Arabic name is required"
      }
    ]
  }
}
```

**Solution:**
```javascript
// Ensure all required multilingual fields are provided
const productData = {
  name: {
    en: 'English Name',
    ar: 'الاسم العربي' // Required
  },
  description: {
    en: 'English Description',
    ar: 'الوصف العربي' // Required
  },
  // ... other required fields
};
```

#### Issue: "Duplicate key error"
```
E11000 duplicate key error collection: maison-darin.products index: name.en_1
```

**Solution:**
```bash
# Check for existing documents with same values
mongosh $MONGODB_URI
use maison-darin
db.products.find({"name.en": "Duplicate Name"})

# Remove duplicates or update with unique names
db.products.deleteOne({_id: ObjectId("duplicate-id")})
```

#### Issue: "Database connection timeout"
```
MongooseError: Operation `products.find()` buffering timed out after 10000ms
```

**Solutions:**
1. **Check database server status:**
   ```bash
   mongosh $MONGODB_URI --eval "db.adminCommand('serverStatus')"
   ```

2. **Increase connection timeout:**
   ```javascript
   // In database.js
   mongoose.connect(uri, {
     serverSelectionTimeoutMS: 30000, // 30 seconds
     socketTimeoutMS: 45000, // 45 seconds
   });
   ```

3. **Check network connectivity:**
   ```bash
   # Test network connection to MongoDB
   telnet your-mongodb-host 27017
   ```

### 4. File Upload Issues

#### Issue: "File too large" error
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

**Solutions:**
1. **Compress images before upload:**
   ```javascript
   // Client-side image compression
   function compressImage(file, maxSize = 5 * 1024 * 1024) {
     return new Promise((resolve) => {
       const canvas = document.createElement('canvas');
       const ctx = canvas.getContext('2d');
       const img = new Image();
       
       img.onload = () => {
         const ratio = Math.min(800 / img.width, 600 / img.height);
         canvas.width = img.width * ratio;
         canvas.height = img.height * ratio;
         
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         canvas.toBlob(resolve, 'image/jpeg', 0.8);
       };
       
       img.src = URL.createObjectURL(file);
     });
   }
   ```

2. **Increase file size limit (server-side):**
   ```javascript
   // In server.js or middleware
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true, limit: '10mb' }));
   ```

#### Issue: "Invalid file type" error
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG, PNG, and WebP files are allowed"
  }
}
```

**Solution:**
```javascript
// Validate file type on client-side
function validateFileType(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
}

// Usage
const fileInput = document.getElementById('imageInput');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!validateFileType(file)) {
    alert('Please select a JPEG, PNG, or WebP image');
    return;
  }
  // Proceed with upload
});
```

#### Issue: "Cloudinary upload fails"
```
CloudinaryError: Invalid API Key
```

**Solutions:**
1. **Verify Cloudinary credentials:**
   ```bash
   # Test Cloudinary API
   curl -X POST \
     "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload" \
     -F "upload_preset=YOUR_PRESET" \
     -F "file=@test-image.jpg"
   ```

2. **Check Cloudinary quotas:**
   - Log into Cloudinary dashboard
   - Check usage limits and quotas
   - Upgrade plan if necessary

### 5. Performance Issues

#### Issue: "Slow API responses"

**Diagnostic Steps:**
1. **Check database query performance:**
   ```javascript
   // Enable MongoDB profiling
   db.setProfilingLevel(2, { slowms: 100 });
   
   // Check slow queries
   db.system.profile.find().sort({ ts: -1 }).limit(5);
   ```

2. **Monitor memory usage:**
   ```bash
   # Check Node.js memory usage
   node --inspect server.js
   # Open chrome://inspect in Chrome
   
   # Or use PM2 monitoring
   pm2 monit
   ```

3. **Add database indexes:**
   ```javascript
   // In your migration script
   db.products.createIndex({ "name.en": "text", "name.ar": "text" });
   db.products.createIndex({ category: 1, featured: 1 });
   db.products.createIndex({ price: 1 });
   ```

**Solutions:**
1. **Implement caching:**
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
   
   // Cache frequently accessed data
   app.get('/api/products', async (req, res) => {
     const cacheKey = `products_${JSON.stringify(req.query)}`;
     let products = cache.get(cacheKey);
     
     if (!products) {
       products = await ProductService.getProducts(req.query);
       cache.set(cacheKey, products);
     }
     
     res.json({ success: true, data: products });
   });
   ```

2. **Optimize database queries:**
   ```javascript
   // Use lean() for read-only operations
   const products = await Product.find().lean();
   
   // Use select() to limit fields
   const products = await Product.find().select('name price category');
   
   // Use pagination
   const products = await Product.find()
     .skip((page - 1) * limit)
     .limit(limit);
   ```

3. **Enable compression:**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

#### Issue: "High memory usage"

**Solutions:**
1. **Check for memory leaks:**
   ```bash
   # Use clinic.js for memory profiling
   npm install -g clinic
   clinic doctor -- node server.js
   ```

2. **Optimize image processing:**
   ```javascript
   // Use streams for large file processing
   const sharp = require('sharp');
   
   const processImage = (inputBuffer) => {
     return sharp(inputBuffer)
       .resize(800, 600, { fit: 'inside' })
       .jpeg({ quality: 80 })
       .toBuffer();
   };
   ```

3. **Implement proper cleanup:**
   ```javascript
   // Clean up resources
   process.on('SIGTERM', async () => {
     console.log('SIGTERM received, shutting down gracefully');
     await mongoose.connection.close();
     process.exit(0);
   });
   ```

### 6. CORS Issues

#### Issue: "CORS policy blocks requests"
```
Access to fetch at 'http://localhost:5000/api/products' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. **Check CORS configuration:**
   ```javascript
   // Verify allowed origins in config/security.js
   const allowedOrigins = [
     'http://localhost:3000',
     'http://localhost:3001',
     'https://yourdomain.com'
   ];
   ```

2. **Add your domain to allowed origins:**
   ```javascript
   // In production, update CORS config
   const corsOptions = {
     origin: function (origin, callback) {
       if (!origin || allowedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     }
   };
   ```

3. **Handle preflight requests:**
   ```javascript
   // Ensure OPTIONS requests are handled
   app.options('*', cors(corsOptions));
   ```

### 7. Rate Limiting Issues

#### Issue: "Too many requests" error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later."
  }
}
```

**Solutions:**
1. **Check rate limit configuration:**
   ```javascript
   // In config/security.js
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // Increase if needed
     message: 'Rate limit exceeded'
   });
   ```

2. **Implement exponential backoff:**
   ```javascript
   async function apiCallWithRetry(url, options, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url, options);
         
         if (response.status === 429) {
           const delay = Math.pow(2, i) * 1000; // Exponential backoff
           await new Promise(resolve => setTimeout(resolve, delay));
           continue;
         }
         
         return response;
       } catch (error) {
         if (i === maxRetries - 1) throw error;
       }
     }
   }
   ```

3. **Use different rate limits for different endpoints:**
   ```javascript
   // Separate rate limiters
   const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
   const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
   
   app.use('/api/auth', authLimiter);
   app.use('/api', apiLimiter);
   ```

## 🔧 Debugging Tools

### 1. Enable Debug Logging
```bash
# Enable debug mode
DEBUG=* npm run dev

# Enable specific debug namespaces
DEBUG=express:* npm run dev
DEBUG=mongoose:* npm run dev
```

### 2. Use MongoDB Compass
```bash
# Install MongoDB Compass for GUI debugging
# Connect using your MONGODB_URI
# Explore collections, run queries, check indexes
```

### 3. API Testing with curl
```bash
# Test health endpoint
curl -X GET http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Database Debugging
```javascript
// Enable Mongoose debugging
mongoose.set('debug', true);

// Log all queries
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
```

### 5. Performance Monitoring
```javascript
// Add request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
});
```

## 📞 Getting Help

### 1. Check Logs
```bash
# Application logs
tail -f logs/app.log

# PM2 logs
pm2 logs

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Nginx logs (if using)
tail -f /var/log/nginx/error.log
```

### 2. Health Checks
```bash
# Check API health
curl http://localhost:5000/api/health

# Check database health
mongosh $MONGODB_URI --eval "db.adminCommand('ping')"

# Check system resources
htop
df -h
```

### 3. Useful Commands
```bash
# Check running processes
ps aux | grep node

# Check network connections
netstat -tulpn | grep :5000

# Check memory usage
free -h

# Check disk space
df -h

# Check system load
uptime
```

### 4. Emergency Recovery
```bash
# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Restart MongoDB
sudo systemctl restart mongod

# Restart application
pm2 start ecosystem.config.js

# Restart Nginx
sudo systemctl start nginx
```

## 📋 Maintenance Checklist

### Daily
- [ ] Check application health endpoints
- [ ] Review error logs
- [ ] Monitor response times
- [ ] Check database connectivity

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space usage
- [ ] Update dependencies (security patches)
- [ ] Review backup integrity

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database maintenance
- [ ] Update documentation

---

If you encounter issues not covered in this guide, please check the application logs and contact the development team with detailed error messages and steps to reproduce the problem.