import apiClient from '../api/axiosConfig';

export const orderService = {
  // User orders
  async createOrder(orderData) {
    const response = await apiClient.post('/orders', orderData);
    return response.data?.data;
  },

  async getMyOrders() {
    const response = await apiClient.get('/orders/my');
    return response.data?.data || [];
  },

  async getOrderById(id) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data?.data;
  },

  async cancelOrder(id, reason) {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data?.data;
  },

  // Pharmacy owner orders
  async getPharmacyOrders(status = null) {
    const params = {};
    if (status) params.status = status;
    const response = await apiClient.get('/pharmacy-owner/orders', { params });
    return response.data?.data || [];
  },

  async updatePharmacyOrderStatus(id, status, cancellationReason = null) {
    const response = await apiClient.patch(`/pharmacy-owner/orders/${id}/status`, {
      status,
      cancellationReason,
    });
    return response.data?.data;
  },

  // Admin orders
  async getAdminOrders(status = null, search = '', page = 0, size = 50) {
    const params = { page, size };
    if (status) params.status = status;
    if (search) params.search = search;
    const response = await apiClient.get('/admin/orders', { params });
    return response.data?.data || [];
  },
};

export default orderService;
