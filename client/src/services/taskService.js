import api from './api';

export const taskService = {
  async getProjectTasks(projectId, params = {}) {
    const res = await api.get(`/projects/${projectId}/tasks`, { params });
    return res.data;
  },

  async createTask(projectId, data) {
    const res = await api.post(`/projects/${projectId}/tasks`, data);
    return res.data;
  },

  async getTaskById(id) {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  async updateTask(id, data) {
    const res = await api.patch(`/tasks/${id}`, data);
    return res.data;
  },

  async moveTask(id, { status, order }) {
    const res = await api.patch(`/tasks/${id}/move`, { status, order });
    return res.data;
  },

  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  async restoreTask(id) {
    const res = await api.post(`/tasks/${id}/restore`);
    return res.data;
  },

  async getMyTasks(workspaceId) {
    const res = await api.get('/tasks/mine', { params: { workspaceId } });
    return res.data;
  },
};
