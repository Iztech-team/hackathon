import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useHackathonState } from '../hooks/useHackathonState';
import { api } from '../lib/api';
import { useJudges } from '../context/JudgeContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { calculateTotalScore } from '../data/categories';
import { config } from '../lib/config';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { teams, resetToMockData: resetTeams, fetchTeams } = useTeams();
  const { state: hackathonState, override, leaderboardFrozen, refresh: refreshHackathon, setOverride, setFreeze } = useHackathonState();
  const [keysStatus, setKeysStatus] = useState(null);
  const [keysBusy, setKeysBusy] = useState(false);
  const [keysMessage, setKeysMessage] = useState('');
  const [keysError, setKeysError] = useState('');

  const refreshKeysStatus = async () => {
    try {
      const s = await api.getApiKeysStatus();
      setKeysStatus(s);
    } catch (err) {
      // ignore (e.g. not admin yet)
    }
  };

  useEffect(() => {
    refreshKeysStatus();
  }, []);

  const handleKeysUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKeysBusy(true);
    setKeysError('');
    setKeysMessage('');
    try {
      const s = await api.uploadApiKeysCsv(file);
      setKeysStatus(s);
      setKeysMessage(t('admin.apiKeys.uploadSuccess'));
      setTimeout(() => setKeysMessage(''), 3000);
    } catch (err) {
      setKeysError(err.message || 'Upload failed');
    } finally {
      setKeysBusy(false);
      e.target.value = '';
    }
  };

  const handleKeysReveal = async (revealed) => {
    setKeysBusy(true);
    try {
      const s = await api.setApiKeysReveal(revealed);
      setKeysStatus(s);
    } catch (err) {
      setKeysError(err.message || 'Failed');
    } finally {
      setKeysBusy(false);
    }
  };

  const handleKeysClear = async () => {
    if (!window.confirm(t('admin.apiKeys.confirmClear'))) return;
    setKeysBusy(true);
    try {
      const s = await api.clearApiKeys();
      setKeysStatus(s);
    } catch (err) {
      setKeysError(err.message || 'Failed');
    } finally {
      setKeysBusy(false);
    }
  };
  const PRESET_HOURS = [1, 3, 6, 8, 12, 24];
  const [durationHours, setDurationHours] = useState(6);
  const [isCustom, setIsCustom] = useState(false);
  const [startingHackathon, setStartingHackathon] = useState(false);

  const handleStartHackathon = async () => {
    const hours = Number(durationHours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    setStartingHackathon(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
      await api.updateHackathonState({
        override: 'live',
        start_at: now.toISOString(),
        end_at: end.toISOString(),
      });
      await refreshHackathon();
    } finally {
      setStartingHackathon(false);
    }
  };

  // "Back to Auto" — clear override AND reset schedule to the default
  // hackathon date (April 14 2026, 09:00–15:00 Jerusalem time).
  const handleResetHackathon = async () => {
    await api.updateHackathonState({
      override: null,
      // Naive Jerusalem local strings; backend stores them as-is.
      start_at: '2026-04-14T09:00:00',
      end_at: '2026-04-14T15:00:00',
    });
    await refreshHackathon();
  };

  // Preview "ends at" time for the current duration choice — always shown in Jerusalem time
  const endsAtPreview = (() => {
    const h = Number(durationHours);
    if (!Number.isFinite(h) || h <= 0) return null;
    const end = new Date(Date.now() + h * 60 * 60 * 1000);
    return end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jerusalem',
    });
  })();
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

      {/* Hackathon State Control */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              {t('countdown.title')}
            </h3>
            <p className="text-xs text-white/40 mt-1">
              {hackathonState === 'live'
                ? t('admin.hackathonLive')
                : hackathonState === 'ended'
                ? t('admin.hackathonEnded')
                : t('admin.hackathonAuto')}
            </p>
          </div>
          <span
            className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
              hackathonState === 'live'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : hackathonState === 'ended'
                ? 'bg-white/5 text-white/40 border border-white/10'
                : 'bg-[#d4b069]/15 text-[#e8c98a] border border-[#d4b069]/30'
            }`}
          >
            {hackathonState}
          </span>
        </div>

        {/* Duration picker */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              {t('admin.durationHours')}
            </label>
            {endsAtPreview && (
              <span className="text-[11px] text-white/40 tabular-nums" dir="ltr">
                → {endsAtPreview}
              </span>
            )}
          </div>

          {/* Preset cards */}
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {PRESET_HOURS.map((h) => {
              const active = !isCustom && Number(durationHours) === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => { setIsCustom(false); setDurationHours(h); }}
                  className={`relative rounded-xl py-3 px-2 text-center transition-all border ${
                    active
                      ? 'bg-gradient-to-br from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] border-[#d4b069] shadow-lg shadow-[#d4b069]/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="text-xl font-extrabold tabular-nums leading-none">{h}</div>
                  <div className={`text-[9px] uppercase tracking-widest mt-1 ${active ? 'text-[#1a1306]/70' : 'text-white/40'}`}>
                    {h === 1 ? 'hour' : 'hours'}
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`relative rounded-xl py-3 px-2 text-center transition-all border ${
                isCustom
                  ? 'bg-gradient-to-br from-[#a8842d] via-[#d4b069] to-[#e8c98a] text-[#1a1306] border-[#d4b069] shadow-lg shadow-[#d4b069]/30'
                  : 'bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div className="text-xl font-extrabold leading-none">+</div>
              <div className={`text-[9px] uppercase tracking-widest mt-1 ${isCustom ? 'text-[#1a1306]/70' : 'text-white/40'}`}>
                custom
              </div>
            </button>
          </div>

          {/* Custom input row — only shown when "custom" is selected */}
          {isCustom && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0.25"
                max="48"
                step="0.25"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="flex-1 h-11 px-4 rounded-xl text-base text-white bg-black/30 border border-white/[0.15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#d4b069]/50"
                placeholder="e.g. 6.5"
              />
              <span className="text-sm text-white/50 uppercase tracking-widest">hrs</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleStartHackathon}
            disabled={startingHackathon || !Number(durationHours)}
            className="w-full"
            style={{
              background: 'linear-gradient(to right, #b91c1c, #ef4444)',
              color: 'white',
            }}
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
            {startingHackathon ? '...' : t('admin.startHackathon')}
          </Button>

          <Button
            variant="secondary"
            onClick={() => setOverride('ended')}
            disabled={override === 'ended'}
            className="w-full"
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h14v14H5z" />
            </svg>
            {t('admin.endHackathon')}
          </Button>

          <Button
            variant="outline"
            onClick={handleResetHackathon}
            className="w-full"
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('admin.resetHackathon')}
          </Button>
        </div>

        {/* Leaderboard freeze toggle */}
        <div className="pt-4 mt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                {leaderboardFrozen ? t('admin.leaderboardFrozen') : t('admin.leaderboardLive')}
              </p>
              <p className="text-[11px] text-white/40 mt-1">{t('admin.freezeDesc')}</p>
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
                leaderboardFrozen
                  ? 'bg-sky-400/15 text-sky-200 border border-sky-400/40'
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {leaderboardFrozen ? '❄ frozen' : 'live'}
            </span>
          </div>
          <Button
            onClick={() => setFreeze(!leaderboardFrozen)}
            className="w-full"
            style={
              leaderboardFrozen
                ? undefined
                : {
                    background: 'linear-gradient(to right, #0ea5e9, #38bdf8, #bae6fd)',
                    color: '#0c4a6e',
                  }
            }
            variant={leaderboardFrozen ? 'outline' : 'default'}
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9H3m15.364-6.364L5.636 18.364m12.728 0L5.636 5.636" />
            </svg>
            {leaderboardFrozen ? t('admin.unfreezeLeaderboard') : t('admin.freezeLeaderboard')}
          </Button>
        </div>
      </div>

      {/* API Keys Management */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              {t('admin.apiKeys.title')}
            </h3>
            <p className="text-xs text-white/40 mt-1">{t('admin.apiKeys.desc')}</p>
          </div>
          {keysStatus && (
            <span
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
                keysStatus.revealed
                  ? 'bg-[#d4b069]/15 text-[#e8c98a] border border-[#d4b069]/30'
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {keysStatus.revealed ? t('admin.apiKeys.revealed') : t('admin.apiKeys.hidden')}
            </span>
          )}
        </div>

        {keysStatus && (
          <p className="text-sm text-white/60">
            {t('admin.apiKeys.assigned', { assigned: keysStatus.assigned, total: keysStatus.total_teams })}
          </p>
        )}

        {keysMessage && (
          <div className="rounded-xl p-3 bg-[#d4b069]/10 border border-[#d4b069]/20">
            <p className="text-[#e8c98a] text-sm font-medium">{keysMessage}</p>
          </div>
        )}
        {keysError && (
          <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{keysError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="relative">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleKeysUpload}
              disabled={keysBusy}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <Button glow className="w-full pointer-events-none">
              <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.9-1A5.002 5.002 0 0117 16M9 19v-6m0 0l-3 3m3-3l3 3" />
              </svg>
              {t('admin.apiKeys.uploadCsv')}
            </Button>
          </label>

          <Button
            variant={keysStatus?.revealed ? 'secondary' : 'default'}
            glow={!keysStatus?.revealed}
            onClick={() => handleKeysReveal(!keysStatus?.revealed)}
            disabled={keysBusy || !keysStatus || keysStatus.assigned === 0}
            className="w-full"
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {keysStatus?.revealed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
            {keysStatus?.revealed ? t('admin.apiKeys.hide') : t('admin.apiKeys.reveal')}
          </Button>

          <Button
            variant="outline"
            onClick={handleKeysClear}
            disabled={keysBusy || !keysStatus || keysStatus.assigned === 0}
            className="w-full"
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('admin.apiKeys.clear')}
          </Button>
        </div>
      </div>
    </div>
  );
}
