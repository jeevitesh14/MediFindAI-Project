import apiClient from '../api/axiosConfig';

const pharmacyOwnerService = {
  /** Fetch the pharmacy profile owned by current authenticated owner */
  getProfile: async () => {
    const res = await apiClient.get('/pharmacy-owner/pharmacy');
    return res.data?.data;
  },

  /** Update the pharmacy profile */
  updateProfile: async (payload) => {
    const res = await apiClient.put('/pharmacy-owner/pharmacy', payload);
    return res.data?.data;
  },

  /** Fetch dashboard aggregate statistics & recent reservations */
  getStats: async () => {
    const res = await apiClient.get('/pharmacy-owner/stats');
    return res.data?.data;
  },

  /** Fetch inventory list with optional filters (search, status) */
  getInventory: async (params = {}) => {
    const res = await apiClient.get('/pharmacy-owner/inventory', { params });
    return res.data?.data || [];
  },

  /** Fetch single inventory item */
  getInventoryItem: async (id) => {
    const res = await apiClient.get(`/pharmacy-owner/inventory/${id}`);
    return res.data?.data;
  },

  /** Add an existing medicine from central catalogue to pharmacy inventory */
  addInventory: async (payload) => {
    const res = await apiClient.post('/pharmacy-owner/inventory', payload);
    return res.data?.data;
  },

  /** Update inventory item (quantity, price, lowStockThreshold) */
  updateInventory: async (id, payload) => {
    const res = await apiClient.put(`/pharmacy-owner/inventory/${id}`, payload);
    return res.data?.data;
  },

  /** Quick update stock quantity */
  updateStock: async (id, quantity) => {
    const res = await apiClient.patch(`/pharmacy-owner/inventory/${id}/stock`, { quantity });
    return res.data?.data;
  },

  /** Quick update unit price */
  updatePrice: async (id, price) => {
    const res = await apiClient.patch(`/pharmacy-owner/inventory/${id}/price`, { price });
    return res.data?.data;
  },

  /** Delete medicine from pharmacy inventory */
  deleteInventory: async (id) => {
    const res = await apiClient.delete(`/pharmacy-owner/inventory/${id}`);
    return res.data?.data;
  },

  /** Fetch reservations list with optional filters (status, search) */
  getReservations: async (params = {}) => {
    const res = await apiClient.get('/pharmacy-owner/reservations', { params });
    return res.data?.data || [];
  },

  /** Fetch single reservation detail */
  getReservationById: async (id) => {
    const res = await apiClient.get(`/pharmacy-owner/reservations/${id}`);
    return res.data?.data;
  },

  /** Confirm a pending reservation hold */
  confirmReservation: async (id) => {
    const res = await apiClient.post(`/pharmacy-owner/reservations/${id}/confirm`);
    return res.data?.data;
  },

  /** Reject a pending/confirmed reservation and restore stock */
  rejectReservation: async (id, reason) => {
    const res = await apiClient.post(`/pharmacy-owner/reservations/${id}/reject`, { reason });
    return res.data?.data;
  },

  /** Mark confirmed reservation ready for customer pickup */
  markReservationReady: async (id) => {
    const res = await apiClient.post(`/pharmacy-owner/reservations/${id}/ready`);
    return res.data?.data;
  },

  /** Mark ready reservation as completed (dispensed) */
  markReservationCompleted: async (id) => {
    const res = await apiClient.post(`/pharmacy-owner/reservations/${id}/complete`);
    return res.data?.data;
  },
};

export default pharmacyOwnerService;
