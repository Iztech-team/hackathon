import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

// Fallback defaults if the backend is unreachable
const FALLBACK = {
  start_at: '2026-04-14T09:00:00Z',
  end_at: '2026-04-14T15:00:00Z',
  override: null,
  state: 'upcoming',
  leaderboard_frozen: false,
};

/**
 * Polls the backend every 15s for hackathon state. Exposes:
 *  - state: "upcoming" | "live" | "ended"
 *  - startAt / endAt: Date objects
 *  - override: null | "live" | "ended"
 *  - refresh(): manual refetch
 *  - setOverride(value): admin only — PUT new override and refresh
 */
export function useHackathonState() {
  const [data, setData] = useState(() => ({
    state: FALLBACK.state,
    startAt: new Date(FALLBACK.start_at),
    endAt: new Date(FALLBACK.end_at),
    override: null,
    leaderboardFrozen: false,
    loading: true,
  }));

  const fetchState = useCallback(async () => {
    try {
      const res = await api.getHackathonState();
      setData({
        state: res.state,
        startAt: new Date(res.start_at),
        endAt: new Date(res.end_at),
        override: res.override,
        leaderboardFrozen: !!res.leaderboard_frozen,
        loading: false,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch hackathon state:', err.message);
      setData((d) => ({ ...d, loading: false }));
    }
  }, []);

  // "Latest ref" pattern — the setInterval callback reads from the ref
  // rather than closing over a specific fetchState, so it never goes stale
  // even if fetchState is recreated or if someone later adds dependencies.
  const fetchStateRef = useRef(fetchState);
  useEffect(() => {
    fetchStateRef.current = fetchState;
  }, [fetchState]);

  useEffect(() => {
    // Initial fetch on mount
    fetchStateRef.current();
    const id = setInterval(() => {
      fetchStateRef.current();
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const setOverride = useCallback(
    async (value) => {
      await api.updateHackathonState({ override: value });
      await fetchState();
    },
    [fetchState]
  );

  const setFreeze = useCallback(
    async (frozen) => {
      await api.setLeaderboardFrozen(frozen);
      await fetchState();
    },
    [fetchState]
  );

  return { ...data, refresh: fetchState, setOverride, setFreeze };
}
