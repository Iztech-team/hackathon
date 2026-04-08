import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useHackathonState } from '../hooks/useHackathonState';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Avatar, TeamLogo } from '../components/ui/Avatar';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { Snowfall } from '../components/ui/Snowfall';
import { CATEGORY_LIST, calculateTotalScore } from '../data/categories';

// Normalize a snapshot team (from the backend's /leaderboard/snapshot) to the
// shape the rest of this page already expects (camelCase).
function normalizeSnapshotTeam(t) {
  return {
    id: t.id,
    teamName: t.team_name,
    projectName: t.project_name,
    description: t.description,
    logoSeed: t.logo_seed,
    members: (t.members || []).map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      avatarSeed: m.avatar_seed,
    })),
    scores: t.scores || {},
  };
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teams: liveTeams } = useTeams();
  const { leaderboardFrozen } = useHackathonState();
  const [snapshotTeams, setSnapshotTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = overall, or category id
  const [searchQuery, setSearchQuery] = useState('');

  // When frozen, fetch the snapshot stored server-side at freeze time.
  // When unfrozen, fall back to the live teams list.
  useEffect(() => {
    let cancelled = false;
    if (leaderboardFrozen) {
      api
        .getLeaderboardSnapshot()
        .then((res) => {
          if (cancelled) return;
          const list = Array.isArray(res?.leaderboard) ? res.leaderboard : [];
          setSnapshotTeams(list.map(normalizeSnapshotTeam));
        })
        .catch(() => {
          if (!cancelled) setSnapshotTeams([]);
        });
    } else {
      setSnapshotTeams([]);
    }
    return () => { cancelled = true; };
  }, [leaderboardFrozen]);

  const teams = leaderboardFrozen ? snapshotTeams : liveTeams;

  // Filter and sort teams based on search and selected category
  const sortedTeams = [...teams]
    .map((team) => ({
      ...team,
      totalScore: calculateTotalScore(team.scores),
      displayScore: selectedCategory
        ? team.scores?.[selectedCategory] || 0
        : calculateTotalScore(team.scores),
    }))
    .filter((team) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        team.teamName.toLowerCase().includes(query) ||
        team.projectName.toLowerCase().includes(query) ||
        team.members?.some((m) => m.name.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => b.displayScore - a.displayScore);

  const selectedCategoryData = selectedCategory
    ? CATEGORY_LIST.find((c) => c.id === selectedCategory)
    : null;

  const getRankStyle = (position) => {
    if (position === 0) {
      return leaderboardFrozen
        ? 'border-sky-400/40 bg-sky-400/[0.05]'
        : 'border-[#d4b069]/40 bg-[#d4b069]/[0.05]';
    }
    if (position === 1) return 'border-zinc-400/20 bg-zinc-400/[0.04]';
    if (position === 2) return 'border-amber-700/30 bg-amber-700/[0.04]';
    return 'border-white/[0.06] bg-white/[0.02]';
  };

  // Rank badge — same shape and size for everyone, color/glow varies by rank
  const getRankBadge = (position) => {
    const isGold = position === 0;
    const isSilver = position === 1;
    const isBronze = position === 2;

    let cardClasses = 'bg-white/[0.04] border-white/10 text-white/60';
    if (isGold) {
      cardClasses = leaderboardFrozen
        ? 'bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#bae6fd] text-[#0c4a6e] border-sky-400/60 shadow-lg shadow-sky-400/40'
        : 'bg-gradient-to-br from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] border-[#d4b069]/60 shadow-lg shadow-[#d4b069]/40';
    } else if (isSilver) {
      cardClasses = 'bg-gradient-to-br from-zinc-400 to-zinc-600 text-black border-zinc-400/40 shadow-lg shadow-zinc-400/20';
    } else if (isBronze) {
      cardClasses = 'bg-gradient-to-br from-amber-600 to-amber-800 text-black border-amber-700/40 shadow-lg shadow-amber-700/20';
    }

    // Glow color per rank — #1 flips from gold to sky blue when frozen
    const glowBg = isGold
      ? (leaderboardFrozen ? 'bg-sky-400' : 'bg-[#d4b069]')
      : isSilver
      ? 'bg-zinc-400'
      : 'bg-amber-700';

    return (
      <div className="relative flex-shrink-0">
        {(isGold || isSilver || isBronze) && (
          <div className={`absolute -inset-0.5 rounded-2xl blur-md opacity-50 ${glowBg}`} />
        )}
        <div className={`relative w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-extrabold text-base tabular-nums ${cardClasses}`}>
          {position + 1}
        </div>
      </div>
    );
  };

  if (sortedTeams.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#d4b069]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#d4b069]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{t('leaderboard.noTeams')}</h2>
              <p className="text-white/40">{t('home.tagline')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto relative ${leaderboardFrozen ? 'leaderboard-frozen' : ''}`}>
      {/* Heavy snowfall overlay on top of the whole leaderboard */}
      {leaderboardFrozen && <Snowfall count={80} />}

      {/* Frozen banner */}
      {leaderboardFrozen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl overflow-hidden relative border border-sky-400/40 bg-gradient-to-br from-sky-500/15 via-cyan-400/10 to-blue-500/15 backdrop-blur-sm"
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(186,230,253,0.3), transparent 40%), radial-gradient(circle at 80% 80%, rgba(125,211,252,0.2), transparent 45%)'
          }} />
          <div className="relative p-5 sm:p-6 flex items-center gap-4">
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-sky-400 rounded-2xl blur-xl opacity-40 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/40">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3m15.364-6.364L5.636 18.364m12.728 0L5.636 5.636" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold text-sky-100 tracking-tight">
                {t('leaderboard.frozenTitle')}
              </h3>
              <p className="text-sm text-sky-200/80 mt-1">{t('leaderboard.frozenSubtitle')}</p>
              <p className="text-xs text-sky-200/50 mt-2">{t('leaderboard.frozenNote')}</p>
            </div>
          </div>
          {/* Bottom shimmer line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
        </motion.div>
      )}

      <Card className={leaderboardFrozen ? 'ring-1 ring-sky-400/20' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl ${leaderboardFrozen ? 'text-sky-100' : ''}`}>
                {t('leaderboard.title')}
              </CardTitle>
              <CardDescription>
                {t('leaderboard.subtitle')}
              </CardDescription>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              leaderboardFrozen ? 'bg-sky-400/15' : 'bg-[#d4b069]/10'
            }`}>
              {leaderboardFrozen ? (
                <svg className="w-6 h-6 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m9-9H3m15.364-6.364L5.636 18.364m12.728 0L5.636 5.636" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-[#d4b069]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4b069]/50 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="mb-6 pb-6 border-b border-white/[0.06] -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === null
                    ? 'bg-[#d4b069] text-[#1a1306] shadow-lg shadow-[#d4b069]/30'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {t('leaderboard.overall')}
              </button>
              {CATEGORY_LIST.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'text-white shadow-lg'
                      : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white'
                  }`}
                  style={
                    selectedCategory === category.id
                      ? { backgroundColor: category.color, boxShadow: `0 10px 20px -10px ${category.color}50` }
                      : {}
                  }
                >
                  {t(`categories.${category.id}`)}
                </button>
              ))}
            </div>
          </div>

          {/* ------- Team row renderer (shared by mobile list + desktop grid) ------- */}
          {(() => {
            const renderTeamCard = (team, index) => {
              const isExpanded = expandedTeam === team.id;
              const maxScore = Math.max(...Object.values(team.scores || {}), 1);

              return (
                <div
                  key={team.id}
                  className={`rounded-2xl border transition-all duration-300 ${getRankStyle(index)} ${
                    isExpanded ? 'ring-1 ring-[#d4b069]/40' : ''
                  }`}
                >
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                    onClick={() => {
                      if (isExpanded) {
                        navigate(`/teams/${team.id}`);
                      } else {
                        setExpandedTeam(team.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {getRankBadge(index)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
                          {team.teamName}
                        </h3>
                        {team.projectName && (
                          <p className="text-xs sm:text-sm text-white/40 mt-1 truncate">
                            {team.projectName}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[64px] sm:min-w-[80px] px-3 py-2 rounded-xl bg-black/30 border border-white/[0.08]">
                        <div
                          className="text-xl sm:text-2xl font-extrabold tabular-nums leading-none"
                          style={{ color: selectedCategoryData?.color || '#d4b069' }}
                        >
                          {team.displayScore}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider mt-1">
                          {selectedCategoryData ? t(`categories.${selectedCategoryData.id}`) : t('common.total')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-white/[0.04]">
                      <div className="space-y-3 mb-4">
                        <p className="text-xs text-white/40 uppercase tracking-wider">
                          {t('team.scoreBreakdown')}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                          {CATEGORY_LIST.map((category, catIndex) => {
                            const score = team.scores?.[category.id] || 0;
                            const percentage = (score / maxScore) * 100;
                            return (
                              <motion.div
                                key={category.id}
                                className="space-y-1.5"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: catIndex * 0.08, duration: 0.3 }}
                              >
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-white">
                                    {t(`categories.${category.id}`)}
                                  </span>
                                  <span className="font-semibold" style={{ color: category.color }}>
                                    {score} {t('common.points')}
                                  </span>
                                </div>
                                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                      background: `linear-gradient(90deg, ${category.color}90 0%, ${category.color} 50%, ${category.color}dd 100%)`,
                                      boxShadow: `0 0 10px ${category.color}40`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{
                                      delay: catIndex * 0.08 + 0.15,
                                      duration: 0.5,
                                      ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                  />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {team.members && team.members.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                            {t('team.teamMembers')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {team.members.map((member, idx) => (
                              <motion.div
                                key={idx}
                                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.45 + idx * 0.05 }}
                              >
                                <Avatar seed={member.avatarSeed} size="xs" />
                                <span className="text-xs sm:text-sm text-white/70">
                                  {member.name}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              );
            };

            // Desktop-only podium card for the top 3 (bigger visuals)
            const renderPodiumCard = (team, index) => {
              if (!team) return <div key={`empty-${index}`} />;
              const isFirst = index === 0;
              const glowBg =
                index === 0
                  ? (leaderboardFrozen ? 'bg-sky-400' : 'bg-[#d4b069]')
                  : index === 1
                  ? 'bg-zinc-400'
                  : 'bg-amber-700';
              const borderCls =
                index === 0
                  ? (leaderboardFrozen ? 'border-sky-400/40' : 'border-[#d4b069]/40')
                  : index === 1
                  ? 'border-zinc-400/25'
                  : 'border-amber-700/30';
              const bgCls =
                index === 0
                  ? (leaderboardFrozen ? 'bg-sky-400/[0.06]' : 'bg-[#d4b069]/[0.06]')
                  : index === 1
                  ? 'bg-zinc-400/[0.04]'
                  : 'bg-amber-700/[0.04]';
              const isExpanded = expandedTeam === team.id;

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.45 }}
                  className={`relative rounded-3xl border-2 ${borderCls} ${bgCls} overflow-hidden cursor-pointer hover:brightness-110 transition-all ${
                    isFirst ? '-mt-4' : ''
                  } ${isExpanded ? 'ring-2 ring-[#d4b069]/30' : ''}`}
                  onClick={() => {
                    if (isExpanded) {
                      navigate(`/teams/${team.id}`);
                    } else {
                      setExpandedTeam(team.id);
                    }
                  }}
                >
                  {/* Glow aura */}
                  <div className={`absolute -inset-2 ${glowBg} blur-3xl opacity-20 pointer-events-none`} />

                  <div className="relative p-6 flex flex-col items-center text-center">
                    {/* Rank crown */}
                    <div className="mb-4">{getRankBadge(index)}</div>

                    {/* Team name */}
                    <h3
                      className={`font-extrabold text-white leading-tight truncate max-w-full ${
                        isFirst ? 'text-2xl' : 'text-xl'
                      }`}
                      title={team.teamName}
                    >
                      {team.teamName}
                    </h3>
                    {team.projectName && (
                      <p className="text-xs text-white/40 mt-1 truncate max-w-full">{team.projectName}</p>
                    )}

                    {/* Big score */}
                    <div className="mt-5 px-5 py-3 rounded-2xl bg-black/30 border border-white/[0.08] min-w-[120px]">
                      <div
                        className={`font-extrabold tabular-nums leading-none ${isFirst ? 'text-4xl' : 'text-3xl'}`}
                        style={{ color: selectedCategoryData?.color || '#d4b069' }}
                      >
                        {team.displayScore}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1.5">
                        {selectedCategoryData ? t(`categories.${selectedCategoryData.id}`) : t('common.total')}
                      </div>
                    </div>

                    {/* Members avatars */}
                    {team.members && team.members.length > 0 && (
                      <div className="flex -space-x-2 mt-4">
                        {team.members.slice(0, 5).map((m, i) => (
                          <Avatar
                            key={i}
                            seed={m.avatarSeed}
                            size="xs"
                            className="ring-2 ring-black/50"
                          />
                        ))}
                        {team.members.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/70 flex items-center justify-center ring-2 ring-black/50">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            };

            // Order top 3 for desktop podium: #2 on the left, #1 centered, #3 on the right
            const top3 = sortedTeams.slice(0, 3);
            const podium = [top3[1], top3[0], top3[2]]; // visual order left-to-right
            const restTeams = sortedTeams.slice(3);

            return (
              <>
                {/* Mobile: single-column list of all teams */}
                <div className="space-y-3 lg:hidden">
                  {sortedTeams.map((team, index) => renderTeamCard(team, index))}
                </div>

                {/* Desktop: podium for top 3 + two-column grid for the rest */}
                <div className="hidden lg:block">
                  {top3.length > 0 && (
                    <div className="grid grid-cols-3 gap-5 mb-8 items-start pt-4">
                      {podium.map((team, i) =>
                        renderPodiumCard(team, team ? sortedTeams.indexOf(team) : i)
                      )}
                    </div>
                  )}
                  {restTeams.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {restTeams.map((team) =>
                        renderTeamCard(team, sortedTeams.indexOf(team))
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">
                {selectedCategoryData ? t(`categories.${selectedCategoryData.id}`) : t('leaderboard.totalTeams')}
              </span>
              <span className="font-semibold text-white">{sortedTeams.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
