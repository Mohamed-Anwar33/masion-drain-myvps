# API Usage Guide

This guide provides comprehensive examples and best practices for integrating with the Maison Darin Backend API.

## 🚀 Getting Started

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.maison-darin.com/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔐 Authentication Flow

### 1. Login
```javascript
// POST /api/auth/login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'your-password'
  })
});

const loginData = await loginResponse.json();

if (loginData.success) {
  const { accessToken, refreshToken, user } = loginData.data;
  
  // Store tokens securely
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  console.log('Logged in as:', user.email);
}
```

### 2. Using Protected Endpoints
```javascript
// Example: Get products with authentication
const token = localStorage.getItem('accessToken');

const productsResponse = await fetch('/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const productsData = await productsResponse.json();
```

### 3. Token Refresh
```javascript
// POST /api/auth/refresh
const refreshToken = localStorage.getItem('refreshToken');

const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    refreshToken: refreshToken
  })
});

const refreshData = await refreshResponse.json();

if (refreshData.success) {
  const { accessToken } = refreshData.data;
  localStorage.setItem('accessToken', accessToken);
}
```

### 4. Logout
```javascript
// POST /api/auth/logout
const token = localStorage.getItem('accessToken');

await fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Clear stored tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

## 🛍️ Product Management

### 1. Get All Products
```javascript
// GET /api/products
// Supports filtering, search, and pagination

const params = new URLSearchParams({
  page: '1',
  limit: '20',
  category: 'floral',
  search: 'rose',
  featured: 'true',
  sortBy: 'price',
  sortOrder: 'asc'
});

const response = await fetch(`/api/products?${params}`);
const data = await response.json();

if (data.success) {
  const { products, pagination } = data.data;
  
  console.log('Products:', products);
  console.log('Pagination:', pagination);
}
```

### 2. Get Single Product
```javascript
// GET /api/products/:id
const productId = '507f1f77bcf86cd799439011';

const response = await fetch(`/api/products/${productId}`);
const data = await response.json();

if (data.success) {
  const product = data.data;
  console.log('Product:', product);
}
```

### 3. Create Product (Admin Only)
```javascript
// POST /api/products
const token = localStorage.getItem('accessToken');

const productData = {
  name: {
    en: 'Rose Garden Perfume',
    ar: 'عطر حديقة الورود'
  },
  description: {
    en: 'A beautiful floral fragrance with notes of rose and jasmine',
    ar: 'عطر زهري جميل بنفحات الورد والياسمين'
  },
  longDescription: {
    en: 'This exquisite perfume captures the essence of a blooming rose garden...',
    ar: 'يلتقط هذا العطر الرائع جوهر حديقة الورود المزهرة...'
  },
  price: 299.99,
  size: '100ml',
  category: 'floral',
  featured: true,
  inStock: true,
  stock: 50,
  concentration: {
    en: 'Eau de Parfum',
    ar: 'أو دو بارفان'
  },
  notes: {
    top: {
      en: ['Rose', 'Bergamot', 'Pink Pepper'],
      ar: ['ورد', 'برغموت', 'فلفل وردي']
    },
    middle: {
      en: ['Jasmine', 'Peony', 'Lily of the Valley'],
      ar: ['ياسمين', 'فاوانيا', 'زنبق الوادي']
    },
    base: {
      en: ['Sandalwood', 'Musk', 'Amber'],
      ar: ['صندل', 'مسك', 'عنبر']
    }
  },
  seo: {
    metaTitle: {
      en: 'Rose Garden Perfume - Luxury Floral Fragrance',
      ar: 'عطر حديقة الورود - عطر زهري فاخر'
    },
    metaDescription: {
      en: 'Discover our Rose Garden perfume, a luxurious floral fragrance...',
      ar: 'اكتشف عطر حديقة الورود، عطر زهري فاخر...'
    }
  }
};

const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(productData)
});

const data = await response.json();

if (data.success) {
  console.log('Product created:', data.data);
}
```

### 4. Update Product (Admin Only)
```javascript
// PUT /api/products/:id
const token = localStorage.getItem('accessToken');
const productId = '507f1f77bcf86cd799439011';

