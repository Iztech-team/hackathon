// Resolve the backend API base URL.
// Priority:
//   1. VITE_API_ENDPOINT (if it's an absolute URL with a non-localhost host)
//   2. Same hostname as the page, on port 8000 (works for iPhone/LAN PWA)
//   3. http://localhost:8000 fallback
function resolveApiEndpoint() {
  const envValue = import.meta.env.VITE_API_ENDPOINT;
  const isBrowser = typeof window !== 'undefined' && !!window.location;

  if (envValue) {
    try {
      const u = new URL(envValue);
      // If env points at localhost but we're not actually on localhost,
      // rewrite to match the current host so iPhone/LAN clients work.
      if (isBrowser && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        const here = window.location.hostname;
        if (here && here !== 'localhost' && here !== '127.0.0.1') {
          return `${u.protocol}//${here}:${u.port || 8000}`;
        }
      }
      return envValue;
    } catch {
      // fall through
    }
  }

  if (isBrowser) {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return 'http://localhost:8000';
}

export const config = {
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  apiEndpoint: resolveApiEndpoint(),
};
