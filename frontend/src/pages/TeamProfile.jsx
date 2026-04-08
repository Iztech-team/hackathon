import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Avatar, AvatarPicker } from '../components/ui/Avatar';
import { Badge, CategoryBadge } from '../components/ui/Badge';
import { CATEGORY_LIST, calculateTotalScore } from '../data/categories';

export default function TeamProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, refreshUserData } = useAuth();
  const { getTeamById, getSortedTeams, updateTeam, addTeamMember } = useTeams();

  // Poll the backend so API key reveal state updates within ~15s of admin action
  useEffect(() => {
    if (!refreshUserData) return;
    const id = setInterval(() => { refreshUserData(); }, 15000);
    return () => clearInterval(id);
  }, [refreshUserData]);

  // API key state is on user.team (from /auth/me response)
  const authTeam = user?.team || {};
  const apiKey = authTeam.api_key || null;
  const apiKeyAssigned = !!authTeam.api_key_assigned;
  const apiKeysRevealed = !!authTeam.api_keys_revealed;

  const [copied, setCopied] = useState(false);
  const handleCopyApiKey = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const [refreshingKey, setRefreshingKey] = useState(false);
  const handleRefreshKey = async () => {
    if (!refreshUserData || refreshingKey) return;
    setRefreshingKey(true);
    try {
      await refreshUserData();
    } finally {
      // Keep the spin animation visible for at least ~400ms so it feels responsive
      setTimeout(() => setRefreshingKey(false), 400);
    }
  };

  const team = getTeamById(user?.teamId);
  const sortedTeams = getSortedTeams();
  const rank = sortedTeams.findIndex((t) => t.id === team?.id) + 1;
  const totalScore = team ? calculateTotalScore(team.scores) : 0;

  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', avatarSeed: '' });
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ projectName: '', description: '' });
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ name: '', phone: '', avatarSeed: `member-${Date.now()}` });

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-white/50">{t('team.notFound')}</p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              {t('team.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxCategoryScore = Math.max(...Object.values(team.scores), 1);

  const handleEditMember = (member, idx) => {
    setEditingMember(idx);
    setEditForm({
      name: member.name,
      phone: member.phone,
      avatarSeed: member.avatarSeed,
    });
  };

  const handleSaveMember = (idx) => {
    const updatedMembers = [...team.members];
    updatedMembers[idx] = {
      ...updatedMembers[idx],
      name: editForm.name,
      phone: editForm.phone,
      avatarSeed: editForm.avatarSeed,
    };
    updateTeam(team.id, { members: updatedMembers });
    setEditingMember(null);
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditForm({ name: '', phone: '', avatarSeed: '' });
  };

  const handleEditProject = () => {
    setEditingProject(true);
    setProjectForm({
      projectName: team.projectName || '',
      description: team.description || '',
    });
  };

  const handleSaveProject = () => {
    updateTeam(team.id, {
      projectName: projectForm.projectName,
      description: projectForm.description,
    });
    setEditingProject(false);
  };

  const handleCancelProjectEdit = () => {
    setEditingProject(false);
    setProjectForm({ projectName: '', description: '' });
  };

  const handleAddMember = async () => {
    if (!newMemberForm.name.trim() || !newMemberForm.phone.trim()) return;

    await addTeamMember(team.id, {
      name: newMemberForm.name,
      phone: newMemberForm.phone,
      avatarSeed: newMemberForm.avatarSeed,
    });

    setAddingMember(false);
    setNewMemberForm({ name: '', phone: '', avatarSeed: `member-${Date.now()}` });
  };

  const handleCancelAddMember = () => {
    setAddingMember(false);
    setNewMemberForm({ name: '', phone: '', avatarSeed: `member-${Date.now()}` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d4b069]/20 via-[#a8842d]/10 to-transparent border border-white/[0.08]">
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px'}} />

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Center: Team Info */}
            <div className="flex-1 text-center md:text-left">
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-white mb-2"
              >
                {team.teamName}
              </motion.h1>
              <p className="text-lg text-[#d4b069] font-medium mb-2">{team.projectName}</p>
              {team.description && (
                <p className="text-sm text-white/50 max-w-md">{team.description}</p>
              )}

              {/* Member Avatars */}
              <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map((member, idx) => (
                    <Avatar key={idx} seed={member.avatarSeed} size="sm" className="ring-2 ring-black/50" />
                  ))}
                </div>
                <span className="text-sm text-white/40">{team.members.length} {t('team.members')}</span>
              </div>
            </div>

            {/* Right: Score & Rank */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-center px-6 py-4 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/[0.06]">
                <div className="text-5xl font-bold text-[#d4b069] mb-1">{totalScore}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{t('team.totalPoints')}</div>
              </div>
              <Badge className="text-base px-4 py-1.5">{t('common.rank')} #{rank}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('team.projectInfo')}</CardTitle>
              <CardDescription>{t('team.projectInfoDesc')}</CardDescription>
            </div>
            {!editingProject && (
              <Button variant="ghost" size="sm" onClick={handleEditProject} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t('common.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingProject ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">{t('team.projectName')}</label>
                <Input
                  value={projectForm.projectName}
                  onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })}
                  placeholder={t('team.projectNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/70">{t('team.description')}</label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder={t('team.descriptionPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={handleCancelProjectEdit} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSaveProject} className="flex-1">
                  {t('common.saveChanges')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/50 mb-1">{t('team.projectName')}</p>
                <p className="text-white font-medium">{team.projectName || <span className="text-white/30 italic">{t('team.notSet')}</span>}</p>
              </div>
              <div>
                <p className="text-sm text-white/50 mb-1">{t('team.description')}</p>
                <p className="text-white/80">{team.description || <span className="text-white/30 italic">{t('team.noDescription')}</span>}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#d4b069]/10 border border-[#d4b069]/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#d4b069]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <CardTitle>{t('team.apiKey.title')}</CardTitle>
            </div>
            <button
              type="button"
              onClick={handleRefreshKey}
              disabled={refreshingKey}
              className="p-2 rounded-xl text-white/50 hover:text-[#d4b069] hover:bg-[#d4b069]/10 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg
                className={`w-5 h-5 ${refreshingKey ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {apiKey && apiKeysRevealed ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                <code
                  dir="ltr"
                  className="flex-1 min-w-0 truncate px-4 py-3 rounded-xl bg-black/40 border border-[#d4b069]/30 text-[#e8c98a] font-mono text-sm tracking-tight select-all"
                >
                  {apiKey}
                </code>
                <Button size="sm" onClick={handleCopyApiKey} glow>
                  {copied ? t('team.apiKey.copied') : t('team.apiKey.copy')}
                </Button>
              </motion.div>
            ) : apiKeyAssigned ? (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-4 rounded-xl bg-black/30 border border-white/[0.08]"
              >
                <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-white/60">{t('team.apiKey.hidden')}</p>
              </motion.div>
            ) : (
              <motion.div
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <p className="text-sm text-white/40">{t('team.apiKey.notAssigned')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle>{t('team.scoreBreakdown')}</CardTitle>
          <CardDescription>{t('team.scoreBreakdownDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CATEGORY_LIST.map((category, index) => {
              const score = team.scores[category.id] || 0;
              const percentage = maxCategoryScore > 0 ? (score / maxCategoryScore) * 100 : 0;
              return (
                <motion.div
                  key={category.id}
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {t(`categories.${category.id}`)}
                    </span>
                    <span className="text-sm font-bold" style={{ color: category.color }}>
                      {score} {t('common.points')}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${category.color}90 0%, ${category.color} 50%, ${category.color}dd 100%)`,
                        boxShadow: `0 0 12px ${category.color}40`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{
                        delay: index * 0.1 + 0.2,
                        duration: 0.6,
                        ease: [0.25, 0.1, 0.25, 1]
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total Score Summary */}
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

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('team.teamMembers')}</CardTitle>
              <CardDescription>{t('team.teamMembersDesc')}</CardDescription>
            </div>
            {!addingMember && (
              <Button variant="ghost" size="sm" onClick={() => setAddingMember(true)} className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('common.add')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {team.members.map((member, idx) => (
              <motion.div
                key={idx}
                layout
                className={`rounded-xl border transition-all ${
                  editingMember === idx
                    ? 'bg-white/[0.05] border-[#d4b069]/30 ring-1 ring-[#d4b069]/20'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] cursor-pointer'
                }`}
                onClick={() => editingMember === null && handleEditMember(member, idx)}
              >
                {editingMember === idx ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <AvatarPicker
                        value={editForm.avatarSeed}
                        onChange={(seed) => setEditForm({ ...editForm, avatarSeed: seed })}
                      />
                      <div className="flex-1 space-y-3">
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder={t('common.name')}
                        />
                        <Input
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder={t('common.phone')}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveMember(idx);
                        }}
                        size="sm"
                        className="flex-1"
                      >
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <Avatar seed={member.avatarSeed} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{member.name}</p>
                      <p className="text-sm text-white/40">{member.phone}</p>
                    </div>
                    <svg className="w-5 h-5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Add Member Form */}
            {addingMember && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border bg-white/[0.05] border-[#d4b069]/30 ring-1 ring-[#d4b069]/20 p-4 space-y-4"
              >
                <div className="flex items-start gap-4">
                  <AvatarPicker
                    value={newMemberForm.avatarSeed}
                    onChange={(seed) => setNewMemberForm({ ...newMemberForm, avatarSeed: seed })}
                  />
                  <div className="flex-1 space-y-3">
                    <Input
                      value={newMemberForm.name}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                      placeholder="Name"
                    />
                    <Input
                      value={newMemberForm.phone}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                      placeholder="Phone"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelAddMember}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    size="sm"
                    className="flex-1"
                  >
                    {t('team.addMemberBtn')}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Action */}
      <Button onClick={() => navigate('/leaderboard')} variant="outline" className="w-full gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {t('team.viewLeaderboard')}
      </Button>
    </div>
  );
}
