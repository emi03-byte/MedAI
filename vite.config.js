import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const localApiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY
  if (!localApiKey) {
    console.warn('[Vite] OPENAI_API_KEY/VITE_OPENAI_API_KEY not found in environment. Proxy requests will fail with 401.')
  } else {
    console.log('[Vite] Loaded OpenAI key from env (will only send via proxy headers).')
  }

  return {
    plugins: [react()],
    server: {
      port: 5546,
      host: true,
      cors: true,
      proxy: {
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          headers: localApiKey ? { Authorization: `Bearer ${localApiKey}` } : undefined,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              proxyReq.setHeader('Accept', 'application/json')
              if (!proxyReq.getHeader('Content-Type')) {
                proxyReq.setHeader('Content-Type', 'application/json')
              }
              console.log(`[Vite proxy] ${req.method} ${req.url} -> Authorization header ${localApiKey ? 'attached' : 'missing'}`)
            })
          }
        }
      }
    },
    define: {
      global: 'globalThis',
    }
  }
})
