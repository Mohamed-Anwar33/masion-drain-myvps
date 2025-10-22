# Maison Darin API - Postman Collection

This directory contains Postman collections and environments for testing the Maison Darin API.

## Files

- `Maison-Darin-API.postman_collection.json` - Complete API collection with all endpoints
- `Maison-Darin-Environment.postman_environment.json` - Environment variables for testing
- `Generated-Collection.postman_collection.json` - Auto-generated collection from Swagger docs

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click "Import" button
3. Import both the collection and environment files
4. Select the "Maison Darin Environment" from the environment dropdown

### 2. Configure Environment Variables

Update the following variables in the environment:

- `baseUrl` - API server URL (default: http://localhost:5000)
- `adminEmail` - Admin email for authentication
- `adminPassword` - Admin password for authentication

### 3. Authentication Setup

The collection uses Bearer token authentication. To get started:

1. Run the "Login" request in the Authentication folder
2. The access token will be automatically stored in the `accessToken` variable
3. All subsequent requests will use this token automatically

## Collection Structure

### Authentication
- **Login** - Authenticate and get access tokens
- **Verify Token** - Verify current token validity
- **Get Profile** - Get current user profile
- **Refresh Token** - Refresh access token using refresh token
- **Logout** - Invalidate current session

### Products
- **Get All Products** - Retrieve products with pagination and filtering
- **Get Featured Products** - Get products marked as featured
- **Get Categories** - Get all product categories
- **Create Product** - Create new product (admin only)
- **Get Product by ID** - Get specific product details
- **Update Product** - Update product information (admin only)
- **Update Stock** - Update product stock levels (admin only)
- **Check Availability** - Check product availability

### Orders
- **Create Order** - Create new customer order
- **Get Order Statistics** - Get order analytics (admin only)
- **Get All Orders** - List all orders with filtering (admin only)
- **Get Order by ID** - Get specific order details (admin only)
- **Update Order Status** - Update order status (admin only)

### Sample Requests
- **Submit Sample Request** - Request product samples
- **Get Sample Statistics** - Get sample request analytics (admin only)
- **Get All Sample Requests** - List all sample requests (admin only)
- **Update Sample Status** - Update sample request status (admin only)

### Contact Messages
- **Submit Contact Message** - Send contact form message
- **Get Contact Statistics** - Get contact message analytics (admin only)
- **Get All Contact Messages** - List all contact messages (admin only)
- **Update Message Status** - Update message status (admin only)

### Content Management
- **Get Translations** - Get all content translations
- **Get Content by Section** - Get content for specific section
- **Update Content** - Update content (admin only)

### Health Checks
- **Basic Health Check** - Check API health status
- **Database Health Check** - Check database connectivity
- **Readiness Probe** - Kubernetes readiness probe
- **Liveness Probe** - Kubernetes liveness probe

## Automated Testing

Each request includes automated tests that verify:

- Response status codes
- Response structure and required fields
- Authentication functionality
- Data validation
- Error handling

### Running Tests

1. **Individual Request**: Click "Send" on any request to run its tests
2. **Folder Tests**: Right-click on a folder and select "Run folder"
3. **Full Collection**: Use Postman's Collection Runner to run all tests

### Test Results

Tests will show in the "Test Results" tab:
- ✅ Green checkmarks indicate passing tests
- ❌ Red X marks indicate failing tests
- Test details and error messages are displayed for debugging

## Environment Variables

The collection uses the following variables that are automatically managed:

- `accessToken` - JWT access token (auto-populated after login)
- `refreshToken` - JWT refresh token (auto-populated after login)
- `testUserId` - User ID for testing (auto-populated)
- `testProductId` - Product ID for testing (auto-populated)
- `testOrderId` - Order ID for testing (auto-populated)
- `testSampleId` - Sample request ID for testing (auto-populated)
- `testContactId` - Contact message ID for testing (auto-populated)

## API Workflow Testing

The collection is designed to test complete workflows:

1. **Authentication Flow**: Login → Verify → Get Profile → Refresh → Logout
2. **Product Management**: Create → Read → Update → Delete
3. **Order Processing**: Create Order → Get Orders → Update Status
4. **Sample Requests**: Submit → Review → Update Status
5. **Contact Management**: Submit → Review → Respond

## Error Testing

The collection includes requests to test error scenarios:

- Invalid authentication tokens
- Missing required fields
- Invalid data formats
- Non-existent resources
- Rate limiting

## Development Workflow

### For API Development

1. Update API endpoints
2. Run the collection to ensure all tests pass
3. Update tests if API behavior changes
4. Regenerate collection from Swagger docs if needed

### For Frontend Development

1. Use the collection to understand API contracts
2. Test API integration during development
3. Verify error handling scenarios
4. Test authentication flows

## Generating Updated Collection

To generate a new collection from Swagger documentation:

```bash
node scripts/generate-postman-collection.js
```

This will create `Generated-Collection.postman_collection.json` based on the current Swagger specs.

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Run the Login request to get a fresh token
2. **404 Not Found**: Check if the server is running on the correct port
3. **Test Failures**: Verify environment variables are set correctly
4. **Rate Limiting**: Wait before retrying requests

### Debug Tips

- Check the Postman Console for detailed request/response logs
- Verify environment variables in the Environment tab
- Use the "Code" link to see generated code snippets
- Check server logs for backend errors

## Contributing

When adding new API endpoints:

1. Add the endpoint to the appropriate folder
2. Include comprehensive tests
3. Update environment variables if needed
4. Document any special setup requirements
5. Test the complete workflow

## Support

For issues with the API or Postman collection:

1. Check the API documentation at `/api-docs`
2. Review server logs for errors
3. Verify environment configuration
4. Test with curl or other tools to isolate issues