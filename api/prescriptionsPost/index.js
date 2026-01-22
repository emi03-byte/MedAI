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
    const { userId, numePacient, medicamente, planuriTratament, indicatiiPacient, indicatiiMedic } = req.body;

    if (!userId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator lipsă' },
      };
      return;
    }

    const medicamenteArray = medicamente && Array.isArray(medicamente) ? medicamente : [];

    // Verifică dacă utilizatorul există și este aprobat
    const user = await getAsync('SELECT id, status FROM users WHERE id = ?', [userId]);
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

    // Salvează rețeta
    const result = await runAsync(
      `INSERT INTO retete (user_id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        numePacient || null,
        medicamenteArray.length > 0 ? JSON.stringify(medicamenteArray) : JSON.stringify([]),
        planuriTratament ? JSON.stringify(planuriTratament) : null,
        indicatiiPacient || null,
        indicatiiMedic || null,
      ]
    );

    const newPrescription = await getAsync('SELECT * FROM retete WHERE id = ?', [result.lastID]);

    context.res = {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Rețetă salvată cu succes!',
        prescription: newPrescription,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la salvarea rețetei' },
    };
  }
};
