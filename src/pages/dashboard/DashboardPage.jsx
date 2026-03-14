import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardMetrics, getExpiringLoans } from '../../api/dashboard';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import CreateClientModal from '../clients/components/CreateClientModal';
import {
    Landmark, Users, Banknote, AlertTriangle, TrendingUp,
    Plus, Search, RefreshCw, ArrowRight, UserPlus, CreditCard,
    Route, FileText, Bell, CheckCircle, Phone, Clock, ChevronRight,
    Zap, Target, Activity
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(value || 0);

// ─── Componente: Panel de Créditos por Vencer ─────────────────────────────────
function ExpiringLoansPanel({ loans = [], isLoading, navigate }) {
    const [expanded, setExpanded] = useState(false);
    const display = expanded ? loans : loans.slice(0, 3);

    if (isLoading) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-600">
                        Créditos por Vencer
                    </span>
                </div>
                <div className="flex items-center justify-center py-4 text-amber-400 text-sm">
                    Cargando...
                </div>
            </div>
        );
    }

    if (loans.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-green-700">Sin créditos por vencer</p>
                    <p className="text-xs text-green-500 mt-0.5">Ningún préstamo tiene ≤2 cuotas pendientes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-black flex items-center justify-center">
                            {loans.length}
                        </span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-700">
                        ⚡ Créditos por Vencer — {loans.length} préstamo{loans.length > 1 ? 's' : ''}
                    </span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold">≤2 cuotas restantes</span>
            </div>

            {/* Lista */}
            <div className="divide-y divide-amber-100">
                {display.map((loan) => {
                    const isLastOne = loan.remaining_installments === 0 || loan.remaining_installments === 1;
                    return (
                        <div
                            key={loan.loan_id}
                            onClick={() => navigate(`/loans/${loan.loan_id}`)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-amber-100/60 cursor-pointer transition-colors group"
                        >
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                isLastOne ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {loan.client_name.charAt(0).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-gray-900 truncate uppercase">
                                        {loan.client_name}
                                    </p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        isLastOne
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {loan.remaining_installments === 0
                                            ? '¡Última cuota!'
                                            : `${loan.remaining_installments} cuota${loan.remaining_installments > 1 ? 's' : ''} restante${loan.remaining_installments > 1 ? 's' : ''}`
                                        }
                                    </span>
                                </div>
                                {/* Barra de progreso */}
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-green-500 rounded-full transition-all"
                                            style={{ width: `${loan.progress_pct}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-amber-600 flex-shrink-0">
                                        {loan.progress_pct}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-medium">
                                    <span>Préstamo #{loan.loan_id}</span>
                                    {loan.phone && (
                                        <span className="flex items-center gap-0.5">
                                            <Phone className="w-2.5 h-2.5" /> {loan.phone}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        Vence: {loan.last_due_date
                                            ? format(parseISO(loan.last_due_date), 'dd/MM/yy')
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-black text-gray-800">{formatCurrency(loan.pending_amount)}</p>
                                <p className="text-[10px] text-gray-400">pendiente</p>
                            </div>

                            <ChevronRight className="w-4 h-4 text-amber-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                        </div>
                    );
                })}
            </div>

            {/* Ver más */}
            {loans.length > 3 && (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="w-full text-center py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 transition-colors border-t border-amber-200"
                >
                    {expanded ? 'Ver menos ↑' : `Ver ${loans.length - 3} más ↓`}
                </button>
            )}
        </div>
    );
}

// ─── Página principal del Dashboard ──────────────────────────────────────────
export default function DashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modal de nuevo cliente
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

    const { data: metrics, isLoading, isError, dataUpdatedAt, isFetching } = useQuery({
        queryKey: ['dashboardMetrics'],
        queryFn: getDashboardMetrics,
        refetchInterval: 60000,
        refetchIntervalInBackground: false,
    });

    const { data: expiringLoans = [], isLoading: isLoadingExpiring } = useQuery({
        queryKey: ['expiringLoans'],
        queryFn: () => getExpiringLoans(2),
        refetchInterval: 120000,
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
        queryClient.invalidateQueries({ queryKey: ['expiringLoans'] });
    };

    if (isLoading) return <div className="mt-20"><Loader size="xl" /></div>;
    if (isError) return <div className="text-red-500">Error cargando el dashboard.</div>;

    const hasDelinquent = (metrics?.total_delinquent_clients || 0) > 0;
    const hasExpiring = expiringLoans.length > 0;

    // Placeholder chart (se puede conectar al backend luego)
    const chartData = [
        { name: 'Lun', ingresos: 120000 },
        { name: 'Mar', ingresos: 180000 },
        { name: 'Mie', ingresos: 90000 },
        { name: 'Jue', ingresos: 210000 },
        { name: 'Vie', ingresos: 300000 },
        { name: 'Sab', ingresos: 450000 },
    ];

    const statCards = [
        {
            name: 'Cartera Activa',
            value: formatCurrency(metrics?.total_portfolio || 0),
            icon: Landmark,
            color: 'text-blue-600', bg: 'bg-blue-100',
            onClick: () => navigate('/loans'),
        },
        {
            name: 'Ingresos de Hoy',
            value: formatCurrency(metrics?.daily_income || 0),
            icon: Banknote,
            color: 'text-green-600', bg: 'bg-green-100',
            onClick: () => navigate('/payments'),
        },
        {
            name: 'Préstamos Activos',
            value: metrics?.total_active_loans || 0,
            icon: CreditCard,
            color: 'text-brand-600', bg: 'bg-brand-100',
            onClick: () => navigate('/loans'),
        },
        {
            name: 'Clientes con Mora',
            value: metrics?.total_delinquent_clients || 0,
            icon: AlertTriangle,
            color: hasDelinquent ? 'text-red-600' : 'text-gray-400',
            bg: hasDelinquent ? 'bg-red-100' : 'bg-gray-100',
            highlight: hasDelinquent,
            subtext: hasDelinquent ? `${formatCurrency(metrics?.capital_at_risk || 0)} en riesgo` : 'Sin mora activa',
            onClick: () => navigate('/payments'),
        },
        {
            name: 'Ganancia Proyectada',
            value: formatCurrency(metrics?.estimated_profit || 0),
            icon: TrendingUp,
            color: 'text-purple-600', bg: 'bg-purple-100',
            onClick: () => navigate('/reports'),
        },
    ];

    // Acciones rápidas con sus rutas/acciones reales
    const quickActions = [
        {
            id: 'new-client',
            label: 'Nuevo Cliente',
            icon: UserPlus,
            description: 'Registrar cliente',
            color: 'text-blue-600',
            bgHover: 'hover:bg-blue-50',
            border: 'border-blue-100',
            action: () => setIsCreateClientOpen(true),
        },
        {
            id: 'new-loan',
            label: 'Otorgar Préstamo',
            icon: CreditCard,
            description: 'Nuevo crédito',
            color: 'text-brand-600',
            bgHover: 'hover:bg-brand-50',
            border: 'border-brand-100',
            action: () => navigate('/loans/new'),
        },
        {
            id: 'collection',
            label: 'Ruta de Cobros',
            icon: Route,
            description: `${metrics?.total_active_loans || 0} préstamos activos`,
            color: 'text-green-600',
            bgHover: 'hover:bg-green-50',
            border: 'border-green-100',
            action: () => navigate('/payments'),
        },
        {
            id: 'loans-list',
            label: 'Ver Préstamos',
            icon: Landmark,
            description: 'Listado completo',
            color: 'text-indigo-600',
            bgHover: 'hover:bg-indigo-50',
            border: 'border-indigo-100',
            action: () => navigate('/loans'),
        },
        {
            id: 'clients-list',
            label: 'Ver Clientes',
            icon: Users,
            description: 'Gestión de cartera',
            color: 'text-teal-600',
            bgHover: 'hover:bg-teal-50',
            border: 'border-teal-100',
            action: () => navigate('/clients'),
        },
        {
            id: 'reports',
            label: 'Reportes',
            icon: FileText,
            description: 'Análisis financiero',
            color: 'text-purple-600',
            bgHover: 'hover:bg-purple-50',
            border: 'border-purple-100',
            action: () => navigate('/reports'),
        },
    ];

    const today = new Date();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <PageHeader
                    title="Panel de Control"
                    description={`${format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })} — Resumen en tiempo real.`}
                />
                <button
                    onClick={handleRefresh}
                    disabled={isFetching}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 font-bold transition-colors mt-1"
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    {dataUpdatedAt ? `Act. ${format(new Date(dataUpdatedAt), 'HH:mm')}` : 'Actualizar'}
                </button>
            </div>

            {/* ── Alerta global de mora ───────────────────────────────────────── */}
            {hasDelinquent && (
                <div
                    className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => navigate('/payments')}
                >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                    <p className="text-sm text-red-700 font-bold flex-1">
                        {metrics.total_delinquent_clients} cliente{metrics.total_delinquent_clients > 1 ? 's' : ''} con mora activa —{' '}
                        <span className="font-black">{formatCurrency(metrics.capital_at_risk)}</span> en riesgo.
                    </p>
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                        Ver ahora <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            )}

            {/* ── KPI Cards ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((item) => (
                    <Card
                        key={item.name}
                        className={`transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                            item.highlight ? 'border-red-200 shadow-red-50' : ''
                        }`}
                        onClick={item.onClick}
                    >
                        <CardBody className="p-5 flex items-center">
                            <div className={`p-3 rounded-lg ${item.bg} flex-shrink-0`}>
                                <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <div className="ml-4 min-w-0">
                                <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
                                <p className={`text-xl font-bold ${item.highlight ? 'text-red-600' : 'text-gray-900'}`}>
                                    {item.value}
                                </p>
                                {item.subtext && (
                                    <p className={`text-[11px] font-semibold mt-0.5 ${item.highlight ? 'text-red-400' : 'text-gray-400'}`}>
                                        {item.subtext}
                                    </p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* ── Gráfica + Acciones Rápidas ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfica */}
                <Card className="lg:col-span-2">
                    <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand-500" />
                            <h3 className="text-base font-semibold text-gray-900">Ingresos — Últimos 7 Días</h3>
                        </div>
                        <Badge variant="success" className="text-[10px] font-black">Esta semana</Badge>
                    </div>
                    <CardBody className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }} dy={10}
                                />
                                <YAxis
                                    axisLine={false} tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 11 }}
                                    tickFormatter={(val) => `S/${val / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6', radius: 4 }}
                                    contentStyle={{
                                        borderRadius: '10px', border: 'none',
                                        boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.15)'
                                    }}
                                    formatter={(value) => [formatCurrency(value), 'Ingresos']}
                                />
                                <Bar dataKey="ingresos" radius={[6, 6, 0, 0]} barSize={36}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={index}
                                            fill={index === chartData.length - 1 ? '#16a34a' : '#86efac'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                {/* Acciones Rápidas */}
                <Card>
                    <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-500" />
                        <h3 className="text-base font-semibold text-gray-900">Acciones Rápidas</h3>
                    </div>
                    <CardBody className="p-3">
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={action.action}
                                    className={`
                                        flex flex-col items-center justify-center gap-1.5
                                        p-3 rounded-xl border ${action.border}
                                        bg-white ${action.bgHover}
                                        transition-all active:scale-95 hover:shadow-sm
                                        text-center group
                                    `}
                                >
                                    <div className={`p-2 rounded-lg bg-opacity-10 ${action.bgHover.replace('hover:', '')}`}>
                                        <action.icon className={`w-5 h-5 ${action.color}`} />
                                    </div>
                                    <span className={`text-xs font-bold ${action.color} leading-tight`}>
                                        {action.label}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-medium leading-none">
                                        {action.description}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Atajo de mora */}
                        {hasDelinquent && (
                            <button
                                onClick={() => navigate('/payments')}
                                className="mt-3 w-full flex items-center justify-between gap-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-xl px-3 py-2.5 text-xs font-bold transition-all animate-pulse hover:animate-none"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>{metrics?.total_delinquent_clients} clientes con mora</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* ── Panel de Créditos por Vencer ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <ExpiringLoansPanel
                        loans={expiringLoans}
                        isLoading={isLoadingExpiring}
                        navigate={navigate}
                    />
                </div>
            </div>

            {/* ── Resumen de rendimiento ───────────────────────────────────────── */}
            <Card className="bg-brand-700 text-white border-0 shadow-lg shadow-brand-200">
                <CardBody className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-brand-100 font-medium">Índice de Rendimiento del Día</p>
                                <p className="text-3xl font-black text-white">
                                    {metrics?.performance_index?.toFixed(1) || '0'}%
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 flex-wrap">
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{metrics?.total_active_loans || 0}</p>
                                <p className="text-xs text-brand-200 font-medium uppercase">Préstamos activos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{hasExpiring ? expiringLoans.length : 0}</p>
                                <p className="text-xs text-amber-300 font-medium uppercase">Por vencer</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{metrics?.total_delinquent_clients || 0}</p>
                                <p className="text-xs text-red-300 font-medium uppercase">En mora</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/reports')}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
                        >
                            Ver reportes <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Barra de rendimiento */}
                    <div className="mt-4">
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(metrics?.performance_index || 0, 100)}%` }}
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Modal de Nuevo Cliente */}
            <CreateClientModal
                isOpen={isCreateClientOpen}
                onClose={() => setIsCreateClientOpen(false)}
            />
        </div>
    );
}
