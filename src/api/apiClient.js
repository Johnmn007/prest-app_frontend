// import axios from 'axios';

// const apiClient = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// export default apiClient;

import axios from 'axios';

/**
 * Cliente de Axios Blindado
 * Forzamos HTTPS y eliminamos cualquier slash final para evitar redirecciones 301.
 */
const apiClient = axios.create({
    // Forzamos manualmente la URL con HTTPS
    baseURL: 'https://prest-appbackend-production.up.railway.app', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para asegurar que ninguna petición salga por HTTP accidentalmente
apiClient.interceptors.request.use((config) => {
    if (config.baseURL && config.baseURL.startsWith('http://')) {
        config.baseURL = config.baseURL.replace('http://', 'https://');
    }
    
    // Eliminamos slashes dobles que a veces causan redirecciones en Railway
    config.url = config.url.replace(/\/+$/, ''); 
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
