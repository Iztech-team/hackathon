import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_ROLES } from '../../context/AuthContext';
import { useTeams } from '../../context/TeamContext';
import { useJudges } from '../../context/JudgeContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useHackathonState } from '../../hooks/useHackathonState';
import { calculateTotalScore, getCategoryById } from '../../data/categories';

// Cycles through an array of {label, icon} objects every `interval` ms.
// Falsy entries are filtered out. Cycling pauses (and resets to index 0)
// when `enabled` is false, so inactive tabs always show their default label.
function useCycled(items, enabled = true, interval = 3500) {
  const filtered = useMemo(
    () => items.filter((it) => it && it.label),
    [items.map((it) => (it && it.label) || '').join('|')]
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIdx(0);
      return;
    }
    if (filtered.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % filtered.length), interval);
    return () => clearInterval(id);
  }, [enabled, filtered.length, interval]);

  return filtered[idx % Math.max(filtered.length, 1)] || { label: '', icon: null };
}

function NavLink({ to, label, icon, iconKey }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative">
      <div
        className={`relative px-3 py-2.5 rounded-xl text-sm font-medium flex items-center transition-[background-color,box-shadow,color] duration-300 ease-out ${
          isActive
            ? 'bg-gradient-to-r from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] shadow-lg shadow-[#d4b069]/30'
            : 'text-white/60 hover:text-white hover:bg-white/10'
        }`}
      >
        {/* Icon swaps when the cycled label changes */}
        <div className="relative w-5 h-5 flex-shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={iconKey || 'default'}
              initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0"
            >
              {icon}
            </motion.div>
          </AnimatePresence>
        </div>

        {/*
          Label container — CSS-only width/opacity transition for the active state.
          Uses max-width (which IS animatable in CSS) instead of width:auto.
          The inner span uses framer to crossfade between cycled labels.
        */}
        <div
          className="overflow-hidden whitespace-nowrap transition-[max-width,margin,opacity] duration-300 ease-out"
          style={{
            maxWidth: isActive && label ? 200 : 0,
            opacity: isActive && label ? 1 : 0,
            marginInlineStart: isActive && label ? 8 : 0,
          }}
          aria-hidden={!isActive}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={label || 'empty'}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="block"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </Link>
  );
}

// Animated Icon components
const HomeIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { y: [0, -2, 0] } : {}}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </motion.svg>
);

const LeaderboardIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <motion.path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      animate={isActive ? { pathLength: [0.8, 1, 0.8] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.svg>
);

const LoginIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { x: [0, 3, 0] } : {}}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </motion.svg>
);

const TeamIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </motion.svg>
);

const ScanIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </motion.svg>
);

const ProfileIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { y: [0, -2, 0] } : {}}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </motion.svg>
);

const DashboardIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { rotate: [0, 360] } : {}}
    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </motion.svg>
);

const JudgesIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </motion.svg>
);

const ExportIcon = ({ isActive }) => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    animate={isActive ? { y: [0, 3, 0] } : {}}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </motion.svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7V3H8v4M5 7h14a1 1 0 011 1v3a5 5 0 01-5 5H9a5 5 0 01-5-5V8a1 1 0 011-1zM10 16v3m4-3v3m-5 0h6" />
  </svg>
);

const FlameIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.24 17 12c.317-.74.5-1.5.5-2.5a3.5 3.5 0 117 0c0 1.74-.5 3-1.343 4.157" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6a1 1 0 011-1h4a1 1 0 011 1v13M5 19v-7a1 1 0 011-1h2a1 1 0 011 1v7m6 0v-4a1 1 0 011-1h2a1 1 0 011 1v4M3 21h18" />
  </svg>
);

