import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHackathonState } from '../../hooks/useHackathonState';

/**
 * Compact live countdown chip displayed in the global site header.
 * Renders in every state:
 *   - upcoming → counts down to start (gold theme)
 *   - live     → counts down to end (red theme)
 *   - ended    → shows a muted "Hackathon ended" chip
 * Accepts an optional `frost` prop to force the sky/ice theme (used when the
 * leaderboard is frozen and the user is viewing the leaderboard page).
 */
export function HeaderCountdownChip({ frost = false }) {
  const { t } = useTranslation();
  const { state: hackState, startAt, endAt, loading } = useHackathonState();
  const [, forceTick] = useState(0);

  const isUpcoming = hackState === 'upcoming';
  const isLive = hackState === 'live';
  const isEnded = hackState === 'ended';
  const target = isUpcoming ? startAt : isLive ? endAt : null;

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Don't render anything until the backend has responded once to avoid a
  // fallback flash.
  if (loading) return null;

  let valueText = '';
  if (target) {
    const diff = target.getTime() - Date.now();
    if (diff > 0) {
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      const parts =
        d > 0
          ? [`${d}d`, `${h}h`, `${m}m`]
          : h > 0
          ? [`${h}h`, `${m}m`, `${s}s`]
          : [`${m}m`, `${s}s`];
      valueText = parts.join(' ');
    } else {
      valueText = '00m 00s';
    }
  } else if (isEnded) {
    valueText = '—';
  }

  const theme = frost
    ? {
        wrap: 'bg-sky-400/10 border-sky-400/30',
        label: 'text-sky-200',
        value: 'text-sky-50',
        dot: 'bg-sky-300',
      }
    : isLive
    ? {
        wrap: 'bg-red-500/10 border-red-500/30',
        label: 'text-red-200',
        value: 'text-red-100',
        dot: 'bg-red-400',
      }
    : isEnded
    ? {
        wrap: 'bg-white/5 border-white/10',
        label: 'text-white/40',
        value: 'text-white/60',
        dot: 'bg-white/30',
      }
    : {
        wrap: 'bg-[#3b82f6]/10 border-[#3b82f6]/30',
        label: 'text-[#60a5fa]',
        value: 'text-white',
        dot: 'bg-[#3b82f6]',
      };

  const label = isLive
    ? t('countdown.liveTitle')
    : isEnded
    ? t('countdown.ended')
    : t('countdown.title');

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border backdrop-blur ${theme.wrap}`}
    >
      <span className="relative flex w-2 h-2 flex-shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full ${theme.dot} opacity-75 animate-ping`} />
        <span className={`relative inline-flex w-2 h-2 rounded-full ${theme.dot}`} />
      </span>
      <div className="flex items-center gap-2 leading-tight min-w-0">
        <span className={`text-[9px] uppercase tracking-widest font-semibold ${theme.label} hidden sm:inline`}>
          {label}
        </span>
        <span className={`text-xs sm:text-sm font-extrabold tabular-nums ${theme.value}`} dir="ltr">
          {valueText || '…'}
        </span>
      </div>
    </div>
  );
}
