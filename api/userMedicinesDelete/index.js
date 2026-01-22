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
    const id = context.bindingData.id;

    if (!userId || !id) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator sau medicament lipsă' },
      };
      return;
    }

    const existing = await getAsync('SELECT id FROM user_medicines WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Medicament negăsit' },
      };
      return;
    }

    await runAsync('DELETE FROM user_medicines WHERE id = ? AND user_id = ?', [id, userId]);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la ștergerea medicamentului' },
    };
  }
};
