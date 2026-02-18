import api from "./api";

export const adminAPI = {
  getStats: async () => {
    const { data } = await api.get("/admin/stats");
    return data;
  },
  getUsers: async () => {
    const { data } = await api.get("/admin/users");
    return data?.users || [];
  },
  updateUser: async (id, payload) => {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data?.user;
  },
};

export default adminAPI;

