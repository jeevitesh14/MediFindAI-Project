import apiClient from '../api/axiosConfig';

export const prescriptionService = {
  /**
   * Uploads and scans a prescription image file.
   * @param {File} file
   * @param {Function} [onUploadProgress]
   * @returns {Promise<Object>} PrescriptionScanResponse
   */
  async scanPrescription(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/prescriptions/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      },
    });

    return response.data?.data;
  },

  /**
   * Retrieves the current user's prescription scans history.
   * @returns {Promise<Array>}
   */
  async getMyPrescriptions() {
    const response = await apiClient.get('/prescriptions/my');
    return response.data?.data || [];
  },

  /**
   * Fetches a single prescription scan record by ID.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async getPrescriptionById(id) {
    const response = await apiClient.get(`/prescriptions/${id}`);
    return response.data?.data;
  },
};

export default prescriptionService;
