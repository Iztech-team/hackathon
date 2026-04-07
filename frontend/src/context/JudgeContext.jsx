import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { config } from '../lib/config';
import { api } from '../lib/api';
import { mockJudges } from '../data/mockJudges';

const JudgeContext = createContext();

export function useJudges() {
  const context = useContext(JudgeContext);
  if (!context) {
    throw new Error('useJudges must be used within a JudgeProvider');
  }
  return context;
}

// Normalize API judge data to match frontend expected format
const normalizeJudge = (judge) => ({
  id: judge.id,
  userId: judge.user_id,
  name: judge.name,
  categoryId: judge.category_id,
  avatarSeed: judge.avatar_seed,
});

export function JudgeProvider({ children }) {
  const [judges, setJudges] = useState(() => {
    if (config.useMockData) {
      const saved = localStorage.getItem('hackathon-judges');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          // Invalid JSON, use mock data
        }
      }
      return mockJudges;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save to localStorage only in mock mode
  useEffect(() => {
    if (config.useMockData) {
      localStorage.setItem('hackathon-judges', JSON.stringify(judges));
    }
  }, [judges]);

  // Fetch judges from API on mount (API mode) - only if authenticated as admin
  const fetchJudges = useCallback(async () => {
    if (config.useMockData) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getJudges();
      setJudges(data.map(normalizeJudge));
    } catch (err) {
      // Not authorized or other error - fail silently for non-admins
      if (err.message !== 'Admin access required') {
        setError(err.message);
      }
      console.error('Failed to fetch judges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJudge = async (judgeData) => {
    if (config.useMockData) {
      const newJudge = {
        id: `judge-${Date.now()}`,
        ...judgeData,
        avatarSeed: `${judgeData.name.toLowerCase().replace(/\s/g, '-')}-judge-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setJudges(prev => [...prev, newJudge]);
      return newJudge;
    }

    // API mode
    try {
      setLoading(true);
      const judge = await api.createJudge({
        name: judgeData.name,
        username: judgeData.username || judgeData.name.toLowerCase().replace(/\s/g, '_'),
        password: judgeData.password,
        category_id: judgeData.categoryId,
        avatar_seed: judgeData.avatarSeed,
      });
      await fetchJudges();
      return normalizeJudge(judge);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJudge = async (judgeId, updates) => {
    if (config.useMockData) {
      setJudges(prev =>
        prev.map(judge =>
          judge.id === judgeId ? { ...judge, ...updates } : judge
        )
      );
      return;
    }

    try {
      await api.updateJudge(judgeId, {
        name: updates.name,
        avatar_seed: updates.avatarSeed,
      });
      await fetchJudges();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteJudge = async (judgeId) => {
    if (config.useMockData) {
      setJudges(prev => prev.filter(judge => judge.id !== judgeId));
      return;
    }

    try {
      await api.deleteJudge(judgeId);
      await fetchJudges();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getJudgeById = (judgeId) => {
    return judges.find(judge => judge.id === judgeId);
  };

  const getJudgeByCredentials = (name, password) => {
    if (!config.useMockData) {
      // In API mode, authentication is handled by AuthContext
      return null;
    }
    return judges.find(
      judge =>
        judge.name.toLowerCase() === name.toLowerCase() &&
        judge.password === password
    );
  };

  const getJudgesByCategory = (categoryId) => {
    return judges.filter(judge => judge.categoryId === categoryId);
  };

  const resetToMockData = () => {
    localStorage.removeItem('hackathon-judges');
    setJudges(mockJudges);
  };

  return (
    <JudgeContext.Provider
      value={{
        judges,
        loading,
        error,
        createJudge,
        updateJudge,
        deleteJudge,
        getJudgeById,
        getJudgeByCredentials,
        getJudgesByCategory,
        resetToMockData,
        fetchJudges,
      }}
    >
      {children}
    </JudgeContext.Provider>
  );
}
