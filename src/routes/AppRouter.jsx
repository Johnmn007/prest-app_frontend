import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';

// Layout & Rutas Protegidas
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoutes from './ProtectedRoutes';

// Páginas Reales
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ClientsPage from '../pages/clients/ClientsPage';
import LoansPage from '../pages/loans/LoansPage';
import CreateLoanPage from '../pages/loans/CreateLoanPage';
import LoanDetailPage from '../pages/loans/LoanDetailPage';
import DailyCollectionPage from '../pages/payments/DailyCollectionPage';
import RefinancingPage from '../pages/refinancing/RefinancingPage';
import RefinanceLoanPage from '../pages/refinancing/RefinanceLoanPage';
import RoutesPage from '../pages/routes/RoutesPage';
import RouteDetailPage from '../pages/routes/RouteDetailPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ExpensesPage from '../pages/expenses/ExpensesPage';

export default function AppRouter() {
    const { token, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        // Interceptor de Peticiones: Agrega el Token JWT automáticamente
        const requestInterceptor = apiClient.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Interceptor de Respuestas: Maneja errores 401 (Sesión expirada)
        const responseInterceptor = apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            apiClient.interceptors.request.eject(requestInterceptor);
            apiClient.interceptors.response.eject(responseInterceptor);
        };
    }, [token, logout]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta Pública: Login */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
                />

                {/* Rutas Privadas: Requieren Autenticación */}
                <Route element={<ProtectedRoutes />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        {/* Clientes */}
                        <Route path="/clients" element={<ClientsPage />} />
                        
                        {/* Préstamos */}
                        <Route path="/loans" element={<LoansPage />} />
                        <Route path="/loans/new" element={<CreateLoanPage />} />
                        <Route path="/loans/:id" element={<LoanDetailPage />} />
                        
                        {/* Cobranza y Pagos */}
                        <Route path="/payments" element={<DailyCollectionPage />} />
                        
                        {/* Rutas de Cobro */}
                        <Route path="/routes" element={<RoutesPage />} />
                        <Route path="/routes/:id" element={<RouteDetailPage />} />
                        
                        {/* Refinanciamiento */}
                        <Route path="/refinancing" element={<RefinancingPage />} />
                        <Route path="/refinancing/new/:id" element={<RefinanceLoanPage />} />
                        
                        {/* Reportes (Conectado a la página real) */}
                        <Route path="/reports" element={<ReportsPage />} />

                        {/* Egresos / Gastos Operativos */}
                        <Route path="/expenses" element={<ExpensesPage />} />
                        
                        {/* Configuración (Placeholder temporal) */}
                        <Route path="/config" element={
                            <div className="py-20 text-center">
                                <h1 className="text-2xl font-bold text-gray-700">Configuración</h1>
                                <p className="text-gray-500">Ajustes de sistema en desarrollo...</p>
                            </div>
                        } />
                    </Route>
                </Route>

                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}