import api from './api';

export const dashboardService = {
  async getWorkspaceDashboard(workspaceId) {
    const res = await api.get(`/workspaces/${workspaceId}/dashboard`);
    return res.data;
  },
};

export const searchService = {
  async search(query, workspaceId) {
    const res = await api.get('/search', {
      params: { q: query, workspaceId },
    });
    return res.data;
  },
};
