import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from './ui/Card';

const HOW_IT_WORKS_CARDS = ['claude', 'apiKey', 'claudeCode'];
const OS_OPTIONS = ['windows', 'macos', 'linux'];

export default function HowItWorks() {
  const { t } = useTranslation();
  const [selectedOs, setSelectedOs] = useState('windows');

  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{t('home.howItWorks.title')}</h2>
        </div>
        <p className="text-sm text-center text-white/40 mb-5">{t('home.howItWorks.subtitle')}</p>
        <p className="text-center text-white/60 max-w-2xl mx-auto leading-relaxed mb-8">
          {t('home.howItWorks.intro')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {HOW_IT_WORKS_CARDS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 hover:bg-white/[0.05] hover:border-[#3b82f6]/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1d4ed8]/20 to-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center mb-3">
                <span className="text-base font-extrabold text-[#60a5fa]">{i + 1}</span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">
                {t(`home.howItWorks.cards.${key}.title`)}
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
                {t(`home.howItWorks.cards.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Setup / Usage Guide */}
        <div className="mt-8 mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white mb-1">
              {t('home.howItWorks.usage.title')}
            </h3>
            <p className="text-sm text-white/50">
              {t('home.howItWorks.usage.subtitle')}
            </p>
          </div>

          {/* OS Toggle */}
          <div className="flex justify-center mb-5">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.08]"
              role="tablist"
            >
              {OS_OPTIONS.map((os) => {
                const isActive = selectedOs === os;
                return (
                  <button
                    key={os}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedOs(os)}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-br from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] shadow-md shadow-[#3b82f6]/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t(`home.howItWorks.usage.osLabels.${os}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => {
              const code = t(`home.howItWorks.usage.steps.${i}.code.${selectedOs}`, { defaultValue: '' });
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-black/20 border border-white/[0.06]"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#1d4ed8]/30 to-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center">
                    <span className="text-sm font-extrabold text-[#60a5fa]">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">
                      {t(`home.howItWorks.usage.steps.${i}.title`)}
                    </p>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">
                      {t(`home.howItWorks.usage.steps.${i}.desc`)}
                    </p>
                    {code && (
                      <pre
                        dir="ltr"
                        className="mt-2 overflow-x-auto text-[11px] sm:text-xs font-mono text-[#60a5fa] bg-black/40 border border-[#3b82f6]/20 rounded-lg px-3 py-2 select-all"
                      >
                        <code>{code}</code>
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4 bg-[#3b82f6]/[0.06] border border-[#3b82f6]/20">
          <p className="text-sm text-center text-[#60a5fa]/90 leading-relaxed">
            {t('home.howItWorks.note')}
          </p>
        </div>

        {/* Video tutorial */}
        <div className="mt-6">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold text-white">
              {t('home.howItWorks.video.title')}
            </h3>
            <p className="text-xs text-white/40 mt-1">
              {t('home.howItWorks.video.subtitle')}
            </p>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/pdRpuy8F7Kw"
              title={t('home.howItWorks.video.title')}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
