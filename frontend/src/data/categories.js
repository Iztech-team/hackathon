export const CATEGORIES = {
  INNOVATION: { id: 'innovation', name: 'Innovation', color: '#3b82f6', maxPoints: 15, criteria: [
    { id: 'ps_fit', weight: 3 },
    { id: 'novelty', weight: 3 },
    { id: 'scalability', weight: 3 },
    { id: 'judge_opinion', weight: 6 },
  ]},
  VISUAL_DESIGN: { id: 'visual_design', name: 'Visual Design', color: '#8b5cf6', maxPoints: 15, criteria: [
    { id: 'design_clarity', weight: 3 },
    { id: 'onboarding', weight: 3 },
    { id: 'responsiveness', weight: 3 },
    { id: 'judge_opinion', weight: 6 },
  ]},
  ARCHITECTURE: { id: 'architecture', name: 'Architecture', color: '#06b6d4', maxPoints: 15, criteria: [
    { id: 'tech_stack', weight: 3 },
    { id: 'arch_scalability', weight: 3 },
    { id: 'structure', weight: 3 },
    { id: 'judge_opinion', weight: 6 },
  ]},
  READINESS: { id: 'readiness', name: 'Readiness', color: '#10b981', maxPoints: 10, criteria: [] },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const getCategoryById = (id) => {
  return CATEGORY_LIST.find(cat => cat.id === id) || null;
};

export const getInitialScores = () => {
  return CATEGORY_LIST.reduce((acc, cat) => {
    acc[cat.id] = 0;
    return acc;
  }, {});
};

export const calculateTotalScore = (scores) => {
  return Object.values(scores || {}).reduce((sum, score) => sum + score, 0);
};

export const getMaxTotalScore = () => {
  return CATEGORY_LIST.reduce((sum, cat) => sum + cat.maxPoints, 0);
};
