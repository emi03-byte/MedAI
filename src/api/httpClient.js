export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, url?: string, body?: any }} meta
   */
  constructor(message, meta = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = meta.status
    this.url = meta.url
    this.body = meta.body
  }
}

const isJsonResponse = (contentType) =>
  typeof contentType === 'string' && contentType.toLowerCase().includes('application/json')

/**
 * Tiny fetch wrapper that:
 * - parses JSON when possible
 * - throws HttpError on non-2xx
 */
export async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })

  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  const parsed = isJsonResponse(contentType) && text ? safeJsonParse(text) : text

  if (!res.ok) {
    const message =
      typeof parsed === 'object' && parsed && parsed.error
        ? parsed.error
        : `HTTP ${res.status} ${res.statusText}`
    throw new HttpError(message, { status: res.status, url, body: parsed })
  }

  return parsed
}

export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(path, baseUrl)
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

