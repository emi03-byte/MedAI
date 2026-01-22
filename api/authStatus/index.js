const { getAsync } = require('../shared/db');
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
    const userId = req.query.userId;

    if (!userId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator lipsă' },
      };
      return;
    }

    const user = await getAsync('SELECT id, status, is_admin FROM users WHERE id = ?', [userId]);

    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Utilizator negăsit' },
      };
      return;
    }

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { status: user.status || 'pending', is_admin: user.is_admin || 0 },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la verificare status' },
    };
  }
};
