import apiClient from './apiClient';

export const getDashboardMetrics = async (params) => {
    const { data } = await apiClient.get('/dashboard/metrics', { params });
    return data;
};

export const getDailyIncomeReport = async (date) => {
    const { data } = await apiClient.get('/dashboard/reports/daily-income', {
        params: { date_target: date }
    });
    return data;
};

/** Ingresos + egresos agrupados por día para un rango de fechas */
export const getIncomeByRange = async (date_from, date_to) => {
    const { data } = await apiClient.get('/dashboard/reports/income-range', {
        params: { date_from, date_to }
    });
    return data;
};

/** Resumen completo de cartera, mora y top deudores */
export const getPortfolioSummary = async () => {
    const { data } = await apiClient.get('/dashboard/reports/portfolio-summary');
    return data;
};

/** Cierre de caja del día: ingresos, egresos, utilidad neta */
export const getCashClose = async (target_date) => {
    const { data } = await apiClient.get('/dashboard/reports/cash-close', {
        params: target_date ? { target_date } : {}
    });
    return data;
};