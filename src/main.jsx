import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './routes/AppRouter';
import ToastContainer from './components/ui/ToastContainer'; // Añadir esto
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AppRouter />
            <ToastContainer /> {/* Inyectar aquí */}
        </QueryClientProvider>
    </React.StrictMode>,
);