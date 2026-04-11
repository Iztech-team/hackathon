import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField, FormLabel, FormMessage } from '../components/ui/FormField';
import { Avatar } from '../components/ui/Avatar';

export default function ManageVolunteers() {
  const { t } = useTranslation();
  const [volunteers, setVolunteers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVolunteers = useCallback(async () => {
    try {
      const data = await api.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  }, []);

  useEffect(() => { fetchVolunteers(); }, [fetchVolunteers]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = t('common.required');
    if (!formData.username.trim()) e.username = t('common.required');
    if (!formData.password || formData.password.length < 4) e.password = t('login.errors.passwordTooShort');
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setMessage('');
    try {
      await api.createVolunteer({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
      });
      setMessage(t('admin.volunteers.created'));
      setFormData({ name: '', username: '', password: '' });
      setShowForm(false);
      await fetchVolunteers();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('admin.volunteers.confirmDelete', { name }))) return;
    try {
      await api.deleteVolunteer(id);
      await fetchVolunteers();
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('admin.volunteers.title')}</CardTitle>
              <CardDescription>{t('admin.volunteers.desc')}</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('common.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 rounded-xl p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-sm text-[#60a5fa]">
              {message}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <FormField>
                <FormLabel required>{t('common.name')}</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({}); }}
                  placeholder={t('admin.volunteers.namePlaceholder')}
                />
                {errors.name && <FormMessage>{errors.name}</FormMessage>}
              </FormField>
              <FormField>
                <FormLabel required>{t('login.username')}</FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setErrors({}); }}
                  placeholder={t('admin.volunteers.usernamePlaceholder')}
                />
                {errors.username && <FormMessage>{errors.username}</FormMessage>}
              </FormField>
              <FormField>
                <FormLabel required>{t('common.password')}</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({}); }}
                  placeholder="••••••"
                />
                {errors.password && <FormMessage>{errors.password}</FormMessage>}
              </FormField>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? '...' : t('admin.volunteers.create')}
                </Button>
              </div>
            </form>
          )}

          {volunteers.length === 0 ? (
            <p className="text-center py-8 text-white/40 text-sm">{t('admin.volunteers.empty')}</p>
          ) : (
            <div className="space-y-2">
              {volunteers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <Avatar seed={v.avatar_seed || v.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{v.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(v.id, v.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
