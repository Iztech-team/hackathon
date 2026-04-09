import { config } from './config';

const API_BASE = `${config.apiEndpoint}/api`;

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('hackathon-token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hackathon-token', token);
    } else {
      localStorage.removeItem('hackathon-token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    // Handle empty responses (204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // Auth endpoints
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async registerTeam(teamData) {
    const data = await this.request('/auth/register/team', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Teams endpoints
  async getTeams() {
    return this.request('/teams');
  }

  async getTeam(teamId) {
    return this.request(`/teams/${teamId}`);
  }

  async updateTeam(teamId, data) {
    return this.request(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(teamId) {
    return this.request(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  async getTeamMembers(teamId) {
    return this.request(`/teams/${teamId}/members`);
  }

  async addTeamMember(teamId, memberData) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  async updateTeamMember(teamId, memberId, data) {
    return this.request(`/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeamMember(teamId, memberId) {
    return this.request(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Raise-hand (help request)
  async raiseHand(note) {
    return this.request('/teams/me/raise-hand', {
      method: 'POST',
      body: JSON.stringify({ note: note || null }),
    });
  }

  async lowerHand() {
    return this.request('/teams/me/raise-hand', { method: 'DELETE' });
  }

  async getRaisedHands() {
    return this.request('/teams/raised-hands');
  }

  // Scores endpoints
  async setScore(teamId, categoryId, points) {
    return this.request(`/scores/${teamId}/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ points }),
    });
  }

  async getTeamScores(teamId) {
    return this.request(`/scores/${teamId}`);
  }

  // Leaderboard endpoint
  async getLeaderboard(category = null) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/leaderboard${query}`);
  }

  // Judges endpoints (admin only)
  async getJudges() {
    return this.request('/judges');
  }

  async createJudge(judgeData) {
    return this.request('/judges', {
      method: 'POST',
      body: JSON.stringify(judgeData),
    });
  }

  async getJudge(judgeId) {
    return this.request(`/judges/${judgeId}`);
  }

  async updateJudge(judgeId, data) {
    return this.request(`/judges/${judgeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJudge(judgeId) {
    return this.request(`/judges/${judgeId}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getStats() {
    return this.request('/admin/stats');
  }

  async exportTeamsCsv() {
    const response = await fetch(`${API_BASE}/admin/export/teams`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.blob();
  }

  async exportJudgesCsv() {
    const response = await fetch(`${API_BASE}/admin/export/judges`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.blob();
  }

  async exportRankingsCsv() {
    const response = await fetch(`${API_BASE}/admin/export/rankings`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.blob();
  }

  // Hackathon state (public GET, admin PUT)
  async getHackathonState() {
    return this.request('/hackathon/state');
  }

  async updateHackathonState(payload) {
    return this.request('/hackathon/state', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // API Keys (admin)
  async getApiKeysStatus() {
    return this.request('/admin/api-keys/status');
  }

  async uploadApiKeysCsv(file) {
    const url = `${API_BASE}/admin/api-keys/upload`;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  }

  async setApiKeysReveal(revealed) {
    return this.request('/admin/api-keys/reveal', {
      method: 'PUT',
      body: JSON.stringify({ revealed }),
    });
  }

  async clearApiKeys() {
    return this.request('/admin/api-keys', { method: 'DELETE' });
  }

  // Leaderboard freeze (admin PUT, public snapshot GET)
  async setLeaderboardFrozen(frozen) {
    return this.request('/leaderboard/freeze', {
      method: 'PUT',
      body: JSON.stringify({ frozen }),
    });
  }

  async getLeaderboardSnapshot() {
    return this.request('/leaderboard/snapshot');
  }
}

export const api = new ApiClient();
