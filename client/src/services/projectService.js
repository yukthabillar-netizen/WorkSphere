import api from './api';

export const projectService = {
  async getWorkspaceProjects(workspaceId, params = {}) {
    const res = await api.get(`/workspaces/${workspaceId}/projects`, { params });
    return res.data;
  },

  async createProject(workspaceId, data) {
    const res = await api.post(`/workspaces/${workspaceId}/projects`, data);
    return res.data;
  },

  async getProjectById(id) {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async updateProject(id, data) {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id) {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  async getProjectActivity(id, params = {}) {
    const res = await api.get(`/projects/${id}/activity`, { params });
    return res.data;
  },
};