const updateData = {
  price: 349.99,
  stock: 25,
  featured: false
};

const response = await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

const data = await response.json();

if (data.success) {
  console.log('Product updated:', data.data);
}
```

### 5. Delete Product (Admin Only)
```javascript
// DELETE /api/products/:id
const token = localStorage.getItem('accessToken');
const productId = '507f1f77bcf86cd799439011';

const response = await fetch(`/api/products/${productId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  console.log('Product deleted successfully');
}
```

## 🖼️ Media Management

### 1. Upload Image (Admin Only)
```javascript
// POST /api/media/upload
const token = localStorage.getItem('accessToken');
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('image', file);
formData.append('altEn', 'Product image');
formData.append('altAr', 'صورة المنتج');
formData.append('tags', 'product,perfume,luxury');
formData.append('folder', 'products');

const response = await fetch('/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();

if (data.success) {
  const media = data.data;
  console.log('Image uploaded:', media.cloudinaryUrl);
}
```

### 2. Get Media Library (Admin Only)
```javascript
// GET /api/media
const token = localStorage.getItem('accessToken');

const params = new URLSearchParams({
  page: '1',
  limit: '20',
  search: 'product',
  mimetype: 'image/jpeg',
  sortBy: 'uploadedAt',
  sortOrder: 'desc'
});

const response = await fetch(`/api/media?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  const { media, pagination } = data.data;
  console.log('Media files:', media);
}
```

### 3. Update Media Metadata (Admin Only)
```javascript
// PUT /api/media/:id
const token = localStorage.getItem('accessToken');
const mediaId = '507f1f77bcf86cd799439011';

const updateData = {
  altEn: 'Updated English alt text',
  altAr: 'نص بديل محدث بالعربية',
  tags: ['updated', 'product', 'perfume']
};

const response = await fetch(`/api/media/${mediaId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

const data = await response.json();

if (data.success) {
  console.log('Media updated:', data.data);
}
```

## 📝 Content Management

### 1. Get All Translations
```javascript
// GET /api/content/translations
const response = await fetch('/api/content/translations');
const data = await response.json();

if (data.success) {
  const translations = data.data;
  
  // Access specific content
  const heroContent = translations.hero;
  const aboutContent = translations.about;
  
  console.log('Hero EN:', heroContent.en);
  console.log('Hero AR:', heroContent.ar);
}
```

### 2. Get Content by Section
```javascript
// GET /api/content/:section
const section = 'hero';

const response = await fetch(`/api/content/${section}`);
const data = await response.json();

if (data.success) {
  const content = data.data;
  console.log('Section content:', content);
}
```

### 3. Update Content Section (Admin Only)
```javascript
// PUT /api/content/:section
const token = localStorage.getItem('accessToken');
const section = 'hero';

const contentData = {
  content: {
    en: {
      title: 'Welcome to Maison Darin',
      subtitle: 'Luxury Perfumes & Fragrances',
      description: 'Discover our exclusive collection of premium perfumes',
      buttonText: 'Shop Now'
    },
    ar: {
      title: 'مرحباً بكم في ميزون دارين',
      subtitle: 'العطور والروائح الفاخرة',
      description: 'اكتشفوا مجموعتنا الحصرية من العطور المميزة',
      buttonText: 'تسوق الآن'
    }
  }
};

const response = await fetch(`/api/content/${section}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contentData)
});

const data = await response.json();

if (data.success) {
  console.log('Content updated:', data.data);
}
```

## 📦 Order Management

### 1. Create Order
```javascript
// POST /api/orders
const orderData = {
  items: [
    {
      product: '507f1f77bcf86cd799439011',
      quantity: 2,
      price: 299.99
    },
    {
      product: '507f1f77bcf86cd799439012',
      quantity: 1,
      price: 249.99
    }
  ],
  customerInfo: {
    firstName: 'Ahmed',
    lastName: 'Al-Rashid',
    email: 'ahmed@example.com',
    phone: '+971501234567',
    address: '123 Sheikh Zayed Road',
    city: 'Dubai',
    postalCode: '12345',
    country: 'UAE'
  },
  paymentMethod: 'card',
  notes: 'Please handle with care'
};

