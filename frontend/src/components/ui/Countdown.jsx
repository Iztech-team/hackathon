import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useHackathonState } from '../../hooks/useHackathonState';

function getTimeRemaining(target) {
  const total = target.getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

const pad = (n) => String(n).padStart(2, '0');

export function Countdown() {
  const { t, i18n } = useTranslation();
  const { state, startAt, endAt, loading } = useHackathonState();

  // Target depends on state: upcoming → start, live → end, ended → none
  const target = state === 'upcoming' ? startAt : state === 'live' ? endAt : null;
  const [time, setTime] = useState(() => (target ? getTimeRemaining(target) : null));

  useEffect(() => {
    if (!target) {
      setTime(null);
      return;
    }
    setTime(getTimeRemaining(target));
    const id = setInterval(() => setTime(getTimeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target?.getTime()]);

  if (loading && !target) return null;

  // Ended state — simple card
  if (state === 'ended') {
    return (
      <div className="rounded-2xl bg-black/20 border border-white/[0.12] p-6 text-center">
        <p className="text-2xl font-bold text-white/70">{t('countdown.ended')}</p>
      </div>
    );
  }

  if (!time) return null;

  // Color theme: gold while waiting, red while live
  const isLive = state === 'live';
  const accent = isLive ? '#ef4444' : '#3b82f6';
  const accentSoft = isLive ? 'rgba(239, 68, 68, 0.18)' : 'rgba(212, 176, 105, 0.12)';
  const borderColor = isLive ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.12)';

  const title = isLive ? t('countdown.liveTitle') : t('countdown.title');

  let items = [
    { value: time.days, label: t('countdown.days') },
    { value: time.hours, label: t('countdown.hours') },
    { value: time.minutes, label: t('countdown.minutes') },
    { value: time.seconds, label: t('countdown.seconds') },
  ];
  if (i18n.language === 'ar') items = items.reverse();

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: isLive
          ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(0,0,0,0.2))'
          : 'rgba(0,0,0,0.2)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        {isLive && (
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-red-500" />
          </span>
        )}
        <p
          className="text-sm font-semibold text-center uppercase tracking-wider"
          style={{ color: accent }}
        >
          {title}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="text-center"
          >
            <div
              className="rounded-xl py-4 px-2 border"
              style={{
                background: accentSoft,
                borderColor: isLive ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="text-3xl sm:text-4xl font-bold tabular-nums"
                style={{
                  color: isLive ? '#fecaca' : '#ffffff',
                  textShadow: isLive ? '0 0 18px rgba(239,68,68,0.6)' : 'none',
                }}
              >
                {pad(item.value)}
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-white/50 mt-2 uppercase tracking-wider">
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
