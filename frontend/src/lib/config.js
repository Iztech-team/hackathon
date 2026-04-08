// Resolve the backend API base URL.
//
// Priority:
//   1. VITE_API_ENDPOINT is set and non-empty → use it verbatim (with one
//      exception: if it's a localhost URL but we're running on a different
//      hostname, rewrite the host so LAN/PWA clients can reach the backend).
//   2. VITE_API_ENDPOINT is empty/unset → same-origin relative URLs.
//      This is the production mode behind a reverse proxy (Caddy) that
//      routes /api/* to the backend container.
//   3. Server-side (no window) fallback → empty string (relative).
function resolveApiEndpoint() {
  const envValue = import.meta.env.VITE_API_ENDPOINT;
  const isBrowser = typeof window !== 'undefined' && !!window.location;

  if (envValue && envValue.trim()) {
    try {
      const u = new URL(envValue);
      // If env points at localhost but we're not actually on localhost,
      // rewrite to match the current host so iPhone/LAN clients work in dev.
      if (isBrowser && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        const here = window.location.hostname;
        if (here && here !== 'localhost' && here !== '127.0.0.1') {
          return `${u.protocol}//${here}:${u.port || 8000}`;
        }
      }
      return envValue.trim();
    } catch {
      // Malformed env value — fall through to same-origin.
    }
  }

  // Same-origin mode — return an empty base so fetch(`${API_BASE}/api/auth/me`)
  // hits the current origin (e.g. https://hackathon.example.com/api/auth/me)
  // and the reverse proxy routes it to the backend.
  return '';
}

export const config = {
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  apiEndpoint: resolveApiEndpoint(),
};
