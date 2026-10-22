import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async sendRegistrationCode(data) {
    const res = await api.post('/auth/register-send-code', data);
    return res.data;
  },

  async verifyRegistrationCode(data) {
    const res = await api.post('/auth/register-verify-code', data);
    return res.data;
  },

  async resendRegistrationCode(email) {
    const res = await api.post('/auth/register-resend-code', { email });
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.patch('/auth/me', data);
    return res.data;
  },

  async changePassword(data) {
    const res = await api.patch('/auth/password', data);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};
