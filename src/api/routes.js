import apiClient from './apiClient';

export const getRoutes = async () => {
    const { data } = await apiClient.get('/routes/');
    return data;
};

export const getRouteById = async (id) => {
    const { data } = await apiClient.get(`/routes/${id}`);
    return data;
};

export const createRoute = async (routeData) => {
    const { data } = await apiClient.post('/routes/', routeData);
    return data;
};

export const assignClientToRoute = async (assignmentData) => {
    // assignmentData = { route_id, client_id, order }
    const { data } = await apiClient.post('/routes/assign-client', assignmentData);
    return data;
};
