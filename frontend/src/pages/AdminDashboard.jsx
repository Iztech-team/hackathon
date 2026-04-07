import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useJudges } from '../context/JudgeContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { calculateTotalScore } from '../data/categories';
import { config } from '../lib/config';
import { api } from '../lib/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { teams, resetToMockData: resetTeams, fetchTeams } = useTeams();
  const { judges, resetToMockData: resetJudges, fetchJudges } = useJudges();
  const [stats, setStats] = useState(null);

  // Fetch data on mount in API mode
  useEffect(() => {
    if (!config.useMockData) {
      fetchTeams();
      fetchJudges();
      api.getStats().then(setStats).catch(console.error);
    }
  }, []);

  // Calculate stats from local data or use API stats
  const totalTeams = stats?.total_teams ?? teams.length;
  const totalParticipants = stats?.total_participants ?? teams.reduce(
    (sum, team) => sum + (team.members?.length || 0),
    0
  );
  const totalJudges = stats?.total_judges ?? judges.length;
  const totalPoints = stats?.total_points ?? teams.reduce(
    (sum, team) => sum + calculateTotalScore(team.scores),
    0
  );

  const handleResetData = () => {
    if (window.confirm('Reset all data to mock data? This will clear all custom teams and judges.')) {
      resetTeams();
      resetJudges();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">{t('admin.dashboard')}</h1>
        <p className="text-sm text-white/50">{t('admin.overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalTeams}</div>
            <div className="text-sm text-white/40">{t('admin.teams')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalParticipants}</div>
            <div className="text-sm text-white/40">{t('admin.participants')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">{totalJudges}</div>
            <div className="text-sm text-white/40">{t('admin.judges')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-3xl font-bold text-[#2b58f7] mb-1">{totalPoints}</div>
            <div className="text-sm text-white/40">{t('admin.totalPoints')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin/judges">
          <Button glow className="w-full h-auto py-4 flex-col gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{t('admin.judgesTab')}</span>
          </Button>
        </Link>
        <Link to="/leaderboard">
          <Button glow className="w-full h-auto py-4 flex-col gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm">{t('admin.leaderboardTab')}</span>
          </Button>
        </Link>
        <Link to="/admin/export">
          <Button glow className="w-full h-auto py-4 flex-col gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm">{t('admin.exportTab')}</span>
          </Button>
        </Link>
        <Button glow onClick={handleResetData} className="w-full h-auto py-4 flex-col gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">{t('admin.resetData')}</span>
        </Button>
      </div>
    </div>
  );
}
