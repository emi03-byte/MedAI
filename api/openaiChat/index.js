const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders
    }
    return
  }

  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      headers: corsHeaders,
      body: { error: 'Method Not Allowed' }
    }
    return
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { error: 'OpenAI API key is not configured on the server.' }
    }
    return
  }

  if (!req.body) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: 'Request body is missing.' }
    }
    return
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    })

    const text = await openaiResponse.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }

    context.res = {
      status: openaiResponse.status,
      headers: corsHeaders,
      body
    }
  } catch (error) {
    context.log.error('Error calling OpenAI API', error)
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { error: 'Server error calling OpenAI API.' }
    }
  }
}

