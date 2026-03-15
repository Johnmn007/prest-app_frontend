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
 * Cliente de Axios centralizado.
 * Importante: En Vite, las variables de entorno deben empezar con VITE_
 * para ser accesibles en el cliente.
 */
const apiClient = axios.create({
    // Usamos directamente la variable de entorno configurada en Vercel.
    // Eliminamos el respaldo de localhost para forzar el uso de HTTPS en producción.
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Opcional: Interceptor para debugging (puedes borrarlo si prefieres)
apiClient.interceptors.request.use((config) => {
    console.log(`Petición enviada a: ${config.baseURL}${config.url}`);
    return config;
});

export default apiClient;
