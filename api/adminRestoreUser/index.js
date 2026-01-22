const { getAsync, runAsync } = require('../shared/db');
const { checkAdmin, getCorsHeaders } = require('../shared/helpers');

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  try {
    const targetUserId = context.bindingData.userId;
    const adminUserId = req.query.userId || req.body.userId;
    
    const adminCheck = await checkAdmin(adminUserId);
    if (!adminCheck.allowed) {
      context.res = {
        status: adminCheck.statusCode || 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: adminCheck.error },
      };
      return;
    }

    if (!targetUserId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator lipsă' },
      };
      return;
    }

    const user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserId]);
    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Utilizatorul nu a fost găsit' },
      };
      return;
    }

    if (!user.deleted_at) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Contul nu este șters' },
      };
      return;
    }

    await runAsync('UPDATE users SET deleted_at = NULL WHERE id = ?', [targetUserId]);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, message: 'Cont restaurat cu succes' },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la restaurare cont' },
    };
  }
};
