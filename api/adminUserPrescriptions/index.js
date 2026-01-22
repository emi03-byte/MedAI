const { getAsync, allAsync } = require('../shared/db');
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

    const targetUserIdInt = parseInt(targetUserId, 10);
    if (isNaN(targetUserIdInt)) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator invalid' },
      };
      return;
    }

    const user = await getAsync('SELECT id, nume, email, deleted_at FROM users WHERE id = ?', [
      targetUserIdInt,
    ]);

    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: `Utilizatorul nu a fost găsit (ID: ${targetUserId})` },
      };
      return;
    }

    const prescriptions = await allAsync(
      `SELECT id, nume_pacient, medicamente, planuri_tratament, indicatii_pacient, indicatii_medic, data_creare 
       FROM retete 
       WHERE user_id = ? 
       ORDER BY data_creare DESC`,
      [user.id]
    );

    const parsedPrescriptions = prescriptions.map((prescription) => {
      try {
        return {
          ...prescription,
          medicamente: JSON.parse(prescription.medicamente || '[]'),
          planuri_tratament: prescription.planuri_tratament
            ? JSON.parse(prescription.planuri_tratament)
            : null,
        };
      } catch (parseError) {
        return {
          ...prescription,
          medicamente: [],
          planuri_tratament: null,
        };
      }
    });

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        user: { id: user.id, nume: user.nume, email: user.email },
        prescriptions: parsedPrescriptions,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la obținerea rețetelor: ' + error.message },
    };
  }
};
