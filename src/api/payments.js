import apiClient from './apiClient';

/**
 * Obtiene la Hoja de Ruta (Cobranza agrupada por cliente)
 * Esta es la función que alimenta la nueva vista de cobranza eficiente.
 */
export const getCollectionRoadmap = async () => {
    // Apuntamos al endpoint que creamos en el dashboard_router
    const { data } = await apiClient.get('/dashboard/collection-roadmap');
    return data;
};

/**
 * Registrar un nuevo pago (cobro de letra)
 */
export const registerPayment = async (paymentData) => {
    const { data } = await apiClient.post('/payments/', paymentData);
    return data;
};

/**
 * Obtener historial de todos los pagos con paginación
 */
export const getPayments = async ({ skip = 0, limit = 100 } = {}) => {
    const { data } = await apiClient.get(`/payments/?skip=${skip}&limit=${limit}`);
    return data;
};

/**
 * Obtener cuotas pendientes (Versión antigua)
 */
export const getPendingInstallments = async () => {
    const { data } = await apiClient.get('/installments/pending');
    return data;
};