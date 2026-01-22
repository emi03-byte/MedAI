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
    const prescriptionId = context.bindingData.id;
    const userId = req.query.userId;

    if (!prescriptionId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID rețetă lipsă' },
      };
      return;
    }

    if (!userId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID utilizator lipsă' },
      };
      return;
    }

    // Verifică dacă rețeta există și aparține utilizatorului
    const prescription = await getAsync('SELECT * FROM retete WHERE id = ? AND user_id = ?', [
      prescriptionId,
      userId,
    ]);

    if (!prescription) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Rețetă negăsită sau nu ai permisiunea de a o șterge' },
      };
      return;
    }

    // Șterge rețeta
    await runAsync('DELETE FROM retete WHERE id = ? AND user_id = ?', [prescriptionId, userId]);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, message: 'Rețetă ștearsă cu succes' },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la ștergerea rețetei' },
    };
  }
};
