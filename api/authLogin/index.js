const { getAsync, runAsync } = require('../shared/db');
const { verifyPassword, hashPassword, getCorsHeaders } = require('../shared/helpers');
const bcrypt = require('bcryptjs');

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
    const { email, parola } = req.body;

    if (!email || !parola) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Email și parola sunt obligatorii' },
      };
      return;
    }

    // Caută utilizatorul
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      context.res = {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Email sau parolă incorectă' },
      };
      return;
    }

    if (user.deleted_at) {
      context.res = {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: {
          error: 'Contul asociat acestui email a fost șters. Poți merge la Înregistrare pentru restaurare sau cont nou.',
          code: 'ACCOUNT_DELETED',
        },
      };
      return;
    }

    // Verifică parola
    let isPasswordValid = false;

    if (user.parola.startsWith('$2b$') || user.parola.startsWith('$2a$') || user.parola.startsWith('$2y$')) {
      isPasswordValid = await verifyPassword(parola, user.parola);
    } else {
      isPasswordValid = user.parola === parola;
      // Dacă parola este corectă, hash-ui-o și actualizează
      if (isPasswordValid) {
        const hashedPassword = await hashPassword(parola);
        await runAsync('UPDATE users SET parola = ? WHERE id = ?', [hashedPassword, user.id]);
      }
    }

    if (!isPasswordValid) {
      context.res = {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Email sau parolă incorectă' },
      };
      return;
    }

    // Returnează datele utilizatorului
    const userResponse = {
      id: user.id,
      nume: user.nume,
      email: user.email,
      data_creare: user.data_creare,
      status: user.status || 'pending',
      is_admin: user.is_admin || 0,
    };

    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: 'Autentificare reușită!',
        user: userResponse,
      },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Eroare la autentificare' },
    };
  }
};