const LogoutIcon = () => (
  <motion.svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    whileHover={{ x: 2 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </motion.svg>
);

// Live-updating short countdown string like "12d 4h" or "23m 12s"
function useShortCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export function Navigation() {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { teams } = useTeams();
  const { judges } = useJudges();
  const { state: hackathonState, startAt, endAt } = useHackathonState();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ---- Dynamic data for cycling labels ----
  // Use the same target the countdown component uses: start when upcoming, end when live
  const countdownTarget = hackathonState === 'upcoming' ? startAt : hackathonState === 'live' ? endAt : null;
  const countdown = useShortCountdown(countdownTarget);

  // Top team by total score
  const topTeam = useMemo(() => {
    if (!teams || teams.length === 0) return null;
    return [...teams]
      .map((team) => ({
        teamName: team.teamName,
        total: team.totalScore || calculateTotalScore(team.scores),
      }))
      .sort((a, b) => b.total - a.total)[0];
  }, [teams]);

  // Current user's team rank (for participants)
  const myTeamInfo = useMemo(() => {
    if (role !== USER_ROLES.PARTICIPANT || !user?.teamId) return null;
    const sorted = [...teams]
      .map((team) => ({ ...team, total: team.totalScore || calculateTotalScore(team.scores) }))
      .sort((a, b) => b.total - a.total);
    const idx = sorted.findIndex((tm) => tm.id === user.teamId);
    if (idx < 0) return null;
    return { team: sorted[idx], rank: idx + 1 };
  }, [teams, user?.teamId, role]);

  // Judge category label
  const judgeCategoryName = useMemo(() => {
    if (role !== USER_ROLES.JUDGE || !user?.categoryId) return null;
    const cat = getCategoryById(user.categoryId);
    return cat ? t(`categories.${cat.id}`) : null;
  }, [role, user?.categoryId, t]);

  // ---- Cycled dynamic items per route (only cycle when the tab is active) ----
  const path = location.pathname;
  const homeItem = useCycled([
    { key: 'home', label: t('nav.home'), icon: <HomeIcon isActive /> },
    countdown ? { key: 'countdown', label: countdown, icon: <ClockIcon /> } : null,
    role === USER_ROLES.GUEST ? { key: 'reserve', label: t('home.liveBadge'), icon: <SparkleIcon /> } : null,
  ], path === '/');

  const leaderboardItem = useCycled([
    { key: 'leaderboard', label: t('nav.leaderboard'), icon: <LeaderboardIcon isActive /> },
    topTeam ? { key: 'top-team', label: topTeam.teamName, icon: <TrophyIcon /> } : null,
    topTeam && topTeam.total > 0
      ? { key: 'top-points', label: `${topTeam.total} ${t('common.points')}`, icon: <FlameIcon /> }
      : null,
  ], path === '/leaderboard');

  const teamItem = useCycled([
    { key: 'team', label: t('nav.team'), icon: <TeamIcon isActive /> },
    myTeamInfo ? { key: 'team-name', label: myTeamInfo.team.teamName, icon: <TrophyIcon /> } : null,
    myTeamInfo
      ? { key: 'team-rank', label: `#${myTeamInfo.rank} • ${myTeamInfo.team.total} ${t('common.points')}`, icon: <FlameIcon /> }
      : null,
  ], path === '/team');

  const scanItem = useCycled([
    { key: 'scan', label: t('nav.judge'), icon: <ScanIcon isActive /> },
    judgeCategoryName ? { key: 'cat', label: judgeCategoryName, icon: <ScaleIcon /> } : null,
  ], path === '/scan');

  const judgeProfileItem = useCycled([
    { key: 'profile', label: user?.name || t('nav.judge'), icon: <ProfileIcon isActive /> },
    judgeCategoryName ? { key: 'cat', label: judgeCategoryName, icon: <ScaleIcon /> } : null,
  ], path === '/judge/profile');

  const adminDashItem = useCycled([
    { key: 'dash', label: t('admin.dashboard'), icon: <DashboardIcon isActive /> },
    { key: 'teams-count', label: `${teams.length} ${t('admin.teams')}`, icon: <TeamIcon isActive /> },
    { key: 'judges-count', label: `${judges.length} ${t('admin.judges')}`, icon: <JudgesIcon isActive /> },
  ], path === '/admin');

  const adminJudgesItem = useCycled([
    { key: 'judges', label: t('admin.judges'), icon: <JudgesIcon isActive /> },
    { key: 'count', label: `${judges.length} ${t('admin.judgesPage.registered')}`, icon: <ChartBarIcon /> },
  ], path === '/admin/judges');

  const adminLeaderboardItem = useCycled([
    { key: 'leaderboard', label: t('nav.leaderboard'), icon: <LeaderboardIcon isActive /> },
    topTeam ? { key: 'top', label: topTeam.teamName, icon: <TrophyIcon /> } : null,
  ], path === '/leaderboard');

  // Helper: build a nav entry with cycled active item or static fallback
  const make = (to, staticIcon, cycledItem) => ({
    to,
    label: cycledItem.label,
    icon: cycledItem.icon || staticIcon,
    iconKey: cycledItem.key || 'static',
    staticIcon,
  });

  const navItems = useMemo(() => {
    switch (role) {
      case USER_ROLES.GUEST:
        return [
          make('/', <HomeIcon isActive />, homeItem),
          make('/leaderboard', <LeaderboardIcon isActive />, leaderboardItem),
          { to: '/login', icon: <LoginIcon isActive />, label: t('nav.login'), iconKey: 'login' },
        ];
      case USER_ROLES.PARTICIPANT:
        return [
          make('/', <HomeIcon isActive />, homeItem),
          make('/leaderboard', <LeaderboardIcon isActive />, leaderboardItem),
          make('/team', <TeamIcon isActive />, teamItem),
        ];
      case USER_ROLES.JUDGE:
        return [
          make('/', <HomeIcon isActive />, homeItem),
          make('/leaderboard', <LeaderboardIcon isActive />, leaderboardItem),
          make('/scan', <ScanIcon isActive />, scanItem),
          make('/judge/profile', <ProfileIcon isActive />, judgeProfileItem),
        ];
      case USER_ROLES.ADMIN:
        return [
          make('/admin', <DashboardIcon isActive />, adminDashItem),
          make('/leaderboard', <LeaderboardIcon isActive />, adminLeaderboardItem),
          make('/admin/judges', <JudgesIcon isActive />, adminJudgesItem),
          { to: '/admin/export', icon: <ExportIcon isActive />, label: t('admin.exportTab'), iconKey: 'export' },
        ];
      default:
        return [];
    }
  }, [role, t, homeItem, leaderboardItem, teamItem, scanItem, judgeProfileItem, adminDashItem, adminJudgesItem, adminLeaderboardItem]);

  return (
    <motion.nav
      className="fixed bottom-6 left-1/2 z-50"
      initial={{ y: 100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          // Inactive tabs always use the static icon (no cycling), so they keep a stable look
          const icon = isActive ? item.icon : (item.staticIcon || item.icon);
          const iconKey = isActive ? item.iconKey : 'static';
          return (
            <NavLink key={item.to} to={item.to} icon={icon} label={item.label} iconKey={iconKey} />
          );
        })}
        {(role === USER_ROLES.ADMIN || role === USER_ROLES.PARTICIPANT || role === USER_ROLES.JUDGE) && (
          <motion.button
            onClick={handleLogout}
            className="px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogoutIcon />
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
}

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="pt-8 pb-4 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-11 h-11 bg-gradient-to-br from-[#a8842d] via-[#d4b069] to-[#e8c98a] rounded-xl flex items-center justify-center shadow-lg shadow-[#d4b069]/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg font-bold text-[#1a1306]">CH</span>
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-white">{t('app.title')}</h1>
            <p className="text-xs text-white/40">{t('app.subtitle')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
