import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { config } from '../lib/config';
import { api } from '../lib/api';
import { mockTeams } from '../data/mockTeams';
import { getInitialScores, calculateTotalScore } from '../data/categories';

const TeamContext = createContext();

export function useTeams() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
}

// Migrate old team format (single score) to new format (category scores)
const migrateTeamData = (teams) => {
  return teams.map(team => {
    if (team.scores && typeof team.scores === 'object') {
      return team;
    }
    const oldScore = team.score || 0;
    return {
      ...team,
      password: team.password || team.teamName.toLowerCase().replace(/\s/g, ''),
      scores: {
        ui_ux: 0,
        frontend: 0,
        backend: 0,
        innovation: Math.floor(oldScore / 2),
        presentation: Math.ceil(oldScore / 2),
      },
      members: (team.members || []).map((member, idx) => ({
        ...member,
        avatarSeed: member.avatarSeed || `${member.name.toLowerCase().replace(/\s/g, '-')}-${idx + 1}`,
      })),
    };
  });
};

// Normalize API team data to match frontend expected format
const normalizeTeam = (team) => ({
  id: team.id,
  teamName: team.team_name,
  projectName: team.project_name,
  description: team.description,
  logoSeed: team.logo_seed,
  createdAt: team.created_at,
  members: (team.members || []).map(m => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email || '',
    avatarSeed: m.avatar_seed,
  })),
  scores: team.scores || {},
  totalScore: team.total_score || 0,
  arrived: !!team.arrived,
  arrivedAt: team.arrived_at || null,
  handRaised: !!team.hand_raised,
  handRaisedAt: team.hand_raised_at || null,
  handRaisedNote: team.hand_raised_note || null,
});

