const { allAsync, getAsync } = require('../shared/db');
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
    const { search = '', limit = 50, offset = 0 } = req.query;
    // Permite limită mare pentru a încărca toate medicamentele (max 50000 pentru siguranță)
    const safeLimit = limit === 'all' || limit === '0' ? 50000 : Math.min(Number(limit) || 50, 50000);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [];
    let whereClause = '';

    if (search) {
      whereClause =
        'WHERE denumire_medicament LIKE ? OR substanta_activa LIKE ? OR cod_medicament LIKE ?';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    params.push(safeLimit, safeOffset);

    const rows = await allAsync(
      `SELECT * FROM medications ${whereClause} ORDER BY id LIMIT ? OFFSET ?`,
      params
    );

    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: { items: rows, count: rows.length },
    };
  } catch (error) {
    context.res = {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: { error: error.message },
    };
  }
};
