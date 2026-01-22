const { getAsync, runAsync } = require('../shared/db');
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

    let user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserId]);
    if (!user) {
      const targetUserIdInt = parseInt(targetUserId, 10);
      if (!isNaN(targetUserIdInt)) {
        user = await getAsync('SELECT id, email, deleted_at FROM users WHERE id = ?', [targetUserIdInt]);
      }
    }

    if (!user) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Utilizatorul nu a fost găsit' },
      };
      return;
    }

    if (parseInt(targetUserId) === parseInt(adminUserId)) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Nu poți șterge propriul cont' },
      };
      return;
    }

    if (user.email.toLowerCase() === 'caruntu.emanuel@gmail.com') {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Nu poți șterge contul principal de administrator' },
      };
      return;
    }

    await runAsync('UPDATE users SET deleted_at = GETDATE() WHERE id = ?', [user.id]);

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { success: true, message: 'Cont șters cu succes' },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la ștergere cont' },
    };
  }
};
