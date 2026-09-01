import apiClient from '../api/axiosConfig';

const authService = {
  register: (payload) => apiClient.post('/auth/register', payload).then((res) => res.data.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((res) => res.data.data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((res) => res.data.data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((res) => res.data.data),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload).then((res) => res.data.data),
  getCurrentUser: () => apiClient.get('/users/me').then((res) => res.data.data),
};

export default authService;
