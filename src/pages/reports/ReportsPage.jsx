import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    getIncomeByRange, getPortfolioSummary,
    getCashClose, getDashboardMetrics
} from '../../api/reports';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
    AreaChart, Area
} from 'recharts';
import {
    TrendingUp, TrendingDown, Banknote, AlertTriangle, BarChart3,
    Wallet, Users, CreditCard, Calendar, ChevronRight, Download,
    Landmark, Target, ArrowUpRight, ArrowDownRight, Minus,
    CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCur = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(v || 0);
const fmt2 = (v) => (v || 0).toFixed(2);

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
    income:   '#16a34a',
    expenses: '#ef4444',
    net:      '#2563eb',
    ACTIVE:      '#16a34a',
    DELINQUENT:  '#ef4444',
    PAID:        '#6b7280',
    REFINANCED:  '#8b5cf6',
};
const PIE_COLORS = ['#16a34a', '#ef4444', '#6b7280', '#8b5cf6', '#f59e0b'];

// ─── Selector de rango rápido ─────────────────────────────────────────────────
const RANGES = [
    { label: 'Hoy',        from: todayStr,      to: todayStr },
    { label: '7 días',     from: format(subDays(today, 6), 'yyyy-MM-dd'), to: todayStr },
    { label: '15 días',    from: format(subDays(today, 14), 'yyyy-MM-dd'), to: todayStr },
    { label: 'Este mes',   from: format(startOfMonth(today), 'yyyy-MM-dd'), to: todayStr },
    { label: 'Mes pasado', from: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd') },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'cashclose',  label: 'Cierre de Caja',   icon: Wallet },
    { id: 'income',     label: 'Ingresos vs Egresos', icon: BarChart3 },
    { id: 'portfolio',  label: 'Cartera',           icon: Landmark },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color = 'brand', trend }) {
    const colors = {
        green:  { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  val: 'text-green-700'  },
        red:    { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-600',    val: 'text-red-700'    },
        blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   val: 'text-blue-700'   },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', val: 'text-purple-700' },
        gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   icon: 'text-gray-600',   val: 'text-gray-700'   },
        brand:  { bg: 'bg-brand-50',  border: 'border-brand-200',  icon: 'text-brand-600',  val: 'text-brand-700'  },
    };
    const c = colors[color] || colors.brand;
    return (
        <div className={`${c.bg} ${c.border} border rounded-xl p-4`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
                    <p className={`text-2xl font-black ${c.val}`}>{value}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <div className={`p-2.5 rounded-xl ${c.bg.replace('50', '100')}`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
            </div>
            {trend !== undefined && (
                <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                     trend < 0 ? <ArrowDownRight className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    {trend > 0 ? '+' : ''}{fmt2(trend)}% vs ayer
                </div>
            )}
        </div>
    );
}

// ─── TAB 1: Cierre de Caja ────────────────────────────────────────────────────
function CashCloseTab() {
    const [date, setDate] = useState(todayStr);
    const { data, isLoading } = useQuery({
        queryKey: ['cashClose', date],
        queryFn: () => getCashClose(date),
    });

    if (isLoading) return <div className="py-20"><Loader /></div>;
    if (!data) return null;

    const isProfit = data.net_profit >= 0;

    return (
        <div className="space-y-5">
            {/* Selector de fecha */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 shadow-sm w-fit">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                    type="date"
                    value={date}
                    max={todayStr}
                    onChange={e => setDate(e.target.value)}
                    className="text-sm font-bold text-gray-700 outline-none bg-transparent"
                />
            </div>

            {/* KPIs principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Total Cobrado"  value={formatCur(data.total_income)}   color="green"  icon={TrendingUp}   sub={`${data.payment_count} cobros`} />
                <KpiCard label="Total Egresos"  value={formatCur(data.total_expenses)} color="red"    icon={TrendingDown} sub={`${data.expense_count} gastos`} />
                <KpiCard
                    label="Utilidad Neta"
                    value={formatCur(data.net_profit)}
                    color={isProfit ? 'green' : 'red'}
                    icon={isProfit ? ArrowUpRight : ArrowDownRight}
                    sub={isProfit ? 'Día positivo' : 'Día negativo'}
                />
                <KpiCard label="Préstamos Cobrados" value={data.unique_loans_paid} color="blue" icon={CreditCard} sub="préstamos únicos" />
            </div>

            {/* Desglose visual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Barra Ingresos vs Egresos */}
                <Card>
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Resumen del Día</h3>
                    </div>
                    <CardBody className="p-5 space-y-4">
                        {/* Ingresos */}
                        <div>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-bold text-green-700">Ingresos</span>
                                <span className="font-black text-green-700">{formatCur(data.total_income)}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                            </div>
                        </div>
                        {/* Egresos */}
                        <div>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-bold text-red-600">Egresos</span>
                                <span className="font-black text-red-600">{formatCur(data.total_expenses)}</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: data.total_income > 0 ? `${Math.min((data.total_expenses / data.total_income) * 100, 100)}%` : '0%' }}
                                />
                            </div>
                        </div>
                        {/* Utilidad */}
                        <div className={`border-t pt-3 flex justify-between items-center`}>
                            <span className="text-sm font-black uppercase tracking-widest text-gray-600">Utilidad Neta</span>
                            <span className={`text-xl font-black ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                {formatCur(data.net_profit)}
                            </span>
                        </div>

                        {/* Egresos por categoría */}
                        {Object.keys(data.expenses_by_category).length > 0 && (
                            <div className="border-t pt-3 space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Egresos por Categoría</p>
                                {Object.entries(data.expenses_by_category).map(([cat, amt]) => (
                                    <div key={cat} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{cat}</span>
                                        <span className="font-bold text-red-600">{formatCur(amt)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Listado de pagos del día */}
                <Card>
                    <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                            Cobros del Día ({data.payments.length})
                        </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {data.payments.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-sm">Sin cobros este día</div>
                        ) : (
                            data.payments.map(p => (
                                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">Préstamo #{p.loan_id}</p>
                                            <p className="text-xs text-gray-400">{p.time} · {p.type}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-green-700">{formatCur(p.amount)}</p>
                                </div>
                            ))
                        )}
                    </div>
                    {data.expenses_detail.length > 0 && (
                        <>
                            <div className="px-5 py-3 border-t border-gray-100 bg-red-50/40">
                                <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-2">
                                    Egresos del Día ({data.expenses_detail.length})
                                </p>
                                {data.expenses_detail.map(e => (
                                    <div key={e.id} className="flex items-center justify-between py-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{e.description}</p>
                                            <p className="text-xs text-gray-400">{e.category}</p>
                                        </div>
                                        <p className="text-sm font-bold text-red-600">-{formatCur(e.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}

// ─── TAB 2: Ingresos vs Egresos ───────────────────────────────────────────────
function IncomeTab() {
    const [rangeIdx, setRangeIdx] = useState(1); // default: 7 días
    const [customFrom, setCustomFrom] = useState('');
    const [customTo,   setCustomTo]   = useState('');
    const [useCustom, setUseCustom]   = useState(false);

    const activeRange = useCustom
        ? { from: customFrom, to: customTo }
        : RANGES[rangeIdx];

    const { data, isLoading } = useQuery({
        queryKey: ['incomeRange', activeRange.from, activeRange.to],
        queryFn: () => getIncomeByRange(activeRange.from, activeRange.to),
        enabled: !!(activeRange.from && activeRange.to),
    });

    const series = data?.series || [];

    return (
        <div className="space-y-5">
            {/* Selector de rango */}
            <div className="flex flex-wrap gap-2 items-center">
                {RANGES.map((r, i) => (
                    <button
                        key={r.label}
                        onClick={() => { setRangeIdx(i); setUseCustom(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            !useCustom && rangeIdx === i
                                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
                <div className="flex items-center gap-2 ml-2">
                    <input type="date" max={todayStr} value={customFrom} onChange={e => { setCustomFrom(e.target.value); setUseCustom(true); }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-400" />
                    <span className="text-gray-400 text-xs">—</span>
                    <input type="date" max={todayStr} value={customTo} onChange={e => { setCustomTo(e.target.value); setUseCustom(true); }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-400" />
                </div>
            </div>

            {isLoading ? <div className="py-20"><Loader /></div> : data && (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Total Cobrado"  value={formatCur(data.total_income)}   color="green"  icon={TrendingUp}   sub={`${data.total_payments} cobros`} />
                        <KpiCard label="Total Egresos"  value={formatCur(data.total_expenses)} color="red"    icon={TrendingDown} />
                        <KpiCard label="Utilidad Neta"  value={formatCur(data.net_profit)}     color={data.net_profit >= 0 ? 'green' : 'red'} icon={Target} />
                        <KpiCard label="Promedio Diario" value={formatCur(data.total_income / (series.length || 1))} color="blue" icon={BarChart3} sub="por día" />
                    </div>

                    {/* Gráfica de barras apiladas */}
                    <Card>
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                Ingresos vs Egresos por Día
                            </h3>
                        </div>
                        <CardBody className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={series} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)' }}
                                        formatter={(value, name) => [formatCur(value), name === 'income' ? 'Ingresos' : 'Egresos']}
                                    />
                                    <Bar dataKey="income"   name="income"   fill="#16a34a" radius={[4,4,0,0]} barSize={series.length > 20 ? 12 : 28} />
                                    <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[4,4,0,0]} barSize={series.length > 20 ? 12 : 28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>

                    {/* Gráfica de área acumulada */}
                    <Card>
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                                Tendencia Acumulada de Ingresos
                            </h3>
                        </div>
                        <CardBody className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={series} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.15)' }}
                                        formatter={v => [formatCur(v), 'Acumulado']}
                                    />
                                    <Area type="monotone" dataKey="accumulated" stroke="#16a34a" strokeWidth={2.5}
                                        fill="url(#incomeGrad)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardBody>
                    </Card>
                </>
            )}
        </div>
    );
}

// ─── TAB 3: Cartera ───────────────────────────────────────────────────────────
function PortfolioTab() {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['portfolioSummary'],
        queryFn: getPortfolioSummary,
    });

    if (isLoading) return <div className="py-20"><Loader /></div>;
    if (!data) return null;

    const distData = Object.entries(data.status_distribution).map(([name, value]) => ({ name, value }));
    const statusLabel = { ACTIVE: 'Activo', DELINQUENT: 'En Mora', PAID: 'Pagado', REFINANCED: 'Refinanciado' };

    return (
        <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Préstamos Activos" value={data.total_active_loans}       color="green" icon={CreditCard} />
                <KpiCard label="Capital Prestado"  value={formatCur(data.total_principal)}color="blue"  icon={Landmark}  sub="principal activo" />
                <KpiCard label="Por Cobrar"         value={formatCur(data.total_to_collect)} color="brand" icon={Banknote} />
                <KpiCard label="Préstamos en Mora" value={data.total_overdue_loans}       color="red"   icon={AlertTriangle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Pie chart distribución */}
                <Card className="lg:col-span-1">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Estado de Cartera</h3>
                    </div>
                    <CardBody className="h-56 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distData}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, value }) => `${statusLabel[name] || name}: ${value}`}
                                    labelLine={false}
                                >
                                    {distData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[entry.name] || PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, statusLabel[name] || name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                {/* Top deudores */}
                <Card className="lg:col-span-2">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Top Deudores por Saldo Pendiente</h3>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                        {data.top_debtors.map((d, idx) => (
                            <div
                                key={d.loan_id}
                                onClick={() => navigate(`/loans/${d.loan_id}`)}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer group transition-colors"
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                                    idx < 3 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                                }`}>{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-900 truncate uppercase">{d.client_name}</p>
                                        {d.status === 'DELINQUENT' && (
                                            <span className="text-[10px] bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded-full">MORA</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${d.progress_pct}%` }} />
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold flex-shrink-0">{d.progress_pct}%</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-black text-gray-900">{formatCur(d.pending)}</p>
                                    <p className="text-[10px] text-gray-400">pendiente</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Tabla de mora */}
            {data.overdue_loans.length > 0 && (
                <Card>
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-red-600">
                            Préstamos en Mora ({data.overdue_loans.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-5 py-3 text-left text-xs font-black uppercase text-gray-500">Cliente</th>
                                    <th className="px-5 py-3 text-left text-xs font-black uppercase text-gray-500">Teléfono</th>
                                    <th className="px-5 py-3 text-right text-xs font-black uppercase text-gray-500">Cuotas vencidas</th>
                                    <th className="px-5 py-3 text-right text-xs font-black uppercase text-gray-500">Monto Mora</th>
                                    <th className="px-5 py-3 text-right text-xs font-black uppercase text-gray-500">Cuota Diaria</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.overdue_loans.map(l => (
                                    <tr
                                        key={l.loan_id}
                                        onClick={() => navigate(`/loans/${l.loan_id}`)}
                                        className="hover:bg-red-50/40 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3 font-bold text-gray-900 uppercase">{l.client_name}</td>
                                        <td className="px-5 py-3 text-gray-500">{l.phone || '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="bg-red-100 text-red-700 font-black text-xs px-2 py-0.5 rounded-full">
                                                {l.overdue_count} cuota{l.overdue_count > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-black text-red-700">{formatCur(l.overdue_amount)}</td>
                                        <td className="px-5 py-3 text-right text-gray-600">{formatCur(l.daily_payment)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('cashclose');

    return (
        <div className="space-y-5">
            <PageHeader
                title="Reportes y Analítica"
                description="Visión financiera completa: cierre de caja, tendencias de ingresos y estado de cartera."
                actions={
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-600 border border-gray-200 hover:border-brand-300 px-3 py-2 rounded-xl bg-white transition-all"
                    >
                        <Download className="w-3.5 h-3.5" /> Imprimir
                    </button>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? 'bg-white text-brand-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Contenido por tab */}
            {activeTab === 'cashclose' && <CashCloseTab />}
            {activeTab === 'income'    && <IncomeTab />}
            {activeTab === 'portfolio' && <PortfolioTab />}
        </div>
    );
}