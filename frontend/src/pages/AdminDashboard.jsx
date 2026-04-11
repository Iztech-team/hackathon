import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useHackathonState } from '../hooks/useHackathonState';
import { api } from '../lib/api';
import { useJudges } from '../context/JudgeContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { calculateTotalScore } from '../data/categories';
import { config } from '../lib/config';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { teams, resetToMockData: resetTeams, fetchTeams, deleteTeam } = useTeams();
  const [deletingTeamId, setDeletingTeamId] = useState(null);

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(t('admin.confirmDeleteTeam', { name: team.team_name || team.teamName }))) return;
    setDeletingTeamId(team.id);
    try {
      await deleteTeam(team.id);
    } catch (err) {
      window.alert(err.message || 'Failed to delete team');
    } finally {
      setDeletingTeamId(null);
    }
  };
  const {
    state: hackathonState,
    override,
    leaderboardFrozen,
    registrationOpen,
    refresh: refreshHackathon,
    setOverride,
    setFreeze,
    setRegistrationOpen,
  } = useHackathonState();
  // Invite link state
  const [inviteLinkValue, setInviteLinkValue] = useState('');
  const [inviteLinkRevealed, setInviteLinkRevealed] = useState(false);
  const [inviteLinkBusy, setInviteLinkBusy] = useState(false);
  const [inviteLinkMsg, setInviteLinkMsg] = useState('');

  useEffect(() => {
    api.getInviteLinkStatus().then((s) => {
      setInviteLinkValue(s.invite_link || '');
      setInviteLinkRevealed(!!s.revealed);
    }).catch(() => {});
  }, []);

  const handleSaveInviteLink = async () => {
    setInviteLinkBusy(true);
    setInviteLinkMsg('');
    try {
      const s = await api.setInviteLink(inviteLinkValue);
      setInviteLinkValue(s.invite_link);
      setInviteLinkMsg(t('admin.inviteLink.saved'));
      setTimeout(() => setInviteLinkMsg(''), 3000);
    } catch (err) {
      setInviteLinkMsg(err.message || 'Failed');
    } finally {
      setInviteLinkBusy(false);
    }
  };

  const handleRevealInviteLink = async (revealed) => {
    setInviteLinkBusy(true);
    try {
      const s = await api.revealInviteLink(revealed);
      setInviteLinkRevealed(s.revealed);
    } catch (err) {
      setInviteLinkMsg(err.message || 'Failed');
    } finally {
      setInviteLinkBusy(false);
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

  // Password reset modal state
  const [showPwReset, setShowPwReset] = useState(false);
  const [pwSearchQuery, setPwSearchQuery] = useState('');
  const [pwUsers, setPwUsers] = useState([]);
  const [pwSelectedUser, setPwSelectedUser] = useState(null);
  const [pwNewPassword, setPwNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  // Fetch users when modal opens or search query changes
  const fetchPwUsers = async (q) => {
    try {
      const data = await api.searchUsers(q || '');
      setPwUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('User search failed:', err);
      setPwUsers([]);
    }
  };

  // Load all users immediately when modal opens
  useEffect(() => {
    if (showPwReset) fetchPwUsers('');
  }, [showPwReset]);

  // Debounced search as user types
  useEffect(() => {
    if (!showPwReset) return;
    const timer = setTimeout(() => fetchPwUsers(pwSearchQuery), 250);
    return () => clearTimeout(timer);
  }, [pwSearchQuery]);

  const handleResetPassword = async () => {
    if (!pwSelectedUser || !pwNewPassword || pwNewPassword.length < 4) return;
    setPwLoading(true);
    setPwMessage('');
    try {
      const res = await api.resetPassword(pwSelectedUser.id, pwNewPassword);
      setPwMessage(res.message || 'Password reset!');
      setPwNewPassword('');
      setPwSelectedUser(null);
    } catch (err) {
      setPwMessage(err.message || 'Failed');
    } finally {
      setPwLoading(false);
    }
  };

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <Link to="/admin/judges">
          <Button glow className="w-full h-auto py-4 flex-col gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{t('admin.judgesTab')}</span>
          </Button>
        </Link>
        <Link to="/admin/volunteers">
          <Button glow className="w-full h-auto py-4 flex-col gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">{t('admin.volunteersTab')}</span>
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
        <Button glow onClick={() => { setShowPwReset(true); setPwMessage(''); setPwSelectedUser(null); setPwNewPassword(''); setPwSearchQuery(''); }} className="w-full h-auto py-4 flex-col gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="text-sm">{t('admin.resetPassword')}</span>
        </Button>
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
                : 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30'
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
                      ? 'bg-gradient-to-br from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] border-[#3b82f6] shadow-lg shadow-[#3b82f6]/30'
                      : 'bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="text-xl font-extrabold tabular-nums leading-none">{h}</div>
                  <div className={`text-[9px] uppercase tracking-widest mt-1 ${active ? 'text-[#ffffff]/70' : 'text-white/40'}`}>
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
                  ? 'bg-gradient-to-br from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] border-[#3b82f6] shadow-lg shadow-[#3b82f6]/30'
                  : 'bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              <div className="text-xl font-extrabold leading-none">+</div>
              <div className={`text-[9px] uppercase tracking-widest mt-1 ${isCustom ? 'text-[#ffffff]/70' : 'text-white/40'}`}>
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
                className="flex-1 h-11 px-4 rounded-xl text-base text-white bg-black/30 border border-white/[0.15] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50"
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

        {/* Registration open/closed toggle */}
        <div className="pt-4 mt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                {registrationOpen ? t('admin.registrationOpen') : t('admin.registrationClosed')}
              </p>
              <p className="text-[11px] text-white/40 mt-1">{t('admin.registrationDesc')}</p>
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
                registrationOpen
                  ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/40'
                  : 'bg-red-500/15 text-red-300 border border-red-500/40'
              }`}
            >
              {registrationOpen ? 'open' : 'closed'}
            </span>
          </div>
          <Button
            onClick={() => setRegistrationOpen(!registrationOpen)}
            className="w-full text-white"
            style={{
              background: registrationOpen
                ? 'linear-gradient(to right, #b91c1c, #ef4444)'
                : 'linear-gradient(to right, #047857, #10b981)',
            }}
          >
            <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={registrationOpen
                ? "M12 15v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12.25a2 2 0 00-3.48 0L3.2 16a2 2 0 001.73 3z"
                : "M18 8h1a4 4 0 010 8h-1M5 20h10a2 2 0 002-2v-8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zm5-6a2 2 0 100-4 2 2 0 000 4z"} />
            </svg>
            {registrationOpen ? t('admin.closeRegistration') : t('admin.openRegistration')}
          </Button>
        </div>
      </div>

      {/* Invite Link Management */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              {t('admin.inviteLink.title')}
            </h3>
            <p className="text-xs text-white/40 mt-1">{t('admin.inviteLink.desc')}</p>
          </div>
          <span
            className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${
              inviteLinkRevealed
                ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/40'
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}
          >
            {inviteLinkRevealed ? t('admin.inviteLink.revealedToAll') : t('admin.inviteLink.arrivedOnly')}
          </span>
        </div>

        {inviteLinkMsg && (
          <div className="rounded-xl p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20">
            <p className="text-[#60a5fa] text-sm font-medium">{inviteLinkMsg}</p>
          </div>
        )}

        {/* Link input */}
        <div className="flex gap-2">
          <Input
            value={inviteLinkValue}
            onChange={(e) => setInviteLinkValue(e.target.value)}
            placeholder={t('admin.inviteLink.placeholder')}
            className="flex-1"
          />
          <Button
            onClick={handleSaveInviteLink}
            disabled={inviteLinkBusy || !inviteLinkValue.trim()}
            size="sm"
          >
            {t('common.save')}
          </Button>
        </div>

        {/* Reveal toggle */}
        <Button
          onClick={() => handleRevealInviteLink(!inviteLinkRevealed)}
          disabled={inviteLinkBusy || !inviteLinkValue.trim()}
          className="w-full text-white"
          style={{
            background: inviteLinkRevealed
              ? undefined
              : 'linear-gradient(to right, #047857, #10b981)',
          }}
          variant={inviteLinkRevealed ? 'outline' : 'default'}
        >
          <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
              inviteLinkRevealed
                ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            } />
          </svg>
          {inviteLinkRevealed ? t('admin.inviteLink.hideFromAll') : t('admin.inviteLink.revealToAll')}
        </Button>

        <p className="text-[11px] text-white/40">{t('admin.inviteLink.note')}</p>
      </div>

      {/* Manage Teams */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            {t('admin.manageTeams')}
          </h3>
          <p className="text-xs text-white/40 mt-1">{t('admin.manageTeamsDesc')}</p>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-white/40">{t('leaderboard.noTeams')}</p>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {team.team_name || team.teamName}
                  </div>
                  <div className="text-xs text-white/40 truncate">
                    {(team.members?.length || 0)} {t('team.members')}
                    {team.project_name ? ` · ${team.project_name}` : ''}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteTeam(team)}
                  disabled={deletingTeamId === team.id}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  <svg className="w-4 h-4 me-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deletingTeamId === team.id ? '...' : t('common.delete')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Password Reset Modal */}
      {showPwReset && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowPwReset(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">{t('admin.pwReset.title')}</h3>
                <p className="text-xs text-white/50">{t('admin.pwReset.desc')}</p>
              </div>
            </div>

            {pwMessage && (
              <div className="rounded-xl p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-sm text-[#60a5fa]">
                {pwMessage}
              </div>
            )}

            {/* User search */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70 uppercase tracking-wider">
                {t('admin.pwReset.searchUser')}
              </label>
              <Input
                value={pwSearchQuery}
                onChange={(e) => { setPwSearchQuery(e.target.value); setPwSelectedUser(null); }}
                placeholder={t('admin.pwReset.searchPlaceholder')}
              />
              {pwUsers.length > 0 && !pwSelectedUser && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06]">
                  {pwUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setPwSelectedUser(u)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-sm text-white font-medium">{u.username}</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/40 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {pwSelectedUser && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/30">
                  <span className="text-sm text-white font-medium flex-1">{pwSelectedUser.username}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#60a5fa]">{pwSelectedUser.role}</span>
                  <button type="button" onClick={() => setPwSelectedUser(null)} className="text-white/40 hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* New password */}
            {pwSelectedUser && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/70 uppercase tracking-wider">
                  {t('admin.pwReset.newPassword')}
                </label>
                <Input
                  type="text"
                  value={pwNewPassword}
                  onChange={(e) => setPwNewPassword(e.target.value)}
                  placeholder={t('admin.pwReset.newPasswordPlaceholder')}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowPwReset(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={!pwSelectedUser || !pwNewPassword || pwNewPassword.length < 4 || pwLoading}
                className="flex-1"
              >
                {pwLoading ? '...' : t('admin.pwReset.submit')}
              </Button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
