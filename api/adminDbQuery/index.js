const { allAsync, getAsync } = require('../shared/db');
const { checkAdmin, getCorsHeaders } = require('../shared/helpers');

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders,
    };
    return;
  }

  try {
    const userId = req.query.userId || req.body.userId;
    const adminCheck = await checkAdmin(userId);
    
    if (!adminCheck.allowed) {
      context.res = {
        status: adminCheck.statusCode || 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: adminCheck.error },
      };
      return;
    }

    const { query, type = 'all' } = req.body;

    if (!query || typeof query !== 'string') {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Query SQL este obligatoriu' },
      };
      return;
    }

    // Siguranță: permite doar SELECT queries
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith('SELECT')) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Doar query-uri SELECT sunt permise pentru siguranță' },
      };
      return;
    }

    // Execută query-ul
    let result;
    const startTime = Date.now();
    
    if (type === 'get') {
      result = await getAsync(query);
    } else {
      result = await allAsync(query);
    }
    
    const executionTime = Date.now() - startTime;

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { 
        success: true,
        result,
        count: Array.isArray(result) ? result.length : (result ? 1 : 0),
        executionTime: `${executionTime}ms`
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { 
        error: 'Eroare la executarea query-ului',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
    };
  }
};
