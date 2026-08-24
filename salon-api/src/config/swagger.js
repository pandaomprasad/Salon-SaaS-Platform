const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salon SaaS Platform API',
      version: '1.0.0',
      description: 'Comprehensive RESTful API documentation covering authentication, salon browse, branch management, staff, services, slots, and appointments.',
    },
    servers: [
      {
        url: 'http://localhost:6969/api/v1',
        description: 'Development Server',
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('📑 Swagger OpenAPI UI available at http://localhost:6969/api-docs');
  }
};

module.exports = setupSwagger;
