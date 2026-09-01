import apiClient from '../api/axiosConfig';

export const pharmacyService = {
  /**
   * Fetch verified nearby pharmacies based on coordinates and search radius
   * @param {Object} params - { latitude, longitude, radiusKm, medicineId }
   */
  getNearbyPharmacies: async ({ latitude, longitude, radiusKm = 10, medicineId = null }) => {
    const params = {
      latitude,
      longitude,
      radiusKm,
    };
    if (medicineId) {
      params.medicineId = medicineId;
    }
    const response = await apiClient.get('/pharmacies/nearby', { params });
    return response.data?.data || [];
  },
};

export default pharmacyService;
