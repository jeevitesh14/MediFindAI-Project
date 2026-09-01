import apiClient from '../api/axiosConfig';

export const notificationService = {
  async getNotifications(page = 0, size = 20) {
    const res = await apiClient.get('/notifications', {
      params: { page, size },
    });
    return res.data?.data || [];
  },

  async getRecentNotifications(limit = 10) {
    const res = await apiClient.get('/notifications/recent', {
      params: { limit },
    });
    return res.data?.data || [];
  },

  async getUnreadCount() {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data?.data?.unreadCount ?? 0;
  },

  async markAsRead(notificationId) {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`);
    return res.data?.data;
  },

  async markAllAsRead() {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data?.data;
  },
};

export default notificationService;
