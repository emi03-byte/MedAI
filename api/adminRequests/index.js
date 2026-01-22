const { allAsync } = require('../shared/db');
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

    const { status, showDeleted } = req.query;
    let query = 'SELECT id, nume, email, data_creare, status, data_aprobare, is_admin, deleted_at FROM users';
    const params = [];
    const conditions = [];

    if (!showDeleted || showDeleted !== 'true') {
      conditions.push('deleted_at IS NULL');
    } else {
      conditions.push('deleted_at IS NOT NULL');
    }

    if (status && status !== 'toate') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY data_creare DESC';

    const requests = await allAsync(query, params);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { requests },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la listare cereri' },
    };
  }
};
