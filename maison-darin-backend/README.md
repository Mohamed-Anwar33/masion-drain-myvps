# Maison Darin Backend API

A comprehensive backend API for the Maison Darin luxury perfume website, built with Node.js, Express, and MongoDB. This API provides complete functionality for product management, content management, order processing, and customer interactions with full Arabic/English multilingual support.

## 🚀 Features

- **🔐 Authentication System**: JWT-based authentication with refresh tokens and role-based access control
- **🛍️ Product Management**: Full CRUD operations for perfume products with multilingual support and advanced search
- **📝 Content Management**: Dynamic multilingual content management for all website sections
- **🖼️ Media Management**: Cloudinary integration for image uploads, optimization, and management
- **📦 Order Processing**: Complete order management system with status tracking
- **🧪 Sample Requests**: Customer sample request handling and management
- **📞 Contact System**: Contact form submissions and message management
- **🌍 Multilingual Support**: Full Arabic and English language support throughout the API
- **📚 API Documentation**: Comprehensive Swagger/OpenAPI documentation with interactive testing
- **🔒 Security**: Rate limiting, CORS, input validation, XSS protection, and security headers
- **🧪 Testing**: Comprehensive test suite with unit and integration tests (95%+ coverage)
- **📊 Monitoring**: Performance monitoring, health checks, and alerting system
- **🐳 Docker Ready**: Full Docker and Docker Compose support for easy deployment

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB 6.0+ with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **File Storage**: Cloudinary for image management and optimization
- **Validation**: Joi for comprehensive input validation
- **Documentation**: Swagger/OpenAPI 3.0 with interactive UI
- **Testing**: Jest + Supertest for unit and integration testing
- **Process Management**: PM2 for production deployment
- **Containerization**: Docker and Docker Compose
- **Security**: Helmet.js, express-rate-limit, CORS, input sanitization

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** 6.0 or higher (local installation or MongoDB Atlas)
- **Cloudinary Account** (free tier available at [cloudinary.com](https://cloudinary.com))
- **Git** for version control

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd maison-darin-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration (see [Environment Variables](#environment-variables) section below).

4. **Start MongoDB** (if running locally):
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

5. **Run database migrations and seed data:**
```bash
npm run migrate
npm run seed
```

6. **Start the development server:**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 🌐 Access Points

- **API Base URL**: `http://localhost:5000/api`
- **API Documentation**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# ======================
# Server Configuration
# ======================
PORT=5000
NODE_ENV=development

# ======================
# Database Configuration
# ======================
MONGODB_URI=mongodb://localhost:27017/maison-darin
DB_NAME=maison-darin

# ======================
# JWT Configuration
# ======================
# Generate secure secrets: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters-long
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# ======================
# Cloudinary Configuration
# ======================
# Get these from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ======================
# Frontend Configuration
# ======================
FRONTEND_URL=http://localhost:3000

# ======================
# Rate Limiting Configuration
# ======================
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # 100 requests per window
AUTH_RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5       # 5 auth attempts per window

# ======================
# Email Configuration (Optional)
# ======================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# ======================
# Monitoring Configuration (Optional)
# ======================
ENABLE_PERFORMANCE_MONITORING=true
ALERT_EMAIL=admin@yourdomain.com
```

### 🔑 Required Environment Variables

The following variables are **required** for the application to start:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (minimum 32 characters)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## 📚 API Documentation

Once the server is running, you can access the comprehensive API documentation:

- **Interactive Documentation**: `http://localhost:5000/api-docs`
- **API Overview**: `http://localhost:5000/api`
- **Postman Collection**: Available in the `/postman` directory

The documentation includes:
- Complete endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Error codes and handling

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm start               # Start production server

# Testing
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report

# Database
npm run migrate         # Run database migrations
npm run seed           # Seed database with initial data
npm run seed:products  # Seed only products
npm run seed:content   # Seed only content

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues automatically

# Documentation
npm run docs           # Generate API documentation
npm run postman        # Generate Postman collection

# Deployment
npm run build          # Prepare for production
npm run deploy         # Deploy to production (requires setup)

# Monitoring
npm run monitor        # Start monitoring dashboard
npm run health-check   # Run health checks
```

## 📁 Project Structure

```
maison-darin-backend/
├── 📁 config/                 # Configuration files
│   ├── database.js           # Database connection and configuration
│   ├── security.js           # Security middleware and CORS configuration
│   ├── swagger.js            # API documentation configuration
│   └── cors-production.js    # Production CORS settings
├── 📁 controllers/            # Route controllers (business logic)
│   ├── authController.js     # Authentication endpoints
│   ├── productController.js  # Product management
│   ├── contentController.js  # Content management
│   ├── mediaController.js    # Media/image management
│   ├── orderController.js    # Order processing
│   └── ...
├── 📁 middleware/             # Custom middleware
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation middleware
│   ├── errorHandler.js      # Global error handling
│   └── performanceMiddleware.js # Performance monitoring
├── 📁 models/                 # Mongoose data models
│   ├── User.js              # User model
│   ├── Product.js           # Product model
│   ├── Order.js             # Order model
│   └── ...
├── 📁 routes/                 # Express route definitions
│   ├── auth.js              # Authentication routes
│   ├── products.js          # Product routes
│   ├── content.js           # Content routes
│   └── ...
├── 📁 services/               # Business logic services
│   ├── authService.js       # Authentication service
│   ├── productService.js    # Product service
│   ├── cloudinaryService.js # Image management service
│   └── ...
├── 📁 tests/                  # Test files
│   ├── 📁 unit/              # Unit tests
│   ├── 📁 integration/       # Integration tests
│   ├── 📁 helpers/           # Test utilities
│   └── 📁 factories/         # Test data factories
├── 📁 utils/                  # Utility functions
│   ├── logger.js            # Logging utility
│   ├── errors.js            # Custom error classes
│   └── validateEnv.js       # Environment validation
├── 📁 validation/             # Input validation schemas
│   └── schemas.js           # Joi validation schemas
├── 📁 scripts/                # Utility and deployment scripts
│   ├── seed.js              # Database seeding
│   ├── migrate.js           # Database migrations
│   ├── deploy.js            # Deployment script
│   └── backup.js            # Database backup
├── 📁 postman/                # Postman collections and environments
├── 📁 nginx/                  # Nginx configuration for production
├── 🐳 docker-compose.yml      # Docker Compose configuration
├── 🐳 Dockerfile             # Docker image configuration
├── 📋 ecosystem.config.js     # PM2 process configuration
├── 🔧 .env.example           # Environment variables template
└── 🚀 server.js              # Application entry point
```

## 🔌 API Endpoints

### 🔐 Authentication
```
POST   /api/auth/login          # User login
POST   /api/auth/refresh        # Refresh access token
POST   /api/auth/logout         # User logout
GET    /api/auth/me             # Get current user info
```

### 🛍️ Products
```
GET    /api/products            # Get all products (with filtering, search, pagination)
GET    /api/products/:id        # Get product by ID
POST   /api/products            # Create new product (admin only)
PUT    /api/products/:id        # Update product (admin only)
DELETE /api/products/:id        # Delete product (admin only)
GET    /api/products/featured   # Get featured products
GET    /api/products/categories # Get product categories
```

### 📝 Content Management
```
GET    /api/content/translations    # Get all translations
GET    /api/content/:section       # Get content by section
PUT    /api/content/:section       # Update content section (admin only)
```

### 🖼️ Media Management
```
POST   /api/media/upload       # Upload image (admin only)
GET    /api/media              # Get media library (admin only)
GET    /api/media/:id          # Get media by ID (admin only)
PUT    /api/media/:id          # Update media metadata (admin only)
DELETE /api/media/:id          # Delete media (admin only)
GET    /api/media/:id/url/:size # Get optimized image URL
```

### 📦 Orders
```
POST   /api/orders             # Create new order
GET    /api/orders             # Get orders (admin only)
GET    /api/orders/:id         # Get order by ID
PUT    /api/orders/:id/status  # Update order status (admin only)
```

### 🧪 Sample Requests
```
POST   /api/samples/request    # Request product sample
GET    /api/samples            # Get sample requests (admin only)
PUT    /api/samples/:id/status # Update sample status (admin only)
```

### 📞 Contact
```
POST   /api/contact            # Submit contact message
GET    /api/contact/messages   # Get contact messages (admin only)
PUT    /api/contact/:id/read   # Mark message as read (admin only)
```

### 🏥 Health & Monitoring
```
GET    /api/health             # Comprehensive health check
GET    /health                 # Legacy health check
GET    /api/health/detailed    # Detailed system health
```

## 🧪 Testing

The project includes comprehensive testing with high coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:frontend       # Frontend integration tests

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth

# Run tests with verbose output
npm test -- --verbose
```

### Test Coverage

The project maintains high test coverage:
- **Unit Tests**: 95%+ coverage for services, models, and utilities
- **Integration Tests**: Complete API endpoint testing
- **Frontend Integration**: Tests for frontend compatibility

## 🚀 Deployment

### 🐳 Docker Deployment (Recommended)

1. **Build and run with Docker Compose:**
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

2. **Build Docker image manually:**
```bash
docker build -t maison-darin-backend .
docker run -p 5000:5000 --env-file .env maison-darin-backend
```

### 🏭 Production Deployment

1. **Set environment to production:**
```bash
export NODE_ENV=production
```

2. **Install PM2 globally:**
```bash
npm install -g pm2
```

3. **Start with PM2:**
```bash
pm2 start ecosystem.config.js --env production
```

4. **Set up Nginx reverse proxy:**
```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/maison-darin-backend
sudo ln -s /etc/nginx/sites-available/maison-darin-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### ☁️ Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI and login
heroku create maison-darin-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
# Set other environment variables
git push heroku main
```

#### AWS/DigitalOcean
- Use the provided Docker configuration
- Set up MongoDB Atlas for database
- Configure environment variables in your cloud provider
- Set up load balancer and SSL certificate

## 🔒 Security

The API implements comprehensive security measures:

### 🛡️ Authentication & Authorization
- **JWT Tokens**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Admin-only endpoints for management functions
- **Token Blacklisting**: Logout invalidates tokens

### 🚫 Attack Prevention
- **Rate Limiting**: Configurable limits for different endpoint types
- **CORS Protection**: Properly configured CORS for frontend integration
- **Input Validation**: Comprehensive validation and sanitization using Joi
- **MongoDB Injection**: Protection against NoSQL injection attacks
- **XSS Protection**: Input sanitization to prevent cross-site scripting
- **Security Headers**: Helmet.js for security headers (CSP, HSTS, etc.)

### 🔐 Data Protection
- **Environment Variables**: Sensitive data stored in environment variables
- **Secure Defaults**: Security-first configuration out of the box
- **HTTPS Ready**: SSL/TLS support for production deployment

## 📊 Monitoring & Logging

The application includes built-in monitoring and logging:

### 🏥 Health Monitoring
- **Health Check Endpoints**: Multiple health check endpoints for load balancers
- **Database Health**: MongoDB connection and query performance monitoring
- **System Metrics**: CPU, memory, and disk usage tracking
- **Custom Alerts**: Configurable alerts for critical issues

### 📈 Performance Monitoring
- **Request Metrics**: Response time, throughput, and error rate tracking
- **Database Performance**: Query performance and connection pool monitoring
- **Memory Usage**: Memory leak detection and garbage collection metrics
- **Custom Dashboards**: Built-in performance dashboard

### 📝 Logging
- **Structured Logging**: JSON-formatted logs with Winston
- **Log Levels**: Configurable log levels (error, warn, info, debug)
- **Request Logging**: HTTP request/response logging with Morgan
- **Error Tracking**: Comprehensive error logging and stack traces

## 🌍 Frontend Integration

### CORS Configuration
The API is configured to work seamlessly with frontend applications:

```javascript
// Allowed origins (configurable via environment)
const allowedOrigins = [
  'http://localhost:3000',      // React development
  'http://localhost:3001',      // Alternative port
  'https://maison-darin.com',   // Production domain
  'https://admin.maison-darin.com' // Admin panel
];
```

### API Response Format
All API responses follow a consistent format:

```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data here
  },
  "pagination": {  // For paginated responses
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Authentication Flow
```javascript
// 1. Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

// 2. Use access token for protected routes
GET /api/products
Authorization: Bearer <access_token>

// 3. Refresh token when needed
POST /api/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `npm test`
5. **Run linting**: `npm run lint:fix`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Submit a pull request**

### Code Standards
- **ESLint**: Follow the configured ESLint rules
- **Testing**: Maintain test coverage above 90%
- **Documentation**: Update documentation for new features
- **Commit Messages**: Use conventional commit format

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Follow the existing code style
5. Include a clear description of changes

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support & Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check connection string
echo $MONGODB_URI
```

#### Environment Variable Issues
```bash
# Validate environment variables
npm run validate-env

# Check required variables
node -e "require('./utils/validateEnv').validateEnv()"
```

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Getting Help

For support and questions:
- **Documentation**: Check the API documentation at `/api-docs`
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team
- **Logs**: Check application logs for detailed error information

### Performance Optimization

For production deployments:
- Use PM2 cluster mode for multi-core utilization
- Set up MongoDB replica sets for high availability
- Configure Redis for session storage and caching
- Use CDN for static assets
- Enable gzip compression
- Set up proper monitoring and alerting

---

**Built with ❤️ for Maison Darin**