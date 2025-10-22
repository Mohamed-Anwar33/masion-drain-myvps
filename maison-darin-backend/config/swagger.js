const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Maison Darin API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Maison Darin luxury perfume backend system',
      contact: {
        name: 'Maison Darin Development Team',
        email: 'dev@maisondarin.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.maisondarin.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication. Format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Validation failed'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'email'
                      },
                      message: {
                        type: 'string',
                        example: 'Email is required'
                      },
                      code: {
                        type: 'string',
                        example: 'REQUIRED_FIELD'
                      }
                    }
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            path: {
              type: 'string',
              example: '/api/products'
            },
            method: {
              type: 'string',
              example: 'POST'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1
            },
            totalPages: {
              type: 'integer',
              example: 5
            },
            totalItems: {
              type: 'integer',
              example: 50
            },
            itemsPerPage: {
              type: 'integer',
              example: 10
            },
            hasNextPage: {
              type: 'boolean',
              example: true
            },
            hasPrevPage: {
              type: 'boolean',
              example: false
            }
          }
        },
        MultilingualText: {
          type: 'object',
          properties: {
            en: {
              type: 'string',
              description: 'English text'
            },
            ar: {
              type: 'string',
              description: 'Arabic text'
            }
          },
          required: ['en', 'ar']
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: [
                    {
                      field: 'email',
                      message: 'Email is required',
                      code: 'REQUIRED_FIELD'
                    }
                  ]
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/auth/login',
                method: 'POST'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Invalid or expired token',
                  details: []
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/products',
                method: 'POST'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                  details: []
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/products',
                method: 'DELETE'
              }
            }
          }
        },
        NotFound: {
          description: 'Not Found - Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                  details: []
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/products/123',
                method: 'GET'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests',
                  details: []
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/auth/login',
                method: 'POST'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Internal server error',
                  details: []
                },
                timestamp: '2024-01-15T10:30:00Z',
                path: '/api/products',
                method: 'GET'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog management endpoints'
      },
      {
        name: 'Media',
        description: 'Image and media file management endpoints'
      },
      {
        name: 'Content',
        description: 'Multilingual content management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order processing and management endpoints'
      },
      {
        name: 'Samples',
        description: 'Sample request management endpoints'
      },
      {
        name: 'Contact',
        description: 'Contact message management endpoints'
      },
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add any request interceptors here
      return req;
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
  `,
  customSiteTitle: 'Maison Darin API Documentation'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};