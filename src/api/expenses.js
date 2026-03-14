import apiClient from './apiClient';

/**
 * Listar egresos con filtros opcionales de fecha y categoría.
 */
export const getExpenses = async ({ date_from, date_to, category, skip = 0, limit = 100 } = {}) => {
    const params = new URLSearchParams();
    if (date_from) params.append('date_from', date_from);
    if (date_to)   params.append('date_to',   date_to);
    if (category)  params.append('category',  category);
    params.append('skip',  skip);
    params.append('limit', limit);
    const { data } = await apiClient.get(`/expenses/?${params.toString()}`);
    return data;
};

/**
 * Resumen diario de egresos (total + por categoría).
 */
export const getDailySummary = async (target_date) => {
    const url = target_date
        ? `/expenses/daily-summary?target_date=${target_date}`
        : '/expenses/daily-summary';
    const { data } = await apiClient.get(url);
    return data;
};

/**
 * Crear un nuevo egreso.
 */
export const createExpense = async (payload) => {
    const { data } = await apiClient.post('/expenses/', payload);
    return data;
};

/**
 * Actualizar un egreso existente.
 */
export const updateExpense = async ({ id, data: payload }) => {
    const { data } = await apiClient.put(`/expenses/${id}`, payload);
    return data;
};

/**
 * Eliminar un egreso.
 */
export const deleteExpense = async (id) => {
    await apiClient.delete(`/expenses/${id}`);
};
