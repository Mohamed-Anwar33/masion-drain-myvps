#!/usr/bin/env node

/**
 * Generate Postman Collection from Swagger Documentation
 * This script creates a comprehensive Postman collection based on the API routes
 */

const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// Import swagger configuration
const { specs } = require('../config/swagger');

class PostmanGenerator {
  constructor() {
    this.collection = {
      info: {
        name: 'Maison Darin API - Generated',
        description: 'Auto-generated API collection from Swagger documentation',
        version: '1.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{accessToken}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'http://localhost:5000',
          type: 'string'
        },
        {
          key: 'accessToken',
          value: '',
          type: 'string'
        }
      ],
      item: []
    };
  }

  /**
   * Generate collection from Swagger specs
   */
  generateFromSwagger() {
    try {
      console.log('📋 Generating Postman collection from Swagger documentation...');
      
      // Parse swagger specs
      const swaggerDoc = specs;
      
      if (!swaggerDoc || !swaggerDoc.paths) {
        throw new Error('Invalid Swagger documentation');
      }

      // Group endpoints by tags
      const groupedEndpoints = this.groupEndpointsByTags(swaggerDoc);
      
      // Generate collection items
      for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
        const folder = {
          name: tag,
          item: []
        };

        for (const endpoint of endpoints) {
          const item = this.createPostmanItem(endpoint);
          if (item) {
            folder.item.push(item);
          }
        }

        if (folder.item.length > 0) {
          this.collection.item.push(folder);
        }
      }

      console.log(`✅ Generated collection with ${this.collection.item.length} folders`);
      return this.collection;

    } catch (error) {
      console.error('❌ Error generating collection:', error.message);
      throw error;
    }
  }

  /**
   * Group endpoints by their tags
   */
  groupEndpointsByTags(swaggerDoc) {
    const grouped = {};

    for (const [path, methods] of Object.entries(swaggerDoc.paths)) {
      for (const [method, spec] of Object.entries(methods)) {
        if (typeof spec !== 'object' || !spec.tags) continue;

        const tag = spec.tags[0] || 'Untagged';
        
        if (!grouped[tag]) {
          grouped[tag] = [];
        }

        grouped[tag].push({
          path,
          method: method.toUpperCase(),
          spec
        });
      }
    }

    return grouped;
  }

  /**
   * Create Postman item from endpoint specification
   */
  createPostmanItem(endpoint) {
    const { path, method, spec } = endpoint;

    try {
      const item = {
        name: spec.summary || `${method} ${path}`,
        event: [
          {
            listen: 'test',
            script: {
              exec: this.generateTestScript(method, spec),
              type: 'text/javascript'
            }
          }
        ],
        request: {
          method: method,
          header: this.generateHeaders(spec),
          url: this.generateUrl(path, spec),
          ...(this.generateBody(spec) && { body: this.generateBody(spec) })
        }
      };

      return item;

    } catch (error) {
      console.warn(`⚠️  Skipping endpoint ${method} ${path}:`, error.message);
      return null;
    }
  }

  /**
   * Generate test script for the endpoint
   */
  generateTestScript(method, spec) {
    const tests = [
      "pm.test('Status code is successful', function () {",
      "    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);",
      "});",
      "",
      "pm.test('Response has correct structure', function () {",
      "    const jsonData = pm.response.json();",
      "    pm.expect(jsonData).to.have.property('success');",
      "});"
    ];

    // Add specific tests based on method
    if (method === 'POST') {
      tests.push(
        "",
        "pm.test('Resource created successfully', function () {",
        "    pm.expect(pm.response.code).to.equal(201);",
        "});"
      );
    }

    // Add authentication tests for protected endpoints
    if (spec.security && spec.security.length > 0) {
      tests.push(
        "",
        "pm.test('Authentication is working', function () {",
        "    pm.expect(pm.response.code).to.not.equal(401);",
        "});"
      );
    }

    return tests;
  }

  /**
   * Generate headers for the request
   */
  generateHeaders(spec) {
    const headers = [];

    // Add content-type for requests with body
    if (spec.requestBody) {
      headers.push({
        key: 'Content-Type',
        value: 'application/json'
      });
    }

    return headers;
  }

  /**
   * Generate URL object for the request
   */
  generateUrl(path, spec) {
    // Replace path parameters with Postman variables
    const postmanPath = path.replace(/{([^}]+)}/g, '{{$1}}');
    
    const url = {
      raw: `{{baseUrl}}${postmanPath}`,
      host: ['{{baseUrl}}'],
      path: postmanPath.split('/').filter(p => p)
    };

    // Add query parameters if defined
    if (spec.parameters) {
      const queryParams = spec.parameters
        .filter(param => param.in === 'query')
        .map(param => ({
          key: param.name,
          value: this.getExampleValue(param),
          description: param.description
        }));

      if (queryParams.length > 0) {
        url.query = queryParams;
      }
    }

    return url;
  }

  /**
   * Generate request body
   */
  generateBody(spec) {
    if (!spec.requestBody) return null;

    const content = spec.requestBody.content;
    if (!content || !content['application/json']) return null;

    const schema = content['application/json'].schema;
    const example = this.generateExampleFromSchema(schema);

    return {
      mode: 'raw',
      raw: JSON.stringify(example, null, 2)
    };
  }

  /**
   * Generate example value from parameter
   */
  getExampleValue(param) {
    if (param.example !== undefined) return param.example;
    if (param.schema && param.schema.example !== undefined) return param.schema.example;
    if (param.schema && param.schema.default !== undefined) return param.schema.default;

    // Generate based on type
    switch (param.schema?.type) {
      case 'integer':
        return 1;
      case 'number':
        return 1.0;
      case 'boolean':
        return true;
      case 'string':
        return param.name === 'id' ? '{{testId}}' : 'example';
      default:
        return 'example';
    }
  }

  /**
   * Generate example object from schema
   */
  generateExampleFromSchema(schema) {
    if (!schema) return {};

    if (schema.example) return schema.example;
    if (schema.$ref) return {}; // Handle references

    if (schema.type === 'object' && schema.properties) {
      const example = {};
      
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (prop.example !== undefined) {
          example[key] = prop.example;
        } else {
          example[key] = this.generateExampleFromSchema(prop);
        }
      }

      return example;
    }

    if (schema.type === 'array' && schema.items) {
      return [this.generateExampleFromSchema(schema.items)];
    }

    // Generate based on type
    switch (schema.type) {
      case 'string':
        return 'example';
      case 'integer':
        return 1;
      case 'number':
        return 1.0;
      case 'boolean':
        return true;
      default:
        return null;
    }
  }

  /**
   * Save collection to file
   */
  saveCollection(outputPath) {
    try {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(this.collection, null, 2));
      console.log(`💾 Collection saved to: ${outputPath}`);
      
      return outputPath;

    } catch (error) {
      console.error('❌ Error saving collection:', error.message);
      throw error;
    }
  }

  /**
   * Generate and save collection
   */
  async generate(outputPath = './postman/Generated-Collection.postman_collection.json') {
    try {
      this.generateFromSwagger();
      return this.saveCollection(outputPath);

    } catch (error) {
      console.error('❌ Failed to generate Postman collection:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const outputPath = args[0] || './postman/Generated-Collection.postman_collection.json';

  console.log('🚀 Starting Postman collection generation...');
  
  const generator = new PostmanGenerator();
  await generator.generate(outputPath);
  
  console.log('✅ Postman collection generation completed!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PostmanGenerator;