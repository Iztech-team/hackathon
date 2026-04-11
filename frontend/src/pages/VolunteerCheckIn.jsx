import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';

export default function VolunteerCheckIn() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Confirmation modal state
  const [confirmTeam, setConfirmTeam] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const handleConfirmCheckIn = async () => {
    if (!confirmTeam) return;
    const teamId = confirmTeam.id;
    setActionLoading(teamId);
    try {
      await api.checkInTeam(teamId);
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, arrived: true, arrived_at: new Date().toISOString() } : t))
      );
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setActionLoading(null);
      setConfirmTeam(null);
    }
  };

  const handleUndo = async (teamId) => {
    setActionLoading(teamId);
    try {
      await api.undoCheckIn(teamId);
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, arrived: false, arrived_at: null } : t))
      );
    } catch (err) {
      console.error('Undo check-in failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = teams.filter((team) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      team.team_name?.toLowerCase().includes(q) ||
      team.project_name?.toLowerCase().includes(q) ||
      team.members?.some((m) => m.name?.toLowerCase().includes(q))
    );
  });

  const arrivedCount = teams.filter((t) => t.arrived).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-1">{t('volunteer.title')}</h1>
        <p className="text-sm text-white/50">
          {t('volunteer.welcome', { name: user?.name || 'Volunteer' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 text-center">
          <div className="text-3xl font-extrabold text-emerald-400 tabular-nums">{arrivedCount}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{t('volunteer.arrived')}</div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
          <div className="text-3xl font-extrabold text-white/70 tabular-nums">{teams.length - arrivedCount}</div>
          <div className="text-xs text-white/50 uppercase tracking-wider mt-1">{t('volunteer.remaining')}</div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t('volunteer.checkInTeams')}</CardTitle>
          <CardDescription>{t('volunteer.searchDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('volunteer.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-white/40 text-sm">{t('common.loading') || 'Loading...'}</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-white/40 text-sm">{t('volunteer.noResults')}</div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((team) => {
                  const isArrived = !!team.arrived;
                  const isLoading = actionLoading === team.id;
                  return (
                    <motion.div
                      key={team.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${
                        isArrived
                          ? 'border-emerald-400/40 bg-emerald-400/[0.06]'
                          : 'border-white/[0.08] bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex -space-x-2 flex-shrink-0">
                        {(team.members || []).slice(0, 3).map((m, i) => (
                          <Avatar key={i} seed={m.avatar_seed} size="sm" className="ring-2 ring-black/50" />
                        ))}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white truncate">{team.team_name}</h4>
                          {isArrived && (
                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                              {t('volunteer.here')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 truncate">
                          {(team.members || []).map((m) => m.name).join(' · ') || team.project_name}
                        </p>
                      </div>

                      {isArrived ? (
                        <Button
                          onClick={() => handleUndo(team.id)}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 text-xs"
                        >
                          {t('volunteer.undo')}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setConfirmTeam(team)}
                          disabled={isLoading}
                          size="sm"
                          className="flex-shrink-0 text-white text-xs"
                          style={{ background: 'linear-gradient(to right, #047857, #10b981)' }}
                        >
                          {t('volunteer.checkIn')}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation modal — shows team members + emails before check-in */}
      {confirmTeam && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !actionLoading && setConfirmTeam(null)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0a0a0a] p-6 space-y-5 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-emerald-400/50 flex items-center justify-center text-xl"
                style={{ background: 'linear-gradient(to right, #047857, #10b981)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white">{t('volunteer.confirmTitle')}</h3>
                <p className="text-xs text-white/50">{confirmTeam.team_name}</p>
              </div>
            </div>

            {/* Members list */}
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">{t('volunteer.membersEmails')}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(confirmTeam.members || []).length === 0 ? (
                  <p className="text-sm text-white/40 italic">{t('volunteer.noMembers')}</p>
                ) : (
                  (confirmTeam.members || []).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <Avatar seed={m.avatar_seed} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{m.name}</p>
                        <p className="text-xs text-white/40 truncate">
                          {m.email || <span className="italic text-white/25">{t('volunteer.noEmail')}</span>}
                        </p>
                      </div>
                      {m.email && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400" title="Email set" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmTeam(null)}
                disabled={!!actionLoading}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleConfirmCheckIn}
                disabled={!!actionLoading}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(to right, #047857, #10b981)' }}
              >
                {actionLoading ? '...' : t('volunteer.confirmArrival')}
              </Button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
