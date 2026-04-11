import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Countdown } from '../components/ui/Countdown';
import { useHackathonState } from '../hooks/useHackathonState';
import { CATEGORY_LIST } from '../data/categories';
import HowItWorks from '../components/HowItWorks';

// Reusable section that fades + slides up the first time it enters the viewport.
// `once: true` prevents it from re-triggering during page transitions (which would flash
// the home page mid-route-change).
function Section({ children, className = '', delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Horizontal divider line between sections
function Divider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
    />
  );
}

export default function Home() {
  const { isAuthenticated, role } = useAuth();
  const { teams } = useTeams();
  const { t } = useTranslation();
  const { state: hackathonState, registrationOpen } = useHackathonState();

  const totalTeams = teams.length;
  const totalParticipants = teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0
  );

  const timelineEvents = t('home.timeline.events', { returnObjects: true });
  const partnersList = t('home.partners.list', { returnObjects: true });
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {hackathonState === 'live' ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-semibold mb-6">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
            </span>
            {t('home.liveNow')}
          </div>
        ) : hackathonState !== 'ended' ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            {t('home.liveBadge')}
          </div>
        ) : null}
        <p className="text-xl md:text-2xl text-white/60 mb-3 font-medium">ضمن حملة رفيق، رفيق الشباب</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {t('app.title')}
          <span className="text-[#3b82f6] ms-3">{t('app.subtitle')}</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
          {t('home.tagline')}
        </p>

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {registrationOpen && (
            <Link to="/login?tab=register">
              <Button size="lg" glow className="w-full sm:w-auto gap-2">
                <span>{t('home.registerYourTeam')}</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </motion.svg>
              </Button>
            </Link>
            )}
            <a
              href="https://chat.whatsapp.com/DLLSZK1Gwg6Hv8p6D10nL8"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2"
                style={{ background: 'linear-gradient(to right, #128C7E, #25D366)', color: 'white' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                {t('home.joinWhatsapp')}
              </Button>
            </a>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('nav.login')}
              </Button>
            </Link>
          </div>
        )}

        {isAuthenticated && role === 'participant' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/team">
              <Button size="lg" glow className="w-full sm:w-auto">
                {t('home.viewYourTeamProfile')}
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('home.checkLeaderboard')}
              </Button>
            </Link>
          </div>
        )}

        {isAuthenticated && role === 'judge' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/scan">
              <Button size="lg" glow className="w-full sm:w-auto">
                {t('judge.awardPoints')}
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('team.viewLeaderboard')}
              </Button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Countdown */}
      <Section>
        <Countdown />
      </Section>

      <Divider />

      {/* Theme Section — sealed until the opening ceremony */}
      <Section>
        <Card className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.18), transparent 60%)' }}
          />
          <CardContent className="relative py-10">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="w-16 h-16 rounded-2xl bg-[#3b82f6]/10 border border-[#3b82f6]/40 flex items-center justify-center mb-4"
              >
                <svg className="w-8 h-8 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </motion.div>
              <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-2">
                {t('home.theme.title')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {t('home.theme.lockedTitle')}
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
                {t('home.theme.lockedDesc')}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#60a5fa]">
                <span>🔒</span>
                {t('home.theme.lockedTag')}
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Divider />

      {/* Partners Section */}
      <Section>
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <p className="text-xs text-white/40 uppercase tracking-[0.2em] mb-2">{t('home.partners.subtitle')}</p>
              <h2 className="text-xl font-bold text-white">{t('home.partners.title')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 items-center">
              {Array.isArray(partnersList) && partnersList.map((partner, i) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-[#3b82f6]/30 transition-all"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-14 sm:h-16 w-auto max-w-full object-contain"
                    loading="lazy"
                  />
                  <p dir="ltr" className="text-xs sm:text-sm font-medium text-white/80 text-center">
                    {partner.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Divider />

      {/* How It Works (Claude explainer) */}
      <Section>
        <HowItWorks />
      </Section>
      <Divider />

      {/* Timeline Section */}
      <Section>
        <Card>
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">{t('home.timeline.title')}</h2>
              <p className="text-sm text-white/40">{t('home.timeline.subtitle')}</p>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              {Array.isArray(timelineEvents) && timelineEvents.map((event, i) => {
                const isHighlight = i === 0 || i === timelineEvents.length - 1;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                      isHighlight
                        ? 'bg-[#3b82f6]/[0.08] border-[#3b82f6]/30'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    {/* Time pill */}
                    <div className={`flex-shrink-0 w-20 h-14 rounded-xl flex items-center justify-center font-extrabold tabular-nums text-base ${
                      isHighlight
                        ? 'bg-gradient-to-br from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] shadow-lg shadow-[#3b82f6]/30'
                        : 'bg-black/40 border border-[#3b82f6]/30 text-[#3b82f6]'
                    }`}>
                      {event.time}
                    </div>

                    {/* Title */}
                    <p className={`flex-1 font-semibold ${isHighlight ? 'text-white' : 'text-white/85'}`}>
                      {event.title}
                    </p>

                    {/* Step number */}
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-widest text-white/30 font-bold tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Divider />

      {/* Judging Criteria */}
      <Section>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">{t('home.criteria.title')}</h2>
            </div>
            <p className="text-sm text-center text-white/40 mb-8">{t('home.criteria.subtitle')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORY_LIST.map((category, i) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 hover:bg-white/[0.05] hover:border-[#3b82f6]/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
                    >
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }} />
                    </div>
                    <span className="text-[10px] font-bold text-[#60a5fa] bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-2 py-1 rounded-full uppercase tracking-wider">
                      {t('home.criteria.maxPoints', { points: 15 })}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">
                    {t(`home.criteria.items.${category.id}.name`)}
                  </h3>
                  <p className="text-sm text-white/55 leading-relaxed">
                    {t(`home.criteria.items.${category.id}.desc`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      <Divider />

      {/* Stats Grid */}
      <Section>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">{totalTeams}</div>
              <div className="text-sm text-white/40">{t('home.stats.teamsRegistered')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">{totalParticipants}</div>
              <div className="text-sm text-white/40">{t('home.stats.participants')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">{CATEGORY_LIST.length}</div>
              <div className="text-sm text-white/40">{t('home.stats.categories')}</div>
            </CardContent>
          </Card>
        </div>
      </Section>

    </div>
  );
}
