const { getAsync } = require('../shared/db');
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
    const id = context.bindingData.id;
    
    if (!id) {
      context.res = {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: { error: 'ID lipsă' },
      };
      return;
    }

    const row = await getAsync('SELECT * FROM medications WHERE id = ?', [id]);
    
    if (!row) {
      context.res = {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: { error: 'Not found' },
      };
      return;
    }

    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: row,
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
