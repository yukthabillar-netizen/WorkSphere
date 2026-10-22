import api from './api';

export const commentService = {
  async getTaskComments(taskId) {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data;
  },

  async addComment(taskId, data) {
    const res = await api.post(`/tasks/${taskId}/comments`, data);
    return res.data;
  },

  async updateComment(id, data) {
    const res = await api.patch(`/comments/${id}`, data);
    return res.data;
  },

  async deleteComment(id) {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  },
};
