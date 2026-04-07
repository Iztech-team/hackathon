import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useJudges } from '../context/JudgeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormField, FormLabel, FormMessage } from '../components/ui/FormField';
import { Avatar } from '../components/ui/Avatar';
import { CategoryBadge } from '../components/ui/Badge';
import { CATEGORY_LIST, getCategoryById } from '../data/categories';
import { config } from '../lib/config';

export default function ManageJudges() {
  const { t } = useTranslation();
  const { judges, createJudge, deleteJudge, fetchJudges, loading: judgesLoading } = useJudges();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    categoryId: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch judges on mount in API mode
  useEffect(() => {
    if (!config.useMockData) {
      fetchJudges();
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('admin.judgesPage.errors.nameRequired');
    }
    if (!formData.username.trim()) {
      newErrors.username = t('admin.judgesPage.errors.usernameRequired');
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t('admin.judgesPage.errors.usernameInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('admin.judgesPage.errors.passwordRequired');
    } else if (formData.password.length < 4) {
      newErrors.password = t('admin.judgesPage.errors.passwordTooShort');
    }
    if (!formData.categoryId) {
      newErrors.categoryId = t('admin.judgesPage.errors.categoryRequired');
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await createJudge({
        ...formData,
        username: formData.username || formData.name.toLowerCase().replace(/\s/g, '_'),
      });
      setFormData({ name: '', username: '', password: '', categoryId: '' });
      setShowForm(false);
      setMessage(t('admin.judgesPage.judgeCreated'));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setErrors({ submit: err.message || t('admin.judgesPage.errors.createFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (judgeId, judgeName) => {
    if (window.confirm(t('admin.judgesPage.confirmDelete', { name: judgeName }))) {
      setLoading(true);
      try {
        await deleteJudge(judgeId);
        setMessage(t('admin.judgesPage.judgeDeleted'));
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const categoryOptions = CATEGORY_LIST.map((cat) => ({
    value: cat.id,
    label: t(`categories.${cat.id}`),
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-semibold text-white">{t('admin.judgesPage.title')}</h1>
        <Button onClick={() => setShowForm(!showForm)} glow className="gap-2">
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{t('common.cancel')}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('admin.judgesPage.addJudge')}</span>
            </>
          )}
        </Button>
      </div>

      {/* Success Message */}
      {message && (
        <div className="rounded-xl p-4 bg-[#2b58f7]/10 border border-[#2b58f7]/20">
          <p className="text-[#2b58f7] text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Create Judge Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.judgesPage.createNewJudge')}</CardTitle>
            <CardDescription>{t('admin.judgesPage.createNewJudgeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField>
                <FormLabel required>{t('admin.judgesPage.judgeName')}</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('admin.judgesPage.judgeNamePlaceholder')}
                />
                {errors.name && <FormMessage>{errors.name}</FormMessage>}
              </FormField>

              <FormField>
                <FormLabel required>{t('admin.judgesPage.usernameLabel')}</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder={t('admin.judgesPage.usernamePlaceholder')}
                />
                {errors.username && <FormMessage>{errors.username}</FormMessage>}
              </FormField>

              <FormField>
                <FormLabel required>{t('common.password')}</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('admin.judgesPage.passwordPlaceholder')}
                />
                {errors.password && <FormMessage>{errors.password}</FormMessage>}
              </FormField>

              <FormField>
                <FormLabel required>{t('common.category')}</FormLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  options={categoryOptions}
                  placeholder={t('admin.judgesPage.categoryPlaceholder')}
                />
                {errors.categoryId && <FormMessage>{errors.categoryId}</FormMessage>}
              </FormField>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="flex-1">
                  {t('admin.judgesPage.createJudge')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Judges List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('admin.judgesPage.allJudges')}</h2>
          <span className="text-sm text-white/40">{judges.length} {t('admin.judgesPage.registered')}</span>
        </div>

        {judges.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-white/40 mb-4">{t('admin.judgesPage.noJudges')}</p>
            <Button onClick={() => setShowForm(true)} variant="ghost" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('admin.judgesPage.createFirstJudge')}</span>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {judges.map((judge) => {
              const category = getCategoryById(judge.categoryId);
              return (
                <div
                  key={judge.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar seed={judge.avatarSeed} size="lg" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-lg">{judge.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {category && <CategoryBadge category={category} size="md" />}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(judge.id, judge.name)}
                    className="p-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

          </div>
  );
}
