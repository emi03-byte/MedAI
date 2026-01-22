const { getAsync, runAsync } = require('../shared/db');
const { checkAdmin, getCorsHeaders } = require('../shared/helpers');

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  try {
    const prescriptionId = context.bindingData.prescriptionId;
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

    if (!prescriptionId) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'ID rețetă lipsă' },
      };
      return;
    }

    const prescription = await getAsync('SELECT id, user_id FROM retete WHERE id = ?', [prescriptionId]);
    if (!prescription) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Rețetă negăsită' },
      };
      return;
    }

    await runAsync('DELETE FROM retete WHERE id = ?', [prescriptionId]);

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
