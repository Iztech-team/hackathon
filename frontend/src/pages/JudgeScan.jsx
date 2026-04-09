import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

// Safely stop a scanner instance — only attempts stop() when it's actually running
// or paused, and swallows any errors so React unmount doesn't crash.
async function safeStopScanner(scanner) {
  if (!scanner) return;
  try {
    const state = typeof scanner.getState === 'function' ? scanner.getState() : null;
    if (
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED
    ) {
      await scanner.stop();
    }
    if (typeof scanner.clear === 'function') {
      try { scanner.clear(); } catch { /* ignore */ }
    }
  } catch (_) {
    // Already stopped, never started, or permission denied — nothing to do.
  }
}
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField, FormLabel } from '../components/ui/FormField';
import { Avatar, TeamLogo } from '../components/ui/Avatar';
import { CategoryBadge } from '../components/ui/Badge';
import { getCategoryById, calculateTotalScore } from '../data/categories';
import { config } from '../lib/config';

export default function JudgeScan() {
  const { t } = useTranslation();
  const { teams, getTeamById, getTeamByIdAsync, setScore, addPoints, fetchTeams } = useTeams();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [points, setPoints] = useState(10);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const category = getCategoryById(user?.categoryId);

  // Compute rank for each team based on overall total score
  const teamsWithRank = teams
    .map((team) => ({
      ...team,
      _total: calculateTotalScore(team.scores),
    }))
    .sort((a, b) => b._total - a._total)
    .map((team, idx) => ({ ...team, rank: idx + 1 }));

  // Filter ranked teams by search query but preserve rank
  const filteredTeams = searchQuery.trim()
    ? teamsWithRank.filter((team) =>
        team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.projectName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teamsWithRank;

  useEffect(() => {
    return () => {
      // Use the safe helper so a never-started scanner (e.g. permission denied)
      // doesn't throw on unmount.
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      safeStopScanner(scanner);
    };
  }, []);

  const startScanning = async () => {
    setError('');
    setMessage('');

    const html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
          safeStopScanner(html5QrCode);
          html5QrCodeRef.current = null;
          setScanning(false);
        },
        () => {}
      );

      setScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      // Critical: clear the ref so the unmount cleanup doesn't try to stop a
      // scanner that never started.
      html5QrCodeRef.current = null;
      setScanning(false);
      setError('Failed to start camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanning = async () => {
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    setScanning(false);
    await safeStopScanner(scanner);
  };

  const handleScan = async (data) => {
    if (data.startsWith('team:')) {
      const teamId = data.replace('team:', '');

      try {
        let team;
        if (config.useMockData) {
          team = getTeamById(teamId);
        } else {
          team = await getTeamByIdAsync(teamId);
        }

        if (team) {
          setSelectedTeam(team);
          setError('');
        } else {
          setError('Team not found. Please ensure the team is registered.');
          setSelectedTeam(null);
        }
      } catch (err) {
        setError('Failed to fetch team data');
        setSelectedTeam(null);
      }
    } else {
      setError('Invalid QR code. Please scan a team badge.');
      setSelectedTeam(null);
    }
  };

  const [awarding, setAwarding] = useState(false);

  const handleAwardPoints = async () => {
    const numericPoints = typeof points === 'number' ? points : parseInt(points, 10);
    if (selectedTeam && Number.isFinite(numericPoints) && numericPoints >= 0 && numericPoints <= 15 && category) {
      setAwarding(true);
      setError('');
      try {
        // In API mode, use setScore (PUT/upsert). In mock mode, use addPoints (increment)
        if (config.useMockData) {
          addPoints(selectedTeam.id, category.id, numericPoints);
        } else {
          await setScore(selectedTeam.id, category.id, numericPoints);
        }
        setMessage(
          t('judge.scoreUpdated', { points: numericPoints, category: t(`categories.${category.id}`), team: selectedTeam.teamName || selectedTeam.team_name })
        );
        setSelectedTeam(null);
        setTimeout(() => setMessage(''), 4000);
      } catch (err) {
        setError(err.message || 'Failed to award points');
      } finally {
        setAwarding(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Judge Info Banner */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar seed={user?.avatarSeed} size="md" />
              <div>
                <p className="font-medium text-white">{user?.name}</p>
                <p className="text-xs text-white/40">{t('nav.judge')}</p>
              </div>
            </div>
            {category && (
              <div className="text-end">
                <p className="text-xs text-white/40 mb-1">{t('judge.judgingCategory')}</p>
                <CategoryBadge category={category} size="md" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {message && (
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: `${category?.color}10`,
            borderColor: `${category?.color}30`,
          }}
        >
          <p className="text-sm font-medium" style={{ color: category?.color }}>
            {message}
          </p>
        </div>
      )}

      {/* Selected Team - Award Points */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{t('judge.awardPoints')}</CardTitle>
                <CardDescription>{t('judge.reviewAndAward', { category: category ? t(`categories.${category.id}`) : '' })}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-2xl font-bold text-white">{selectedTeam.teamName}</p>
                  {selectedTeam.projectName && (
                    <p className="text-sm text-white/50 mt-1">{selectedTeam.projectName}</p>
                  )}
                </motion.div>

                <motion.div
                  className="grid grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                      {t('judge.totalScore')}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {calculateTotalScore(selectedTeam.scores)} {t('common.points')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                      {t('judge.categoryScore', { category: category ? t(`categories.${category.id}`) : '' })}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: category?.color }}>
                      {selectedTeam.scores[category?.id] || 0} {t('common.points')}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <FormField>
                    <FormLabel>{t('judge.pointsToAward', { category: category ? t(`categories.${category.id}`) : '' })}</FormLabel>
                    <Input
                      type="number"
                      min="0"
                      max="15"
                      value={points}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') { setPoints(''); return; }
                        const n = parseInt(v, 10);
                        if (Number.isNaN(n)) return;
                        setPoints(Math.max(0, Math.min(15, n)));
                      }}
                    />
                  </FormField>
                </motion.div>

                <motion.div
                  className="flex gap-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Button onClick={() => setSelectedTeam(null)} variant="outline" className="flex-1">
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleAwardPoints} glow className="flex-1 gap-2 group">
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                    {t('judge.award')}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Search Section */}
      {!selectedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${category?.color}20` }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: category?.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <CardTitle>{t('judge.searchTeam')}</CardTitle>
                <CardDescription>
                  {t('judge.findTeamFor', { category: category ? t(`categories.${category.id}`) : '' })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <svg
                className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="ps-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Team List */}
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {filteredTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team);
                    setSearchQuery('');
                    setPoints('');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-colors text-start"
                >
                  {/* Rank avatar */}
                  <div className="relative flex-shrink-0">
                    {team.rank <= 3 && (
                      <div className="absolute -inset-0.5 bg-[#3b82f6] rounded-xl blur-sm opacity-50" />
                    )}
                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border ${
                      team.rank === 1
                        ? 'bg-gradient-to-br from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] border-[#3b82f6]/60 shadow-lg shadow-[#3b82f6]/40'
                        : team.rank <= 3
                        ? 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/40'
                        : 'bg-white/[0.04] text-white/50 border-white/10'
                    }`}>
                      #{team.rank}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{team.teamName}</p>
                    {team.projectName && (
                      <p className="text-xs text-white/40 truncate">{team.projectName}</p>
                    )}
                  </div>

                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: category?.color }}>
                      {team.scores[category?.id] || 0}
                    </p>
                    <p className="text-[10px] text-white/30">{category ? t(`categories.${category.id}`) : ''}</p>
                  </div>
                </button>
              ))}

              {filteredTeams.length === 0 && (
                <p className="text-sm text-white/40 text-center py-4">{t('leaderboard.noTeams')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Scan Section */}
      {!selectedTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${category?.color}20` }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: category?.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle>{t('judge.scanQr')}</CardTitle>
                <CardDescription>
                  {t('judge.scanQrDesc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              id="qr-reader"
              ref={scannerRef}
              className="rounded-xl overflow-hidden"
              style={{ display: scanning ? 'block' : 'none' }}
            />

            {!scanning && (
              <div className="rounded-xl p-8 text-center bg-white/[0.02] border border-dashed border-white/10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${category?.color}20` }}
                >
                  <svg
                    className="w-7 h-7"
                    style={{ color: category?.color }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-white/40 mb-4 text-sm">{t('judge.useCamera')}</p>
                <Button onClick={startScanning} glow>
                  {t('judge.startCamera')}
                </Button>
              </div>
            )}

            {scanning && (
              <div className="text-center">
                <Button onClick={stopScanning} variant="outline">
                  {t('judge.stopCamera')}
                </Button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
