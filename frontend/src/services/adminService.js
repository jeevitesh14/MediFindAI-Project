import apiClient from '../api/axiosConfig';

export const adminService = {
  async getDashboardStats() {
    const res = await apiClient.get('/admin/stats');
    return res.data?.data;
  },

  async getUsers(params = {}) {
    const res = await apiClient.get('/admin/users', { params });
    return res.data?.data || [];
  },

  async updateUserStatus(userId, active) {
    const res = await apiClient.patch(`/admin/users/${userId}/status`, { active });
    return res.data?.data;
  },

  async getPharmacies(params = {}) {
    const res = await apiClient.get('/admin/pharmacies', { params });
    return res.data?.data || [];
  },

  async verifyPharmacy(pharmacyId, data) {
    const res = await apiClient.patch(`/admin/pharmacies/${pharmacyId}/verify`, data);
    return res.data?.data;
  },

  async deletePharmacy(pharmacyId) {
    const res = await apiClient.delete(`/admin/pharmacies/${pharmacyId}`);
    return res.data;
  },


  async getMedicines(params = {}) {
    const res = await apiClient.get('/admin/medicines', { params });
    return res.data?.data || [];
  },

  async createMedicine(data) {
    const res = await apiClient.post('/admin/medicines', data);
    return res.data?.data;
  },

  async updateMedicine(medicineId, data) {
    const res = await apiClient.put(`/admin/medicines/${medicineId}`, data);
    return res.data?.data;
  },

  async deleteMedicine(medicineId) {
    const res = await apiClient.delete(`/admin/medicines/${medicineId}`);
    return res.data?.data;
  },

  async getReservations(params = {}) {
    const res = await apiClient.get('/admin/reservations', { params });
    return res.data?.data || [];
  },
};

export default adminService;
