const { getAsync, runAsync } = require('../shared/db');
const { hashPassword, getCorsHeaders } = require('../shared/helpers');

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
    const { nume, email, parola, mode } = req.body;

    if (!email || !parola || !mode) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Email, parola și modul sunt obligatorii' },
      };
      return;
    }

    if (mode !== 'restore' && mode !== 'new') {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Mod de recuperare invalid' },
      };
      return;
    }

    if (mode === 'new' && !nume) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Numele este obligatoriu pentru cont nou' },
      };
      return;
    }

    const deletedUser = await getAsync(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NOT NULL',
      [email]
    );

    if (!deletedUser) {
      context.res = {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Nu există cont șters pentru acest email' },
      };
      return;
    }

    const hashedPassword = await hashPassword(parola);

    if (mode === 'restore') {
      await runAsync('UPDATE users SET deleted_at = NULL, parola = ? WHERE id = ?', [
        hashedPassword,
        deletedUser.id,
      ]);
    } else {
      const isAdmin = email.toLowerCase() === 'caruntu.emanuel@gmail.com';
      const status = isAdmin ? 'approved' : 'pending';
      const adminFlag = isAdmin ? 1 : 0;
      const dataAprobare = isAdmin ? new Date().toISOString() : null;

      await runAsync(
        `UPDATE users 
         SET nume = ?, parola = ?, status = ?, is_admin = ?, data_aprobare = ?, deleted_at = NULL, data_creare = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [nume, hashedPassword, status, adminFlag, dataAprobare, deletedUser.id]
      );
      // Curăță rețetele doar pentru cont nou
      await runAsync('DELETE FROM retete WHERE user_id = ?', [deletedUser.id]);
    }

    const updatedUser = await getAsync(
      'SELECT id, nume, email, data_creare, status, is_admin FROM users WHERE id = ?',
      [deletedUser.id]
    );

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: mode === 'restore' ? 'Cont restaurat cu succes' : 'Cont recreat cu succes',
        user: updatedUser,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la recuperarea contului' },
    };
  }
};
