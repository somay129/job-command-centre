import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { execSync } from 'node:child_process'

// Dev-only auth: resolve the current Lemma access token from the CLI and seed it
// into localStorage *before* the app bundle runs, so `npm run dev` is logged in
// in ANY browser as whoever the CLI is logged in as. Only applies during `serve`,
// so it never ships in a deployed bundle.
function lemmaDevAuth(env: Record<string, string>): Plugin {
  const command = env.VITE_LEMMA_DEV_TOKEN_CMD ?? 'lemma auth print-token'
  return {
    name: 'lemma-dev-auth',
    apply: 'serve',
    transformIndexHtml() {
      if (!command.trim()) return
      let token = ''
      try {
        token = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
      } catch {
        return
      }
      if (!token) return
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: `try{localStorage.setItem("lemma_token",${JSON.stringify(token)})}catch(e){}`,
        },
      ]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.LEMMA_DEV_PROXY_TARGET
  const server = proxyTarget
    ? {
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
            rewrite: (path: string) => path.replace(/^\/api/, ''),
          },
        },
      }
    : undefined

  return {
    base: mode === 'production' ? env.VITE_LEMMA_APP_BASE_PATH || '/' : '/',
    // viteSingleFile inlines all JS/CSS into one index.html so the app can be
    // deployed via Lemma's no-build HTML-app path (uploaded as-is, no server npm).
    plugins: [react(), lemmaDevAuth(env), viteSingleFile()],
    server,
    resolve: {
      dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    },
  }
})
