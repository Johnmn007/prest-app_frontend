import apiClient from './apiClient';

export const getLoans = async ({ search = '', status = '', skip = 0, limit = 100 }) => {
    const params = new URLSearchParams({ skip, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const { data } = await apiClient.get(`/loans?${params.toString()}`);
    return data;
};

export const getLoanById = async (id) => {
    const { data } = await apiClient.get(`/loans/${id}`);
    return data;
};

export const createLoan = async (loanData) => {
    const { data } = await apiClient.post('/loans/', loanData);
    return data;
};

export const getLoanInstallments = async (loanId) => {
    const { data } = await apiClient.get(`/installments/loan/${loanId}`);
    return data;
};

export const updateLoan = async ({ id, data }) => {
    const response = await apiClient.put(`/loans/${id}`, data);
    return response.data;
};

export const deleteLoan = async (id) => {
    const { data } = await apiClient.delete(`/loans/${id}`);
    return data;
};
