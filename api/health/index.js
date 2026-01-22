const { getAsync } = require('../shared/db');

const API_VERSION = process.env.npm_package_version || '0.0.0';
const DB_PATH = require('../shared/db').DB_PATH;

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

  const payload = {
    status: 'ok',
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    db: {
      status: 'unknown',
      path: DB_PATH,
      medicationsCount: null,
      error: null,
    },
  };

  try {
    await getAsync('SELECT 1 as ok');
    const countRow = await getAsync('SELECT COUNT(*) as count FROM medications');
    payload.db.status = 'ok';
    payload.db.medicationsCount = typeof countRow?.count === 'number' ? countRow.count : null;
    
    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: payload,
    };
  } catch (err) {
    payload.status = 'degraded';
    payload.db.status = 'error';
    payload.db.error = err?.message || String(err);
    
    context.res = {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: payload,
    };
  }
};
