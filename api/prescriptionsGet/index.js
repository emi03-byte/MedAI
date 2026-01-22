const { allAsync, getAsync } = require('../shared/db');
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

    // Verifică dacă utilizatorul este aprobat
    const user = await getAsync('SELECT status FROM users WHERE id = ?', [userId]);
    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Utilizator negăsit' },
      };
      return;
    }
    if (user.status !== 'approved') {
      context.res = {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Contul tău nu este aprobat. Te rugăm să aștepți aprobarea administratorului.' },
      };
      return;
    }

    const prescriptions = await allAsync(
      `SELECT id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic, data_creare 
       FROM retete 
       WHERE user_id = ? 
       ORDER BY data_creare DESC`,
      [userId]
    );

    // Parsează JSON-urile
    const parsedPrescriptions = prescriptions.map((prescription) => ({
      ...prescription,
      medicamente: JSON.parse(prescription.medicamente || '[]'),
      planuri_tratament: prescription.planuri_tratament ? JSON.parse(prescription.planuri_tratament) : null,
    }));

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { prescriptions: parsedPrescriptions },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la obținerea rețetelor' },
    };
  }
};
