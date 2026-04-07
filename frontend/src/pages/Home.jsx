import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Countdown } from '../components/ui/Countdown';
import { CATEGORY_LIST } from '../data/categories';

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

  const totalTeams = teams.length;
  const totalParticipants = teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0
  );

  const themeTags = t('home.theme.tags', { returnObjects: true });
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4b069]/10 border border-[#d4b069]/30 text-[#e8c98a] text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[#d4b069] animate-pulse" />
          {t('home.liveBadge')}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {t('app.title')}
          <span className="text-[#d4b069] ms-3">{t('app.subtitle')}</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
          {t('home.tagline')}
        </p>

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

      {/* Theme Section */}
      <Section>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#d4b069]/10 border border-[#d4b069]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#d4b069]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">{t('home.theme.title')}</h2>
            </div>
            <p className="text-center text-white/60 max-w-2xl mx-auto leading-relaxed mb-6">
              {t('home.theme.desc')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.isArray(themeTags) && themeTags.map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#d4b069]/10 border border-[#d4b069]/30 text-[#e8c98a]"
                >
                  {tag}
                </motion.span>
              ))}
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
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-[#d4b069]/30 transition-all"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-14 sm:h-16 w-auto max-w-full object-contain"
                    loading="lazy"
                  />
                  <p className="text-xs sm:text-sm font-medium text-white/80 text-center">
                    {partner.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                        ? 'bg-[#d4b069]/[0.08] border-[#d4b069]/30'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    {/* Time pill */}
                    <div className={`flex-shrink-0 w-20 h-14 rounded-xl flex items-center justify-center font-extrabold tabular-nums text-base ${
                      isHighlight
                        ? 'bg-gradient-to-br from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] shadow-lg shadow-[#d4b069]/30'
                        : 'bg-black/40 border border-[#d4b069]/30 text-[#d4b069]'
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
