// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('maison-darin');

// Create application user with read/write permissions
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'maison-darin'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 8
        },
        role: {
          bsonType: 'string',
          enum: ['admin']
        }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'price', 'size', 'category'],
      properties: {
        price: {
          bsonType: 'number',
          minimum: 0
        },
        category: {
          bsonType: 'string',
          enum: ['floral', 'oriental', 'fresh', 'woody', 'citrus', 'spicy', 'aquatic', 'gourmand']
        }
      }
    }
  }
});

db.createCollection('contents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['section', 'content', 'updatedBy'],
      properties: {
        section: {
          bsonType: 'string',
          enum: ['hero', 'about', 'nav', 'contact', 'collections', 'footer']
        }
      }
    }
  }
});

print('✅ Database initialization completed');
print('✅ Collections created with validation rules');
print('✅ Application user created');