const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});

const data = await response.json();

if (data.success) {
  const order = data.data;
  console.log('Order created:', order.orderNumber);
}
```

### 2. Get Orders (Admin Only)
```javascript
// GET /api/orders
const token = localStorage.getItem('accessToken');

const params = new URLSearchParams({
  page: '1',
  limit: '20',
  status: 'pending',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

const response = await fetch(`/api/orders?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  const { orders, pagination } = data.data;
  console.log('Orders:', orders);
}
```

### 3. Update Order Status (Admin Only)
```javascript
// PUT /api/orders/:id/status
const token = localStorage.getItem('accessToken');
const orderId = '507f1f77bcf86cd799439011';

const statusData = {
  orderStatus: 'confirmed',
  notes: 'Order confirmed and being processed'
};

const response = await fetch(`/api/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(statusData)
});

const data = await response.json();

if (data.success) {
  console.log('Order status updated:', data.data);
}
```

## 🧪 Sample Requests

### 1. Request Sample
```javascript
// POST /api/samples/request
const sampleData = {
  customerInfo: {
    firstName: 'Fatima',
    lastName: 'Al-Zahra',
    email: 'fatima@example.com',
    phone: '+971501234567',
    address: '456 Jumeirah Beach Road',
    city: 'Dubai',
    country: 'UAE'
  },
  products: [
    {
      product: '507f1f77bcf86cd799439011',
      quantity: 1
    }
  ],
  message: 'I would like to try this perfume before purchasing'
};

const response = await fetch('/api/samples/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(sampleData)
});

const data = await response.json();

if (data.success) {
  console.log('Sample request submitted:', data.data);
}
```

### 2. Get Sample Requests (Admin Only)
```javascript
// GET /api/samples
const token = localStorage.getItem('accessToken');

const response = await fetch('/api/samples', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  const samples = data.data;
  console.log('Sample requests:', samples);
}
```

## 📞 Contact Messages

### 1. Submit Contact Message
```javascript
// POST /api/contact
const contactData = {
  name: 'Omar Hassan',
  email: 'omar@example.com',
  phone: '+971501234567',
  subject: 'Product Inquiry',
  message: 'I have a question about your Rose Garden perfume...',
  category: 'product_inquiry'
};

const response = await fetch('/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contactData)
});

const data = await response.json();

if (data.success) {
  console.log('Message submitted:', data.data);
}
```

### 2. Get Contact Messages (Admin Only)
```javascript
// GET /api/contact/messages
const token = localStorage.getItem('accessToken');

const params = new URLSearchParams({
  page: '1',
  limit: '20',
  status: 'unread',
  category: 'product_inquiry'
});

const response = await fetch(`/api/contact/messages?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  const { messages, pagination } = data.data;
  console.log('Contact messages:', messages);
}
```

## 🏥 Health Checks

### 1. Basic Health Check
```javascript
// GET /api/health
const response = await fetch('/api/health');
const data = await response.json();

if (data.success) {
  console.log('API Status:', data.data.status);
  console.log('Database:', data.data.database.status);
}
```

### 2. Detailed Health Check
```javascript
// GET /api/health/detailed
const response = await fetch('/api/health/detailed');
const data = await response.json();

if (data.success) {
  const health = data.data;
  console.log('System Health:', health);
}
```

## 🔧 Error Handling

### Standard Error Response Format
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED_FIELD"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/products",
  "method": "POST"
}
```

### Error Handling Best Practices
```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      // Handle API errors
      console.error('API Error:', data.error);
      
      switch (data.error.code) {
        case 'UNAUTHORIZED':
          // Redirect to login or refresh token
          handleUnauthorized();
          break;
        case 'VALIDATION_ERROR':
          // Show validation errors to user
          showValidationErrors(data.error.details);
          break;
        case 'RATE_LIMIT_EXCEEDED':
          // Show rate limit message
          showRateLimitMessage();
          break;
        default:
          // Show generic error message
          showGenericError(data.error.message);
      }
      
      return null;
    }
    
    return data.data;
  } catch (error) {
    // Handle network errors
    console.error('Network Error:', error);
    showNetworkError();
    return null;
  }
}
```

## 🔄 Pagination

### Handling Paginated Responses
```javascript
async function getAllProducts(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  
  if (data.success) {
    const { products, pagination } = data.data;
    
    console.log('Products:', products);
    console.log('Current Page:', pagination.currentPage);
    console.log('Total Pages:', pagination.totalPages);
    console.log('Total Items:', pagination.totalItems);
    console.log('Has Next:', pagination.hasNext);
    console.log('Has Previous:', pagination.hasPrev);
    
    return { products, pagination };
  }
  
  return null;
}

