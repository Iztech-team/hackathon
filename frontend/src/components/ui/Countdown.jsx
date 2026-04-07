import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Hackathon target date — change this to set the countdown target
export const HACKATHON_DATE = new Date('2026-04-19T09:00:00');

function getTimeRemaining(target) {
  const total = target.getTime() - Date.now();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

const pad = (n) => String(n).padStart(2, '0');

export function Countdown({ target = HACKATHON_DATE }) {
  const { t, i18n } = useTranslation();
  const [time, setTime] = useState(() => getTimeRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (time.total <= 0) {
    return (
      <div className="rounded-2xl bg-black/20 border border-white/[0.12] p-6 text-center">
        <p className="text-2xl font-bold text-[#2b58f7]">{t('countdown.started')}</p>
      </div>
    );
  }

  let items = [
    { value: time.days, label: t('countdown.days') },
    { value: time.hours, label: t('countdown.hours') },
    { value: time.minutes, label: t('countdown.minutes') },
    { value: time.seconds, label: t('countdown.seconds') },
  ];
  if (i18n.language === 'ar') {
    items = items.reverse();
  }

  return (
    <div className="rounded-2xl bg-black/20 border border-white/[0.12] p-6">
      <p className="text-sm font-medium text-[#d4b069] text-center mb-4 uppercase tracking-wider">
        {t('countdown.title')}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {items.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="text-center"
          >
            <div className="rounded-xl bg-black/40 border border-white/10 py-4 px-2">
              <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
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
