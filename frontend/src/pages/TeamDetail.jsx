import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { CATEGORY_LIST, calculateTotalScore } from '../data/categories';

export default function TeamDetail() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getTeamById, getTeamByIdAsync, getSortedTeams } = useTeams();
  const [team, setTeam] = useState(() => getTeamById(teamId));
  const [loading, setLoading] = useState(!team);

  useEffect(() => {
    let cancelled = false;
    if (!team) {
      setLoading(true);
      getTeamByIdAsync(teamId)
        .then((t) => { if (!cancelled) setTeam(t); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [teamId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-white/50">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-white/50">{t('team.notFound')}</p>
            <Button onClick={() => navigate('/leaderboard')} variant="outline" className="mt-4">
              {t('team.viewLeaderboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedTeams = getSortedTeams();
  const rank = sortedTeams.findIndex((tm) => tm.id === team.id) + 1;
  const totalScore = calculateTotalScore(team.scores);
  const maxCategoryScore = Math.max(...Object.values(team.scores || {}), 1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/leaderboard" className="text-sm text-white/40 hover:text-white inline-block">
        &larr; {t('team.viewLeaderboard')}
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d4b069]/15 via-[#a8842d]/8 to-transparent border border-white/[0.08]">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Center */}
            <div className="flex-1 text-center md:text-start">
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {team.teamName}
              </motion.h1>
              {team.projectName && (
                <p className="text-lg text-[#d4b069] font-medium mb-2">{team.projectName}</p>
              )}
              {team.description && (
                <p className="text-sm text-white/50 max-w-md">{team.description}</p>
              )}

              <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                <div className="flex -space-x-2">
                  {(team.members || []).slice(0, 4).map((member, idx) => (
                    <Avatar key={idx} seed={member.avatarSeed} size="sm" className="ring-2 ring-black/50" />
                  ))}
                </div>
                <span className="text-sm text-white/40">{(team.members || []).length} {t('team.members')}</span>
              </div>
            </div>

            {/* Score & Rank */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-center px-6 py-4 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/[0.06]">
                <div className="text-5xl font-bold text-[#d4b069] mb-1">{totalScore}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{t('team.totalPoints')}</div>
              </div>
              {rank > 0 && <Badge className="text-base px-4 py-1.5">{t('common.rank')} #{rank}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('team.scoreBreakdown')}</CardTitle>
          <CardDescription>{t('team.scoreBreakdownDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CATEGORY_LIST.map((category, index) => {
              const score = team.scores?.[category.id] || 0;
              const percentage = maxCategoryScore > 0 ? (score / maxCategoryScore) * 100 : 0;
              return (
                <motion.div
                  key={category.id}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{t(`categories.${category.id}`)}</span>
                    <span className="text-sm font-bold" style={{ color: category.color }}>
                      {score} {t('common.points')}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${category.color}90 0%, ${category.color} 50%, ${category.color}dd 100%)`,
                        boxShadow: `0 0 12px ${category.color}40`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.08 + 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-sm text-white/50">{t('team.totalScore')}</span>
            <span className="text-xl font-bold text-[#d4b069]">{totalScore} {t('common.points')}</span>
          </motion.div>
        </CardContent>
      </Card>

      {/* Members */}
      {team.members && team.members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('team.teamMembers')}</CardTitle>
            <CardDescription>{(team.members || []).length} {t('team.members')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.members.map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                  className="relative group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-[#a8842d] to-[#e8c98a] rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                  <div className="relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#d4b069]/30 transition-colors">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#d4b069] rounded-full blur-lg opacity-30" />
                      <Avatar seed={member.avatarSeed} size="xl" className="relative ring-2 ring-[#d4b069]/30" />
                    </div>
                    <div className="text-center min-w-0 w-full">
                      <p className="font-bold text-white truncate text-base">{member.name}</p>
                      {member.phone && (
                        <p className="text-xs text-white/40 mt-1 tabular-nums truncate" dir="ltr">{member.phone}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
