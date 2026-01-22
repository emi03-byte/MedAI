const { runAsync, getAsync } = require('../shared/db');
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
    const { userId, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note } = req.body;

    if (!userId || !denumire) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator și denumirea sunt obligatorii' },
      };
      return;
    }

    const result = await runAsync(
      'INSERT INTO user_medicines (user_id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, denumire, forma_farmaceutica || null, concentratie || null, substanta_activa || null, cod_atc || null, mod_prescriere || null, note || null]
    );

    const created = await getAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE id = ? AND user_id = ?',
      [result.lastID, userId]
    );

    context.res = {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, medicine: created },
    };
  } catch (error) {
    console.error('❌ [USER MEDICINES POST] Eroare:', error);
    console.error('❌ [USER MEDICINES POST] Stack:', error.stack);
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { 
        error: 'Eroare la crearea medicamentului',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
    };
  }
};
