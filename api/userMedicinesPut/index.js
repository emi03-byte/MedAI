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
    const userId = req.body.userId || req.query.userId;
    const id = context.bindingData.id;
    const { denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note } = req.body;

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

    if (!denumire) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Denumirea este obligatorie' },
      };
      return;
    }

    await runAsync(
      `UPDATE user_medicines
       SET denumire = ?, forma_farmaceutica = ?, concentratie = ?, substanta_activa = ?, cod_atc = ?, mod_prescriere = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [denumire, forma_farmaceutica || null, concentratie || null, substanta_activa || null, cod_atc || null, mod_prescriere || null, note || null, id, userId]
    );

    const updated = await getAsync(
      'SELECT id, denumire, forma_farmaceutica, concentratie, substanta_activa, cod_atc, mod_prescriere, note, created_at, updated_at FROM user_medicines WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, medicine: updated },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la actualizarea medicamentului' },
    };
  }
};
