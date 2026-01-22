const bcrypt = require('bcryptjs');
const { getAsync } = require('./db');

// Helper pentru verificare admin
async function checkAdmin(userId) {
  if (!userId) {
    return { allowed: false, error: 'userId lipsă', statusCode: 401 };
  }
  
  const user = await getAsync('SELECT is_admin, status, deleted_at FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return { allowed: false, error: 'Utilizator negăsit', statusCode: 401 };
  }
  
  if (user.deleted_at) {
    return { allowed: false, error: 'Cont șters', statusCode: 403 };
  }
  
  if (!user.is_admin || user.is_admin === 0) {
    return { allowed: false, error: 'Nu e admin', statusCode: 403 };
  }
  
  return { allowed: true };
}

// Helper pentru hash parolă
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper pentru verificare parolă
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Helper pentru CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

module.exports = {
  checkAdmin,
  hashPassword,
  verifyPassword,
  getCorsHeaders,
};
