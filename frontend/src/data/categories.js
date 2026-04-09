export const CATEGORIES = {
  UI_UX: { id: 'ui_ux', name: 'UI/UX', color: '#3b82f6' },
  FRONTEND: { id: 'frontend', name: 'Frontend', color: '#3b82f6' },
  BACKEND: { id: 'backend', name: 'Backend', color: '#3b82f6' },
  INNOVATION: { id: 'innovation', name: 'Innovation', color: '#3b82f6' },
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
