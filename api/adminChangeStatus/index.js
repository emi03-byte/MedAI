const { runAsync } = require('../shared/db');
const { checkAdmin, getCorsHeaders } = require('../shared/helpers');

module.exports = async function (context, req) {
  const corsHeaders = getCorsHeaders();

  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  try {
    const targetUserId = context.bindingData.userId;
    const { status, is_admin } = req.body;
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

    if (!targetUserId || !status || !['pending', 'approved', 'rejected'].includes(status)) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Status invalid. Trebuie să fie: pending, approved sau rejected' },
      };
      return;
    }

    if (status === 'approved') {
      const dataAprobare = new Date().toISOString();
      if (is_admin !== undefined && is_admin !== null) {
        const adminFlag = is_admin === true || is_admin === 1 || is_admin === '1' ? 1 : 0;
        await runAsync(
          'UPDATE users SET status = ?, data_aprobare = ?, is_admin = ? WHERE id = ?',
          [status, dataAprobare, adminFlag, targetUserId]
        );
      } else {
        await runAsync('UPDATE users SET status = ?, data_aprobare = ? WHERE id = ?', [
          status,
          dataAprobare,
          targetUserId,
        ]);
      }
    } else {
      if (is_admin !== undefined && is_admin !== null) {
        const adminFlag = is_admin === true || is_admin === 1 || is_admin === '1' ? 1 : 0;
        await runAsync('UPDATE users SET status = ?, data_aprobare = NULL, is_admin = ? WHERE id = ?', [
          status,
          adminFlag,
          targetUserId,
        ]);
      } else {
        await runAsync('UPDATE users SET status = ?, data_aprobare = NULL WHERE id = ?', [
          status,
          targetUserId,
        ]);
      }
    }

    const updatedUser = await require('../shared/db').getAsync(
      'SELECT id, nume, email, status, is_admin, data_aprobare FROM users WHERE id = ?',
      [targetUserId]
    );

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, message: 'Status actualizat cu succes', user: updatedUser },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la actualizare status' },
    };
  }
};
