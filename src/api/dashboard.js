import apiClient from './apiClient';

export const getDashboardMetrics = async () => {
    const { data } = await apiClient.get('/dashboard/metrics');
    return data;
};

export const getDailyIncomeReport = async (date) => {
    const url = date ? `/dashboard/reports/daily-income?date_target=${date}` : '/dashboard/reports/daily-income';
    const { data } = await apiClient.get(url);
    return data;
};

export const getExpiringLoans = async (threshold = 2) => {
    const { data } = await apiClient.get(`/dashboard/expiring-loans?days_threshold=${threshold}`);
    return data;
};

