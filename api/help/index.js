const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://ashy-mud-055a0ce03.1.azurestaticapps.net';
const API_VERSION = process.env.npm_package_version || '0.0.0';

const HELP_ROUTES = [
  { method: 'GET', path: '/api/health', description: 'Health check (server + DB)' },
  { method: 'GET', path: '/api/help', description: 'Lista rutelor și link către Swagger' },
  { method: 'GET', path: '/api/medications', description: 'Listă medicamente (query: search, limit, offset)' },
  { method: 'GET', path: '/api/medications/{id}', description: 'Detalii medicament' },
  { method: 'POST', path: '/api/auth/signup', description: 'Înregistrare utilizator' },
  { method: 'POST', path: '/api/auth/login', description: 'Autentificare utilizator' },
  { method: 'POST', path: '/api/auth/recover', description: 'Recuperare cont șters' },
  { method: 'GET', path: '/api/auth/me', description: 'Detalii utilizator (query: userId)' },
  { method: 'GET', path: '/api/auth/status', description: 'Status cont (query: userId)' },
  { method: 'DELETE', path: '/api/auth/delete', description: 'Ștergere cont propriu (query: userId)' },
  { method: 'GET', path: '/api/user-medicines', description: 'Medicamente adăugate de utilizator (query: userId)' },
  { method: 'POST', path: '/api/user-medicines', description: 'Adaugă medicament utilizator (body: userId, denumire, ...)' },
  { method: 'PUT', path: '/api/user-medicines/{id}', description: 'Actualizează medicament utilizator (body/query: userId)' },
  { method: 'DELETE', path: '/api/user-medicines/{id}', description: 'Șterge medicament utilizator (query/body: userId)' },
  { method: 'POST', path: '/api/prescriptions', description: 'Creează rețetă' },
  { method: 'GET', path: '/api/prescriptions', description: 'Listă rețete (query: userId)' },
  { method: 'DELETE', path: '/api/prescriptions/{id}', description: 'Șterge o rețetă (query: userId)' },
  { method: 'DELETE', path: '/api/prescriptions', description: 'Șterge toate rețetele (query: userId)' },
  { method: 'GET', path: '/api/admin/requests', description: 'Admin: listă cereri (query: userId, showDeleted, status)' },
  { method: 'POST', path: '/api/admin/approve/{userId}', description: 'Admin: aprobare cont (query/body: userId=adminId)' },
  { method: 'POST', path: '/api/admin/reject/{userId}', description: 'Admin: respingere cont (query/body: userId=adminId)' },
  { method: 'POST', path: '/api/admin/change-status/{userId}', description: 'Admin: schimbă status (query/body: userId=adminId)' },
  { method: 'DELETE', path: '/api/admin/delete-user/{userId}', description: 'Admin: șterge utilizator (query/body: userId=adminId)' },
  { method: 'POST', path: '/api/admin/restore-user/{userId}', description: 'Admin: restaurează utilizator (query/body: userId=adminId)' },
  { method: 'GET', path: '/api/admin/user-prescriptions/{userId}', description: 'Admin: rețete utilizator (query/body: userId=adminId)' },
  { method: 'DELETE', path: '/api/admin/prescriptions/{prescriptionId}', description: 'Admin: șterge rețetă (query/body: userId=adminId)' },
  { method: 'POST', path: '/api/admin/db-query', description: 'Admin: execută query SQL SELECT (body: userId, query, type)' },
];

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

  const response = {
    name: 'MedAI backend',
    version: API_VERSION,
    docs: {
      swaggerUi: `${PUBLIC_BASE_URL}/api/swagger`,
      openapiJson: `${PUBLIC_BASE_URL}/api/swagger`,
      help: `${PUBLIC_BASE_URL}/api/help`,
    },
    routes: HELP_ROUTES,
  };

  context.res = {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: response,
  };
};
