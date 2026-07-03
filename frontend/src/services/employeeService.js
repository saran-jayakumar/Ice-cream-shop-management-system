import api from './api';

export const employeeService = {
  getAllEmployees: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (employee) => {
    const response = await api.post('/employees', employee);
    return response.data;
  },

  updateEmployee: async (id, employee) => {
    const response = await api.put(`/employees/${id}`, employee);
    return response.data;
  },

  deleteEmployee: async (id) => {
    await api.delete(`/employees/${id}`);
  }
};
