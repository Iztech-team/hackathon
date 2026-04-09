import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';
import { useJudges } from '../context/JudgeContext';
import { useHackathonState } from '../hooks/useHackathonState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { FormField, FormLabel, FormMessage } from '../components/ui/FormField';
import { Avatar, AvatarPicker, TeamLogo } from '../components/ui/Avatar';
import { CategoryBadge } from '../components/ui/Badge';
import { getCategoryById } from '../data/categories';
import { config } from '../lib/config';
import { mockTeams } from '../data/mockTeams';
import { mockJudges, ADMIN_CREDENTIALS } from '../data/mockJudges';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { loginAsTeam, loginAsTeamWithCredentials, loginAsJudge, loginAsJudgeWithCredentials, loginAsAdmin, isAuthenticated, role } = useAuth();
  const justSubmittedRef = useRef(false);
  const { getTeamByCredentials, getTeamById, registerTeam } = useTeams();
  const { getJudgeByCredentials, getJudgeById } = useJudges();
  const { registrationOpen } = useHackathonState();

  // Main tabs: login vs register
  const [mainTab, setMainTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');

  // If admin closes registration while the user is on that tab, bump them back to login.
  useEffect(() => {
    if (!registrationOpen && mainTab === 'register') setMainTab('login');
  }, [registrationOpen, mainTab]);

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setMainTab('register');
    }
  }, [searchParams]);

  // Login sub-tabs
  const [loginTab, setLoginTab] = useState('team');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Team login form
  const [teamLoginForm, setTeamLoginForm] = useState({ teamName: '', password: '' });

  // Judge login form
  const [judgeLoginForm, setJudgeLoginForm] = useState({ name: '', password: '' });

  // Admin login form
  const [adminLoginForm, setAdminLoginForm] = useState({ password: '' });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    teamName: '',
    projectName: '',
    description: '',
    password: '',
    confirmPassword: '',
    logoSeed: 'team-logo-' + Date.now(),
  });
  const MIN_MEMBERS = 2;
  const MAX_MEMBERS = 4;
  const [members, setMembers] = useState([
    { id: 1, name: '', phone: '', avatarSeed: 'member-1' },
    { id: 2, name: '', phone: '', avatarSeed: 'member-2' },
  ]);
  const [registerErrors, setRegisterErrors] = useState({});

  // Redirect already-authenticated visitors to their landing page (role-aware).
  // Skip if we just submitted a login form — those handlers do their own navigation.
  useEffect(() => {
    if (!isAuthenticated || justSubmittedRef.current) return;
    if (role === 'admin') navigate('/admin', { replace: true });
    else if (role === 'judge') navigate('/scan', { replace: true });
    else if (role === 'participant') navigate('/team', { replace: true });
    else navigate('/', { replace: true });
  }, [isAuthenticated, role, navigate]);

  // Quick login handlers — work in both mock and API mode.
  // In API mode they hit the backend with a fixed mock password convention.
  const handleQuickTeamLogin = async (team) => {
    if (config.useMockData) {
      const foundTeam = getTeamById(team.id) || team;
      loginAsTeam(foundTeam);
      navigate('/team');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const password = team.password || team.teamName.toLowerCase().replace(/\s/g, '');
      const ok = await loginAsTeamWithCredentials(team.teamName, password);
      if (ok) navigate('/team');
      else setError(t('login.errors.invalidTeam'));
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickJudgeLogin = async (judge) => {
    if (config.useMockData) {
      const foundJudge = getJudgeById(judge.id) || judge;
      loginAsJudge(foundJudge);
      navigate('/scan');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const username = judge.username || judge.name.toLowerCase().replace(/\s/g, '_');
      const password = judge.password || 'judge1234';
      const ok = await loginAsJudgeWithCredentials(username, password);
      if (ok) navigate('/scan');
      else setError(t('login.errors.invalidJudge'));
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await loginAsAdmin(config.useMockData ? ADMIN_CREDENTIALS.password : 'admin2026');
      if (ok) navigate('/admin');
      else setError(t('login.errors.invalidAdmin'));
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Login handlers
  const handleTeamLogin = async (e) => {
    e.preventDefault();
    justSubmittedRef.current = true;
    setError('');
    setLoading(true);

    try {
      if (config.useMockData) {
        const team = getTeamByCredentials(teamLoginForm.teamName, teamLoginForm.password);
        if (team) {
          loginAsTeam(team);
          navigate('/team');
        } else {
          setError(t('login.errors.invalidTeam'));
        }
      } else {
        const success = await loginAsTeamWithCredentials(teamLoginForm.teamName, teamLoginForm.password);
        if (success) {
          navigate('/team');
        } else {
          setError(t('login.errors.invalidTeam'));
        }
      }
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleJudgeLogin = async (e) => {
    e.preventDefault();
    justSubmittedRef.current = true;
    setError('');
    setLoading(true);

    try {
      if (config.useMockData) {
        const judge = getJudgeByCredentials(judgeLoginForm.name, judgeLoginForm.password);
        if (judge) {
          loginAsJudge(judge);
          navigate('/scan');
        } else {
          setError(t('login.errors.invalidJudge'));
        }
      } else {
        const success = await loginAsJudgeWithCredentials(judgeLoginForm.name, judgeLoginForm.password);
        if (success) {
          navigate('/scan');
        } else {
          setError(t('login.errors.invalidJudge'));
        }
      }
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    justSubmittedRef.current = true;
    setError('');
    setLoading(true);

    try {
      const success = await loginAsAdmin(adminLoginForm.password);
      if (success) {
        navigate('/admin');
      } else {
        setError(t('login.errors.invalidAdmin'));
      }
    } catch (err) {
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Register handlers
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleMemberChange = (id, field, value) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    const newId = Math.max(...members.map((m) => m.id)) + 1;
    setMembers((prev) => [...prev, { id: newId, name: '', phone: '', avatarSeed: `member-${newId}` }]);
  };

  const removeMember = (id) => {
    if (members.length > MIN_MEMBERS) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const validateRegister = () => {
    const newErrors = {};
    const trimmedName = registerForm.teamName.trim();
    if (!trimmedName) {
      newErrors.teamName = t('login.errors.teamNameRequired');
    } else if (/\s/.test(trimmedName)) {
      // Team name doubles as the login username, so spaces aren't allowed.
      newErrors.teamName = t('login.errors.teamNameNoSpaces');
    }
    if (!registerForm.password) newErrors.password = t('login.errors.passwordRequired');
    else if (registerForm.password.length < 6) newErrors.password = t('login.errors.passwordTooShort');
    if (registerForm.password !== registerForm.confirmPassword) newErrors.confirmPassword = t('login.errors.passwordsNoMatch');

    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length < MIN_MEMBERS) newErrors.members = t('login.errors.memberMinTwo');
    else if (validMembers.length > MAX_MEMBERS) newErrors.members = t('login.errors.memberMaxFour');
    else {
      const membersWithoutPhone = validMembers.filter((m) => !m.phone.trim());
      if (membersWithoutPhone.length > 0) newErrors.members = t('login.errors.memberPhoneRequired');
    }

    return newErrors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = validateRegister();

    if (Object.keys(newErrors).length > 0) {
      setRegisterErrors(newErrors);
      return;
    }

    justSubmittedRef.current = true;
    setLoading(true);
    setError('');

    try {
      const validMembers = members.filter((m) => m.name.trim() && m.phone.trim()).map(m => ({
        ...m,
        avatarSeed: m.avatarSeed || m.name.toLowerCase().replace(/\s/g, '-'),
      }));

      const result = await registerTeam({
        teamName: registerForm.teamName,
        projectName: registerForm.projectName,
        description: registerForm.description,
        password: registerForm.password,
        logoSeed: registerForm.logoSeed,
        members: validMembers,
      });

      if (config.useMockData) {
        // Mock mode: log the team in with the mock object that has the real id.
        loginAsTeam(result);
        navigate('/team');
      } else {
        // API mode: registerTeam already stored the JWT. Hit /auth/me to populate
        // the auth state with the real team payload, then navigate to /team.
        const success = await loginAsTeamWithCredentials(registerForm.teamName, registerForm.password);
        if (success) {
          navigate('/team');
        } else {
          setError(t('login.errors.loginFailed'));
        }
      }
    } catch (err) {
      setError(err.message || t('login.errors.regFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loginTabs = [
    { id: 'team', label: t('login.teamTab') },
    { id: 'judge', label: t('login.judgeTab') },
    { id: 'admin', label: t('login.adminTab') },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('login.welcome')}</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Tabs: Login / Register */}
          <div className="flex rounded-xl bg-white/[0.03] p-1">
            {['login', 'register'].map((tab) => {
              const isDisabled = tab === 'register' && !registrationOpen;
              return (
                <button
                  key={tab}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setMainTab(tab);
                    setError('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    mainTab === tab
                      ? 'bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] text-[#ffffff] shadow-lg shadow-[#3b82f6]/30'
                      : isDisabled
                      ? 'text-white/25 cursor-not-allowed'
                      : 'text-white/50 hover:text-white'
                  }`}
                  title={isDisabled ? t('login.registrationClosed') : undefined}
                >
                  {tab === 'login'
                    ? t('login.loginTab')
                    : isDisabled
                      ? `${t('login.registerTab')} · ${t('login.closed')}`
                      : t('login.registerTab')}
                </button>
              );
            })}
          </div>

          {!registrationOpen && mainTab === 'login' && (
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-300">{t('login.registrationClosedBanner')}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mainTab === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Login Sub-tabs */}
                <div className="flex gap-2">
                  {loginTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setLoginTab(tab.id);
                        setError('');
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        loginTab === tab.id
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Login Forms */}
                <AnimatePresence mode="wait">
                  {loginTab === 'team' && (
                    <motion.form
                      key="team-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleTeamLogin}
                      className="space-y-4"
                    >
                      <FormField>
                        <FormLabel>{t('login.teamName')}</FormLabel>
                        <Input
                          value={teamLoginForm.teamName}
                          onChange={(e) => setTeamLoginForm({ ...teamLoginForm, teamName: e.target.value })}
                          placeholder={t('login.teamNamePlaceholder')}
                          required
                        />
                      </FormField>
                      <FormField>
                        <FormLabel>{t('common.password')}</FormLabel>
                        <Input
                          type="password"
                          value={teamLoginForm.password}
                          onChange={(e) => setTeamLoginForm({ ...teamLoginForm, password: e.target.value })}
                          placeholder={t('login.teamPasswordPlaceholder')}
                          required
                        />
                      </FormField>
                      <Button type="submit" className="w-full" glow disabled={loading}>
                        {loading ? t('login.loggingIn') : t('login.loginBtn')}
                      </Button>
                    </motion.form>
                  )}

                  {loginTab === 'judge' && (
                    <motion.form
                      key="judge-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleJudgeLogin}
                      className="space-y-4"
                    >
                      <FormField>
                        <FormLabel>{t('common.username')}</FormLabel>
                        <Input
                          value={judgeLoginForm.name}
                          onChange={(e) => setJudgeLoginForm({ ...judgeLoginForm, name: e.target.value })}
                          placeholder={t('login.judgeUsernamePlaceholder')}
                          required
                        />
                      </FormField>
                      <FormField>
                        <FormLabel>{t('common.password')}</FormLabel>
                        <Input
                          type="password"
                          value={judgeLoginForm.password}
                          onChange={(e) => setJudgeLoginForm({ ...judgeLoginForm, password: e.target.value })}
                          placeholder={t('login.judgePasswordPlaceholder')}
                          required
                        />
                      </FormField>
                      <Button type="submit" className="w-full" glow disabled={loading}>
                        {loading ? t('login.loggingIn') : t('login.loginBtn')}
                      </Button>
                    </motion.form>
                  )}

                  {loginTab === 'admin' && (
                    <motion.form
                      key="admin-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleAdminLogin}
                      className="space-y-4"
                    >
                      <FormField>
                        <FormLabel>{t('login.adminPassword')}</FormLabel>
                        <Input
                          type="password"
                          value={adminLoginForm.password}
                          onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                          placeholder={t('login.adminPasswordPlaceholder')}
                          required
                        />
                      </FormField>
                      <Button type="submit" className="w-full" glow disabled={loading}>
                        {loading ? t('login.loggingIn') : t('login.loginAsAdmin')}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {mainTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl p-3 mb-4 bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                  <FormField>
                    <FormLabel required>{t('login.teamName')}</FormLabel>
                    <Input
                      name="teamName"
                      value={registerForm.teamName}
                      onChange={handleRegisterChange}
                      placeholder={t('login.teamNamePlaceholder')}
                    />
                    {registerErrors.teamName && <FormMessage>{registerErrors.teamName}</FormMessage>}
                  </FormField>

                  <FormField>
                    <FormLabel required>{t('common.password')}</FormLabel>
                    <Input
                      name="password"
                      type="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder={t('login.passwordPlaceholder')}
                    />
                    {registerErrors.password && <FormMessage>{registerErrors.password}</FormMessage>}
                  </FormField>
                  <FormField>
                    <FormLabel required>{t('common.confirmPassword')}</FormLabel>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder={t('login.confirmPasswordPlaceholder')}
                    />
                    {registerErrors.confirmPassword && <FormMessage>{registerErrors.confirmPassword}</FormMessage>}
                  </FormField>

                  {/* Team Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FormLabel required>{t('login.teamMembers')}</FormLabel>
                      {members.length < MAX_MEMBERS && (
                        <button
                          type="button"
                          onClick={addMember}
                          className="text-xs text-[#2b58f7] hover:text-[#4169f8]"
                        >
                          {t('login.addMember')}
                        </button>
                      )}
                    </div>

                    {members.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex gap-2 items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                      >
                        <AvatarPicker
                          value={member.avatarSeed}
                          onChange={(seed) => handleMemberChange(member.id, 'avatarSeed', seed)}
                        />
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={member.name}
                            onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                            placeholder={t('login.namePlaceholder')}
                            className="flex-1"
                          />
                          <Input
                            value={member.phone}
                            onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)}
                            placeholder={t('login.phonePlaceholder')}
                            className="flex-1"
                          />
                        </div>
                        {members.length > MIN_MEMBERS && (
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="p-2 text-white/30 hover:text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {registerErrors.members && <FormMessage>{registerErrors.members}</FormMessage>}
                  </div>

                  <Button type="submit" className="w-full gap-2" glow disabled={loading}>
                    <span>{loading ? t('login.registering') : t('login.registerTeamBtn')}</span>
                    {!loading && (
                      <motion.svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{
                          y: [0, -3, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      </motion.svg>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
