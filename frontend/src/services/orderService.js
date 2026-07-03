import api from './api';

export const orderService = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getPendingOrders: async () => {
    const response = await api.get('/orders/pending');
    return response.data;
  },

  getAllTables: async () => {
    const response = await api.get('/orders/tables');
    return response.data;
  },

  updateTableStatus: async (tableId, status) => {
    const response = await api.put(`/orders/tables/${tableId}/status?status=${status}`);
    return response.data;
  },

  createOrder: async (orderRequest) => {
    const response = await api.post('/orders', orderRequest);
    return response.data;
  },

  splitTable: async (tableId, suffix) => {
    const response = await api.post(`/orders/tables/${tableId}/split?suffix=${suffix}`);
    return response.data;
  },

  deleteTable: async (tableId) => {
    await api.delete(`/orders/tables/${tableId}`);
  }
};
