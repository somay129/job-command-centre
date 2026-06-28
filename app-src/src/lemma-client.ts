import { LemmaClient } from 'lemma-sdk'

// Shared Lemma client for this app. In dev, runtime config comes from .env.local
// (VITE_LEMMA_API_URL / VITE_LEMMA_AUTH_URL / VITE_LEMMA_POD_ID). When deployed, the
// host injects window.__LEMMA_CONFIG__ and the SDK's resolveConfig picks it up.
export const lemmaClient = new LemmaClient({
  apiUrl: import.meta.env.VITE_LEMMA_API_URL,
  authUrl: import.meta.env.VITE_LEMMA_AUTH_URL,
  podId: import.meta.env.VITE_LEMMA_POD_ID,
})
