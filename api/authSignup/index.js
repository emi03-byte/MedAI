const { runAsync, getAsync } = require('../shared/db');
const { hashPassword, getCorsHeaders } = require('../shared/helpers');
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
    const { nume, email, parola } = req.body;

    // Validare
    if (!nume || !email || !parola) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Toate câmpurile sunt obligatorii' },
      };
      return;
    }

    if (parola.length < 6) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Parola trebuie să aibă cel puțin 6 caractere' },
      };
      return;
    }

    // Verifică dacă email-ul există deja
    const existingUser = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      if (existingUser.deleted_at) {
        context.res = {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: {
            error: 'Există un cont șters pe acest email. Poți alege restaurare sau cont nou.',
            code: 'ACCOUNT_DELETED',
          },
        };
        return;
      }
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Acest email este deja folosit. Te rugăm să folosești alt email.' },
      };
      return;
    }

    // Hash-ui parola
    const hashedPassword = await hashPassword(parola);

    // Verifică dacă este contul de admin
    const isAdmin = email.toLowerCase() === 'caruntu.emanuel@gmail.com';
    const status = isAdmin ? 'approved' : 'pending';
    const adminFlag = isAdmin ? 1 : 0;
    const dataAprobare = isAdmin ? new Date().toISOString() : null;

    // Inserează utilizatorul
    const result = await runAsync(
      'INSERT INTO users (nume, email, parola, status, is_admin, data_aprobare) OUTPUT INSERTED.id VALUES (?, ?, ?, ?, ?, ?)',
      [nume, email, hashedPassword, status, adminFlag, dataAprobare]
    );

    const lastID = result.lastID || (result.result?.recordset?.[0]?.id);

    // Returnează datele utilizatorului
    const newUser = await getAsync(
      'SELECT id, nume, email, data_creare, status, is_admin FROM users WHERE id = ?',
      [lastID]
    );

    context.res = {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: {
        success: true,
        message: isAdmin
          ? 'Cont creat cu succes! (Admin)'
          : 'Cont creat cu succes! Contul tău este în așteptare aprobare.',
        user: newUser,
      },
    };
  } catch (error) {
    console.error('❌ [AUTH SIGNUP] Eroare:', error);
    console.error('❌ [AUTH SIGNUP] Stack:', error.stack);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: { error: 'Acest email este deja folosit. Te rugăm să folosești alt email.' },
      };
      return;
    }
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { 
        error: 'Eroare la crearea contului',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
    };
  }
};
