import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../context/TeamContext';
import { useJudges } from '../context/JudgeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CATEGORY_LIST, getCategoryById, calculateTotalScore } from '../data/categories';
import { config } from '../lib/config';
import { api } from '../lib/api';

export default function ExportData() {
  const { t } = useTranslation();
  const { teams } = useTeams();
  const { judges } = useJudges();
  const [loading, setLoading] = useState(false);

  const generateMembersCSV = () => {
    const headers = ['Team', 'Member Name', 'Phone'];
    const rows = [];
    teams.forEach((team) => {
      (team.members || []).forEach((m) => {
        rows.push([team.teamName, m.name || '', m.phone || '']);
      });
    });
    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const generateTeamsCSV = () => {
    const headers = [
      'Team ID',
      'Team Name',
      'Project Name',
      'Description',
      'Members',
      'Member Phones',
      ...CATEGORY_LIST.map((c) => `${c.name} Score`),
      'Total Score',
      'Registration Date',
    ];

    const rows = teams.map((team) => [
      team.id,
      team.teamName,
      team.projectName,
      team.description || '',
      team.members.map((m) => m.name).join('; '),
      team.members.map((m) => m.phone).join('; '),
      ...CATEGORY_LIST.map((c) => team.scores[c.id] || 0),
      calculateTotalScore(team.scores),
      new Date(team.createdAt).toLocaleDateString(),
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const generateJudgesCSV = () => {
    const headers = ['Judge ID', 'Name', 'Category', 'Created Date'];

    const rows = judges.map((judge) => {
      const category = getCategoryById(judge.categoryId);
      return [
        judge.id,
        judge.name,
        category?.name || judge.categoryId,
        new Date(judge.createdAt).toLocaleDateString(),
      ];
    });

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const generateRankingsCSV = () => {
    const sortedTeams = [...teams]
      .map((team) => ({
        ...team,
        totalScore: calculateTotalScore(team.scores),
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const headers = [
      'Rank',
      'Team Name',
      'Project Name',
      ...CATEGORY_LIST.map((c) => c.name),
      'Total Score',
    ];

    const rows = sortedTeams.map((team, idx) => [
      idx + 1,
      team.teamName,
      team.projectName,
      ...CATEGORY_LIST.map((c) => team.scores[c.id] || 0),
      team.totalScore,
    ]);

    return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      // Release the blob URL so the browser can garbage-collect the Blob memory.
      // A small delay gives Safari time to actually start the download first.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleExportMembers = async () => {
    setLoading(true);
    try {
      // Always generate from loaded teams data — works in both mock and API mode
      downloadCSV(generateMembersCSV(), 'members.csv');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTeams = async () => {
    setLoading(true);
    try {
      if (config.useMockData) {
        downloadCSV(generateTeamsCSV(), 'teams.csv');
      } else {
        const blob = await api.exportTeamsCsv();
        downloadBlob(blob, 'teams.csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJudges = async () => {
    setLoading(true);
    try {
      if (config.useMockData) {
        downloadCSV(generateJudgesCSV(), 'judges.csv');
      } else {
        const blob = await api.exportJudgesCsv();
        downloadBlob(blob, 'judges.csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRankings = async () => {
    setLoading(true);
    try {
      if (config.useMockData) {
        downloadCSV(generateRankingsCSV(), 'rankings.csv');
      } else {
        const blob = await api.exportRankingsCsv();
        downloadBlob(blob, 'rankings.csv');
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin" className="text-sm text-white/40 hover:text-white mb-2 inline-block">
          &larr; {t('common.back')}
        </Link>
        <h1 className="text-2xl font-bold text-white">{t('admin.exportPage.title')}</h1>
        <p className="text-white/50">{t('admin.exportPage.desc')}</p>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.exportPage.exportTeams')}</CardTitle>
            <CardDescription>{t('admin.exportPage.exportTeamsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-white/40">
                <p>{t('admin.exportPage.teamsCount', { count: teams.length })}</p>
                <p>{t('admin.exportPage.participantsCount', { count: teams.reduce((sum, tm) => sum + (tm.members?.length || 0), 0) })}</p>
              </div>
              <Button onClick={handleExportTeams} className="w-full" glow disabled={loading}>
                {loading ? t('admin.exportPage.exporting') : t('admin.exportPage.downloadTeams')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.exportPage.exportMembers')}</CardTitle>
            <CardDescription>{t('admin.exportPage.exportMembersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-white/40">
                <p>{t('admin.exportPage.participantsCount', { count: teams.reduce((sum, tm) => sum + (tm.members?.length || 0), 0) })}</p>
                <p>{t('admin.exportPage.teamsCount', { count: teams.length })}</p>
              </div>
              <Button onClick={handleExportMembers} className="w-full" glow disabled={loading}>
                {loading ? t('admin.exportPage.exporting') : t('admin.exportPage.downloadMembers')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.exportPage.exportJudges')}</CardTitle>
            <CardDescription>{t('admin.exportPage.exportJudgesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-white/40">
                <p>{t('admin.exportPage.judgesCount', { count: judges.length })}</p>
                <p>{t('admin.exportPage.categoriesCount', { count: CATEGORY_LIST.length })}</p>
              </div>
              <Button onClick={handleExportJudges} className="w-full" glow disabled={loading}>
                {loading ? t('admin.exportPage.exporting') : t('admin.exportPage.downloadJudges')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.exportPage.exportRankings')}</CardTitle>
            <CardDescription>{t('admin.exportPage.exportRankingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-white/40">
                <p>{t('admin.exportPage.sortedByScore')}</p>
                <p>{t('admin.exportPage.allCategories')}</p>
              </div>
              <Button onClick={handleExportRankings} className="w-full" glow disabled={loading}>
                {loading ? t('admin.exportPage.exporting') : t('admin.exportPage.downloadRankings')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.exportPage.dataPreview')}</CardTitle>
          <CardDescription>{t('admin.exportPage.dataPreviewDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Teams Preview */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">
                {t('admin.teams')} ({teams.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start border-b border-white/[0.06]">
                      <th className="pb-2 text-white/40 font-medium text-start">{t('admin.exportPage.team')}</th>
                      <th className="pb-2 text-white/40 font-medium text-start">{t('admin.exportPage.project')}</th>
                      <th className="pb-2 text-white/40 font-medium text-start">{t('admin.exportPage.members')}</th>
                      <th className="pb-2 text-white/40 font-medium text-end">{t('admin.exportPage.score')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.slice(0, 5).map((team) => (
                      <tr key={team.id} className="border-b border-white/[0.03]">
                        <td className="py-3 text-white">{team.teamName}</td>
                        <td className="py-3 text-white/60">{team.projectName}</td>
                        <td className="py-3 text-white/60">{team.members?.length || 0}</td>
                        <td className="py-3 text-white font-medium text-end">
                          {calculateTotalScore(team.scores)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {teams.length > 5 && (
                  <p className="text-xs text-white/40 mt-2">
                    {t('admin.exportPage.andMore', { count: teams.length - 5 })}
                  </p>
                )}
              </div>
            </div>

            {/* Category Stats */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">{t('admin.exportPage.pointsByCategory')}</h3>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_LIST.map((category) => {
                  const totalCategoryPoints = teams.reduce(
                    (sum, team) => sum + (team.scores[category.id] || 0),
                    0
                  );
                  return (
                    <div
                      key={category.id}
                      className="p-3 rounded-lg text-center"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <div
                        className="text-lg font-bold"
                        style={{ color: category.color }}
                      >
                        {totalCategoryPoints}
                      </div>
                      <div className="text-xs text-white/40">{t(`categories.${category.id}`)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
