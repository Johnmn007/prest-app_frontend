import apiClient from './apiClient';

export const getClients = async ({ search = '', risk_score = '', skip = 0, limit = 100 }) => {
    const params = new URLSearchParams({ skip, limit });
    if (search) params.append('search', search);
    if (risk_score) params.append('risk_score', risk_score);

    const { data } = await apiClient.get(`/clients/?${params.toString()}`);
    return data;
};

export const getClientById = async (id) => {
    const { data } = await apiClient.get(`/clients/${id}`);
    return data;
};

export const createClient = async (clientData) => {
    const { data } = await apiClient.post('/clients/', clientData);
    return data;
};

export const updateClient = async ({ id, data }) => {
    const response = await apiClient.put(`/clients/${id}`, data);
    return response.data;
};

export const deleteClient = async (id) => {
    const { data } = await apiClient.delete(`/clients/${id}`);
    return data;
};
