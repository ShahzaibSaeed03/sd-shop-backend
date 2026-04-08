const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SD Shop',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: 'http://76.13.103.115',
      },
      {
        url: 'http://localhost:5000', // add local also
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },

  // ✅ FIXED PATH (IMPORTANT)
  apis: ['./src/modules/*/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;