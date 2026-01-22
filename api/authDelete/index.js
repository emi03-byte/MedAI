const { getAsync, runAsync } = require('../shared/db');
const { getCorsHeaders } = require('../shared/helpers');

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

    if (!userId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator lipsă' },
      };
      return;
    }

    const user = await getAsync('SELECT id, deleted_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Utilizator negăsit' },
      };
      return;
    }

    if (user.deleted_at) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Contul este deja șters' },
      };
      return;
    }

    await runAsync('UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, message: 'Cont șters cu succes' },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la ștergerea contului' },
    };
  }
};
