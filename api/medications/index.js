const { queryMedications } = require('../shared/db')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders }
    return
  }

  if (req.method !== 'GET') {
    context.res = {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: 'Method Not Allowed' }
    }
    return
  }

  try {
    const search = (req.query && req.query.search) || ''
    const limitParam = (req.query && req.query.limit) || '50'
    const safeLimit = limitParam === 'all' || limitParam === '0' ? 50000 : Math.min(Number(limitParam) || 50, 50000)
    const offset = Math.max(Number((req.query && req.query.offset) || 0), 0)

    const { items, count } = await queryMedications(search, safeLimit, offset)
    context.res = {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { items, count }
    }
  } catch (error) {
    context.log.error('Medications API error', error)
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Server error loading medications.'
    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: { error: message }
    }
  }
}
