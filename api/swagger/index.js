const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://ashy-mud-055a0ce03.1.azurestaticapps.net';
const API_VERSION = process.env.npm_package_version || '0.0.0';

// OpenAPI 3.0 specification pentru Azure Functions
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MedAI API',
    version: API_VERSION,
    description: 'Backend Azure Functions (SQLite) pentru MedAI',
  },
  servers: [
    { url: PUBLIC_BASE_URL, description: 'Production' }
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check (server + DB)',
        tags: ['System'],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    version: { type: 'string' },
                    timestamp: { type: 'string' },
                    uptimeSeconds: { type: 'number' },
                    db: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        path: { type: 'string' },
                        medicationsCount: { type: 'number', nullable: true },
                        error: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Service Unavailable',
          },
        },
      },
    },
    '/api/help': {
      get: {
        summary: 'Lista rutelor disponibile + link către Swagger',
        tags: ['System'],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/api/medications': {
      get: {
        summary: 'Listă medicamente (query: search, limit, offset)',
        tags: ['Medications'],
        parameters: [
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Caută în denumire/substanță/cod',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { oneOf: [{ type: 'integer' }, { type: 'string', enum: ['all'] }] },
            description: 'Număr rezultate per pagină sau "all"',
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
    '/api/medications/{id}': {
      get: {
        summary: 'Detalii medicament',
        tags: ['Medications'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
          '404': {
            description: 'Not Found',
          },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        summary: 'Înregistrare utilizator',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nume', 'email', 'parola'],
                properties: {
                  nume: { type: 'string' },
                  email: { type: 'string' },
                  parola: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
          },
          '400': {
            description: 'Bad Request',
          },
          '409': {
            description: 'Conflict',
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Autentificare utilizator',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'parola'],
                properties: {
                  email: { type: 'string' },
                  parola: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/admin/db-query': {
      post: {
        summary: 'Admin: execută query SQL SELECT',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'query'],
                properties: {
                  userId: { type: 'integer', description: 'ID admin' },
                  query: { type: 'string', description: 'Query SQL SELECT' },
                  type: { type: 'string', enum: ['all', 'get'], default: 'all' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
          '400': {
            description: 'Bad Request',
          },
          '403': {
            description: 'Forbidden',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};

module.exports = async function (context, req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders,
    };
    return;
  }

  // Returnează spec-ul OpenAPI
  context.res = {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: swaggerSpec,
  };
};
