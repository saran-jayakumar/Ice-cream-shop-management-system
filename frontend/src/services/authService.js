import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        name: response.data.name,
        role: response.data.role
      }));
    }
    return response.data;
  },

  signup: async (name, email, password, role) => {
    const response = await api.post('/auth/signup', { name, email, password, role });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/delete');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  updateProfile: async (name, password) => {
    const response = await api.put('/auth/profile', { name, password });
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (name) user.name = name;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getCurrentUserDetails: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
