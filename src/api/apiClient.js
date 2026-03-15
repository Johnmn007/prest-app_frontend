// import axios from 'axios';

// const apiClient = axios.create({
//     baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// export default apiClient;

import axios from 'axios';

const apiClient = axios.create({
    // Forzamos la URL con HTTPS directamente aquí para probar
    baseURL: 'https://prest-appbackend-production.up.railway.app', 
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
