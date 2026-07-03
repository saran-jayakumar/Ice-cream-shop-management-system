import api from './api';

export const billService = {
  getAllBills: async () => {
    const response = await api.get('/bills');
    return response.data;
  },

  generateBill: async (orderId) => {
    const response = await api.post(`/bills/order/${orderId}`);
    return response.data;
  },

  updatePaymentStatus: async (billId, status, method) => {
    const response = await api.put(`/bills/${billId}/payment?status=${status}&method=${method}`);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/bills/reports');
    return response.data;
  }
};
