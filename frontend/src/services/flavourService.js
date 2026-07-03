import api from './api';

export const flavourService = {
  getAllFlavours: async () => {
    const response = await api.get('/flavours');
    return response.data;
  },

  getFlavourById: async (id) => {
    const response = await api.get(`/flavours/${id}`);
    return response.data;
  },

  createFlavour: async (flavour) => {
    const response = await api.post('/flavours', flavour);
    return response.data;
  },

  updateFlavour: async (id, flavour) => {
    const response = await api.put(`/flavours/${id}`, flavour);
    return response.data;
  },

  deleteFlavour: async (id) => {
    await api.delete(`/flavours/${id}`);
  }
};
