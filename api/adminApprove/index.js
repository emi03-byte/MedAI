const { runAsync, getAsync } = require('../shared/db');
const { checkAdmin, getCorsHeaders } = require('../shared/helpers');

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

    const dataAprobare = new Date().toISOString();
    await runAsync('UPDATE users SET status = ?, data_aprobare = ? WHERE id = ?', [
      'approved',
      dataAprobare,
      targetUserId,
    ]);

    const updatedUser = await getAsync(
      'SELECT id, nume, email, status, data_aprobare FROM users WHERE id = ?',
      [targetUserId]
    );

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Cont aprobat cu succes',
        user: updatedUser,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la aprobare cont' },
    };
  }
};