export function TeamProvider({ children }) {
  const [teams, setTeams] = useState(() => {
    if (config.useMockData) {
      const saved = localStorage.getItem('hackathon-teams');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return migrateTeamData(parsed);
          }
        } catch (e) {
          // Invalid JSON, use mock data
        }
      }
      return mockTeams;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save to localStorage only in mock mode
  useEffect(() => {
    if (config.useMockData) {
      localStorage.setItem('hackathon-teams', JSON.stringify(teams));
    }
  }, [teams]);

  // Fetch teams from API on mount (API mode)
  useEffect(() => {
    if (!config.useMockData) {
      fetchTeams();
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    if (config.useMockData) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getTeams();
      setTeams(data.map(normalizeTeam));
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerTeam = async (teamData) => {
    if (config.useMockData) {
      const newTeam = {
        id: `team-${Date.now()}`,
        ...teamData,
        members: teamData.members.map((member, idx) => ({
          ...member,
          avatarSeed: `${member.name.toLowerCase().replace(/\s/g, '-')}-${idx + 1}-${Date.now()}`,
        })),
        scores: getInitialScores(),
        createdAt: new Date().toISOString(),
      };
      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    }

    // API mode
    try {
      setLoading(true);
      const response = await api.registerTeam({
        team_name: teamData.teamName,
        project_name: teamData.projectName,
        description: teamData.description,
        password: teamData.password,
        logo_seed: teamData.logoSeed,
        members: teamData.members.map(m => ({
          name: m.name,
          phone: m.phone,
          email: m.email || '',
          avatar_seed: m.avatarSeed,
        })),
      });

      // Refresh teams list
      await fetchTeams();

      // Return the token for login
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Updated to accept categoryId - in API mode this is a PUT (upsert)
  const addPoints = async (teamId, categoryId, points) => {
    if (config.useMockData) {
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId
            ? {
                ...team,
                scores: {
                  ...team.scores,
                  [categoryId]: (team.scores[categoryId] || 0) + points,
                },
              }
            : team
        )
      );
      return;
    }

    // API mode - this is an upsert (PUT), not increment
    try {
      await api.setScore(teamId, categoryId, points);
      await fetchTeams(); // Refresh data
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Set score directly (PUT/upsert) - used in API mode
  const setScore = async (teamId, categoryId, points) => {
    if (config.useMockData) {
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId
            ? {
                ...team,
                scores: {
                  ...team.scores,
                  [categoryId]: points,
                },
              }
            : team
        )
      );
      return;
    }

    try {
      await api.setScore(teamId, categoryId, points);
      await fetchTeams();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getTeamById = (teamId) => {
    return teams.find(team => team.id === teamId);
  };

  const getTeamByIdAsync = async (teamId) => {
    if (config.useMockData) {
      return teams.find(team => team.id === teamId);
    }

    try {
      const data = await api.getTeam(teamId);
      return normalizeTeam(data);
    } catch (err) {
      console.error('Failed to get team:', err);
      return null;
    }
  };

  const getTeamByCredentials = (teamName, password) => {
    if (!config.useMockData) {
      // In API mode, authentication is handled by AuthContext
      return null;
    }
    return teams.find(
      team =>
        team.teamName.toLowerCase() === teamName.toLowerCase() &&
        team.password === password
    );
  };

  const getSortedTeams = () => {
    return [...teams]
      .map(team => ({
        ...team,
        totalScore: team.totalScore || calculateTotalScore(team.scores),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  };

  const getLeaderboard = async (category = null) => {
    if (config.useMockData) {
      return getSortedTeams();
    }

    try {
      const data = await api.getLeaderboard(category);
      return data.map(normalizeTeam);
    } catch (err) {
      console.error('Failed to get leaderboard:', err);
      return getSortedTeams();
    }
  };

  const updateTeam = async (teamId, updates) => {
    if (config.useMockData) {
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId ? { ...team, ...updates } : team
        )
      );
      return;
    }

    try {
      await api.updateTeam(teamId, {
        project_name: updates.projectName,
        description: updates.description,
        logo_seed: updates.logoSeed,
      });
      await fetchTeams();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTeamMember = async (teamId, memberId, updates) => {
    if (config.useMockData) {
      setTeams(prev =>
        prev.map(team => {
          if (team.id !== teamId) return team;
          return {
            ...team,
            members: team.members.map(m =>
              m.id === memberId ? { ...m, ...updates } : m
            ),
          };
        })
      );
      return;
    }

    try {
      await api.updateTeamMember(teamId, memberId, {
        name: updates.name,
        phone: updates.phone,
        email: updates.email || '',
        avatar_seed: updates.avatarSeed,
      });
      await fetchTeams();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addTeamMember = async (teamId, memberData) => {
    if (config.useMockData) {
      const newMember = {
        id: `member-${Date.now()}`,
        ...memberData,
        avatarSeed: memberData.avatarSeed || `${memberData.name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
      };
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId
            ? { ...team, members: [...team.members, newMember] }
            : team
        )
      );
      return newMember;
    }

    try {
      const member = await api.addTeamMember(teamId, {
        name: memberData.name,
        phone: memberData.phone,
        email: memberData.email || '',
        avatar_seed: memberData.avatarSeed,
      });
      await fetchTeams();
      return member;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTeamMember = async (teamId, memberId) => {
    if (config.useMockData) {
      setTeams(prev =>
        prev.map(team =>
          team.id === teamId
            ? { ...team, members: team.members.filter(m => m.id !== memberId) }
            : team
        )
      );
      return;
    }

    try {
      await api.deleteTeamMember(teamId, memberId);
      await fetchTeams();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTeam = async (teamId) => {
    if (config.useMockData) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      return;
    }

    try {
      await api.deleteTeam(teamId);
      await fetchTeams();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetToMockData = () => {
    localStorage.removeItem('hackathon-teams');
    setTeams(mockTeams);
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        loading,
        error,
        registerTeam,
        addPoints,
        setScore,
        getTeamById,
        getTeamByIdAsync,
        getTeamByCredentials,
        getSortedTeams,
        getLeaderboard,
        updateTeam,
        updateTeamMember,
        addTeamMember,
        deleteTeamMember,
        deleteTeam,
        resetToMockData,
        fetchTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}
