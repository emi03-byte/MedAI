const { allAsync } = require('../shared/db');
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

    const items = await allAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { medicines: items },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la listarea medicamentelor' },
    };
  }
};
