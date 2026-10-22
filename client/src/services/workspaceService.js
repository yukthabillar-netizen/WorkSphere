import api from './api';

export const workspaceService = {
  async getMyWorkspaces() {
    const res = await api.get('/workspaces');
    return res.data;
  },

  async createWorkspace(data) {
    const res = await api.post('/workspaces', data);
    return res.data;
  },

  async joinByCode(code) {
    const res = await api.post('/workspaces/join-by-code', { code });
    return res.data;
  },

  async regenerateJoinCode(workspaceId) {
    const res = await api.post(`/workspaces/${workspaceId}/regenerate-join-code`);
    return res.data;
  },

  async getWorkspaceById(id) {
    const res = await api.get(`/workspaces/${id}`);
    return res.data;
  },

  async updateWorkspace(id, data) {
    const res = await api.patch(`/workspaces/${id}`, data);
    return res.data;
  },

  async deleteWorkspace(id) {
    const res = await api.delete(`/workspaces/${id}`);
    return res.data;
  },

  async createInvite(workspaceId, data) {
    const res = await api.post(`/workspaces/${workspaceId}/invites`, data);
    return res.data;
  },

  async acceptInvite(token) {
    const res = await api.post(`/invites/${token}/accept`);
    return res.data;
  },

  async changeMemberRole(workspaceId, userId, role) {
    const res = await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
    return res.data;
  },

  async removeMember(workspaceId, userId) {
    const res = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
    return res.data;
  },
};
