import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useJudges } from '../context/JudgeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar, AvatarPicker } from '../components/ui/Avatar';
import { CategoryBadge } from '../components/ui/Badge';
import { getCategoryById } from '../data/categories';

export default function JudgeProfile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { updateJudge } = useJudges();

  const category = getCategoryById(user?.categoryId);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    avatarSeed: user?.avatarSeed || '',
  });
  const [message, setMessage] = useState('');

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-white/50">Judge not found</p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditForm({
      name: user.name,
      avatarSeed: user.avatarSeed,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Update judge in context
    updateJudge(user.id, {
      name: editForm.name,
      avatarSeed: editForm.avatarSeed,
    });

    // Update user in auth context
    if (updateUser) {
      updateUser({
        ...user,
        name: editForm.name,
        avatarSeed: editForm.avatarSeed,
      });
    }

    setIsEditing(false);
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: user.name,
      avatarSeed: user.avatarSeed,
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Success Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-[#2b58f7]/10 border border-[#2b58f7]/20"
        >
          <p className="text-[#2b58f7] text-sm font-medium">{message}</p>
        </motion.div>
      )}

      {/* Profile Card */}
      <Card>
        <CardContent className="py-10">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center">
                <AvatarPicker
                  value={editForm.avatarSeed}
                  onChange={(seed) => setEditForm({ ...editForm, avatarSeed: seed })}
                />
                <p className="text-xs text-white/40 mt-2">Click to change avatar</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                    Name
                  </label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">
                    Category
                  </label>
                  <div className="flex justify-center">
                    {category && <CategoryBadge category={category} size="lg" />}
                  </div>
                  <p className="text-xs text-white/30 text-center mt-2">
                    Category cannot be changed. Contact admin.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCancel} variant="ghost" className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  {t('common.saveChanges')}
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <Avatar seed={user.avatarSeed} size="xl" className="mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-white/40 mb-4">{t('nav.judge')}</p>
              {category && (
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    {t('judge.judgingCategory')}
                  </p>
                  <CategoryBadge category={category} size="lg" />
                </div>
              )}
              <Button onClick={handleStartEdit} variant="outline" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {t('common.edit')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action */}
      {!isEditing && (
        <Button onClick={() => navigate('/scan')} glow className="w-full gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {t('judge.awardPoints')}
        </Button>
      )}
    </div>
  );
}
