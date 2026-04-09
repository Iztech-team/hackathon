export const CATEGORIES = {
  UI_UX: { id: 'ui_ux', name: 'UI/UX', color: '#d4b069' },
  FRONTEND: { id: 'frontend', name: 'Frontend', color: '#d4b069' },
  BACKEND: { id: 'backend', name: 'Backend', color: '#d4b069' },
  INNOVATION: { id: 'innovation', name: 'Innovation', color: '#d4b069' },
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