// Usage
const result = await getAllProducts(1, 10);
if (result && result.pagination.hasNext) {
  const nextPage = await getAllProducts(2, 10);
}
```

## 🔍 Search and Filtering

### Advanced Product Search
```javascript
async function searchProducts(searchParams) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    featured,
    inStock,
    sortBy,
    sortOrder,
    page,
    limit
  } = searchParams;
  
  const params = new URLSearchParams();
  
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (minPrice) params.append('minPrice', minPrice.toString());
  if (maxPrice) params.append('maxPrice', maxPrice.toString());
  if (featured !== undefined) params.append('featured', featured.toString());
  if (inStock !== undefined) params.append('inStock', inStock.toString());
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  
  return data.success ? data.data : null;
}

// Usage examples
const floralPerfumes = await searchProducts({
  category: 'floral',
  inStock: true,
  sortBy: 'price',
  sortOrder: 'asc'
});

const searchResults = await searchProducts({
  search: 'rose',
  minPrice: 200,
  maxPrice: 500,
  featured: true
});
```

## 🌍 Multilingual Support

### Working with Multilingual Content
```javascript
// Helper function to get content in user's language
function getLocalizedContent(content, language = 'en') {
  if (content && typeof content === 'object') {
    return content[language] || content.en || content;
  }
  return content;
}

// Usage with products
const product = await getProduct('507f1f77bcf86cd799439011');
const userLanguage = 'ar'; // or 'en'

const localizedName = getLocalizedContent(product.name, userLanguage);
const localizedDescription = getLocalizedContent(product.description, userLanguage);

console.log('Product Name:', localizedName);
console.log('Description:', localizedDescription);

// Usage with content
const heroContent = await getContent('hero');
const localizedHero = getLocalizedContent(heroContent.content, userLanguage);

console.log('Hero Title:', localizedHero.title);
console.log('Hero Subtitle:', localizedHero.subtitle);
```

## 📱 React Integration Examples

### Custom Hook for API Calls
```javascript
// useApi.js
import { useState, useEffect } from 'react';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError({ message: err.message });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [url]);
  
  return { data, loading, error };
}

// Usage in component
function ProductList() {
  const { data: products, loading, error } = useApi('/api/products');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {products?.products?.map(product => (
        <div key={product._id}>
          <h3>{product.name.en}</h3>
          <p>{product.description.en}</p>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Authentication Context
```javascript
// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Verify token and get user info
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const { accessToken, refreshToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      return true;
    }
    
    return false;
  };
  
  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };
  
  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

## 🚀 Performance Optimization

### Caching Strategies
```javascript
// Simple in-memory cache
class ApiCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

// Cached API call
async function getCachedProducts() {
  const cacheKey = 'products';
  let products = apiCache.get(cacheKey);
  
  if (!products) {
    const response = await fetch('/api/products');
    const data = await response.json();
    
    if (data.success) {
      products = data.data;
      apiCache.set(cacheKey, products);
    }
  }
  
  return products;
}
```

### Request Debouncing
```javascript
// Debounce search requests
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage in search component
const debouncedSearch = debounce(async (query) => {
  if (query.length > 2) {
    const results = await searchProducts({ search: query });
    setSearchResults(results);
  }
}, 300);

// In input handler
const handleSearchInput = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  debouncedSearch(query);
};
```

---

This guide covers the most common use cases for the Maison Darin Backend API. For more detailed information, refer to the interactive API documentation at `/api-docs` when the server is running.