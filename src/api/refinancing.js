import apiClient from './apiClient';

export const searchLoansForRefinance = async (query) => {
    // Searches active loans
    const { data } = await apiClient.get('/loans', { params: { search: query, status: 'ACTIVE' } });
    return data;
};

export const createRefinancing = async (refinancingData) => {
    // e.g. refinancingData = { loan_id, type: 'RENEWAL' | 'MORA', new_amount, installments, interest_rate }
    const { data } = await apiClient.post('/refinancing/', refinancingData);
    return data;
};
