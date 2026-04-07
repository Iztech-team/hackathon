import { createContext, useContext, useState, useEffect } from 'react';
import { config } from '../lib/config';
import { api } from '../lib/api';
import { ADMIN_CREDENTIALS } from '../data/mockJudges';

const AuthContext = createContext();

export const USER_ROLES = {
  GUEST: 'guest',
  PARTICIPANT: 'participant',
  JUDGE: 'judge',
  ADMIN: 'admin',
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const saved = localStorage.getItem('hackathon-auth');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      isAuthenticated: false,
      user: null,
      role: USER_ROLES.GUEST,
    };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('hackathon-auth', JSON.stringify(authState));
  }, [authState]);

  // On mount, verify token if using API mode
  useEffect(() => {
    if (!config.useMockData && api.getToken() && !authState.isAuthenticated) {
      verifyToken();
    }
  }, []);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const data = await api.getMe();

      if (data.role === 'team' && data.team) {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'participant',
            teamId: data.team.id,
            teamName: data.team.team_name,
            team: data.team,
          },
          role: USER_ROLES.PARTICIPANT,
        });
      } else if (data.role === 'judge' && data.judge) {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'judge',
            id: data.judge.id,
            userId: data.id,
            name: data.judge.name,
            categoryId: data.judge.category_id,
            avatarSeed: data.judge.avatar_seed,
          },
          role: USER_ROLES.JUDGE,
        });
      } else if (data.role === 'admin') {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'admin',
            id: data.id,
            name: data.username,
          },
          role: USER_ROLES.ADMIN,
        });
      }
    } catch (error) {
      // Token invalid, clear it
      api.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        role: USER_ROLES.GUEST,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock mode: login with team object
  const loginAsTeam = (team) => {
    setAuthState({
      isAuthenticated: true,
      user: {
        type: 'participant',
        teamId: team.id,
        teamName: team.teamName || team.team_name,
        team: team,
      },
      role: USER_ROLES.PARTICIPANT,
    });
    return true;
  };

  // API mode: login with credentials
  const loginAsTeamWithCredentials = async (teamName, password) => {
    if (config.useMockData) {
      // This is handled by getTeamByCredentials in Login.jsx
      return false;
    }

    try {
      setLoading(true);
      await api.login(teamName, password);
      const data = await api.getMe();

      if (data.role === 'team' && data.team) {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'participant',
            teamId: data.team.id,
            teamName: data.team.team_name,
            team: data.team,
          },
          role: USER_ROLES.PARTICIPANT,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginAsJudge = (judge) => {
    setAuthState({
      isAuthenticated: true,
      user: {
        type: 'judge',
        id: judge.id,
        name: judge.name,
        categoryId: judge.categoryId || judge.category_id,
        avatarSeed: judge.avatarSeed || judge.avatar_seed,
      },
      role: USER_ROLES.JUDGE,
    });
    return true;
  };

  // API mode: login judge with credentials
  const loginAsJudgeWithCredentials = async (username, password) => {
    if (config.useMockData) {
      return false;
    }

    try {
      setLoading(true);
      await api.login(username, password);
      const data = await api.getMe();

      if (data.role === 'judge' && data.judge) {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'judge',
            id: data.judge.id,
            userId: data.id,
            name: data.judge.name,
            categoryId: data.judge.category_id,
            avatarSeed: data.judge.avatar_seed,
          },
          role: USER_ROLES.JUDGE,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Judge login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginAsAdmin = async (password) => {
    if (config.useMockData) {
      if (password === ADMIN_CREDENTIALS.password) {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'admin',
            id: 'admin-001',
            name: 'Admin',
          },
          role: USER_ROLES.ADMIN,
        });
        return true;
      }
      return false;
    }

    // API mode
    try {
      setLoading(true);
      await api.login('admin', password);
      const data = await api.getMe();

      if (data.role === 'admin') {
        setAuthState({
          isAuthenticated: true,
          user: {
            type: 'admin',
            id: data.id,
            name: data.username,
          },
          role: USER_ROLES.ADMIN,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: USER_ROLES.GUEST,
    });
  };

  const updateUser = (updatedUser) => {
    setAuthState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        ...updatedUser,
      },
    }));
  };

  const refreshUserData = async () => {
    if (!config.useMockData && api.getToken()) {
      await verifyToken();
    }
  };

  const isGuest = () => authState.role === USER_ROLES.GUEST;
  const isParticipant = () => authState.role === USER_ROLES.PARTICIPANT;
  const isJudge = () => authState.role === USER_ROLES.JUDGE;
  const isAdmin = () => authState.role === USER_ROLES.ADMIN;

  const getCurrentTeamId = () => {
    if (authState.role === USER_ROLES.PARTICIPANT && authState.user) {
      return authState.user.teamId;
    }
    return null;
  };

  const getCurrentJudge = () => {
    if (authState.role === USER_ROLES.JUDGE && authState.user) {
      return authState.user;
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        loading,
        loginAsTeam,
        loginAsTeamWithCredentials,
        loginAsJudge,
        loginAsJudgeWithCredentials,
        loginAsAdmin,
        logout,
        updateUser,
        refreshUserData,
        isGuest,
        isParticipant,
        isJudge,
        isAdmin,
        getCurrentTeamId,
        getCurrentJudge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
