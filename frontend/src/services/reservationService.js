import apiClient from '../api/axiosConfig';

export const reservationService = {
  /** Create a new medicine reservation */
  createReservation: async ({ medicineId, pharmacyId, quantity }) => {
    const response = await apiClient.post('/reservations', {
      medicineId,
      pharmacyId,
      quantity,
    });
    return response.data?.data;
  },

  /** Get reservations of the currently logged in user */
  getMyReservations: async () => {
    const response = await apiClient.get('/reservations/my');
    return response.data?.data || [];
  },

  /** Get a single reservation by ID */
  getReservationById: async (id) => {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data?.data;
  },

  /** Cancel a pending or confirmed reservation */
  cancelReservation: async (id, reason) => {
    const response = await apiClient.post(`/reservations/${id}/cancel`, {
      reason,
    });
    return response.data?.data;
  },
};

export default reservationService;
