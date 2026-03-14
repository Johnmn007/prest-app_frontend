import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCollectionRoadmap, registerPayment } from '../../api/payments';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import useUiStore from '../../store/uiStore';
import {
    Search, ChevronRight, User, Phone, AlertTriangle, CheckCircle2,
    Clock, TrendingDown, Banknote, IdCard, DollarSign, ChevronDown,
    ChevronUp, Wallet, Target, RefreshCw, Check, AlertCircle, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCur = (val) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

// ─── Modal rápido de cobro ────────────────────────────────────────────────────
function QuickPaymentModal({ isOpen, onClose, item, onConfirm, isLoading }) {
    const [amount, setAmount] = useState('');

    // Pre-rellenar con la cuota diaria cuando se abre
    const handleOpen = () => setAmount((item?.daily_payment || 0).toFixed(2));

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) return;
        onConfirm(parsed);
    };

    if (!item) return null;

    const totalToCollect = (item.today_amount || item.daily_payment) + (item.overdue_amount || 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar Cobro"
            size="sm"
        >
            {/* Header cliente */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-black text-lg flex-shrink-0">
                    {item.client_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-black text-gray-900 uppercase leading-tight">{item.client_name}</p>
                    <p className="text-xs text-gray-400 font-medium">Préstamo #{item.loan_id}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Resumen */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cuota Diaria</p>
                        <p className="text-lg font-black text-gray-900">{formatCur(item.daily_payment)}</p>
                    </div>
                    {item.overdue_count > 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">En Mora</p>
                            <p className="text-lg font-black text-red-700">{formatCur(item.overdue_amount)}</p>
                        </div>
                    ) : (
                        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">Deuda Total</p>
                            <p className="text-lg font-black text-brand-700">{formatCur(item.total_pending)}</p>
                        </div>
                    )}
                </div>

                {/* Alerta de mora */}
                {item.overdue_count > 0 && (
                    <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-700 font-medium">
                            {item.overdue_count} cuota{item.overdue_count > 1 ? 's' : ''} en mora.
                            El sistema las saldará de más antigua a más reciente.
                        </p>
                    </div>
                )}

                {/* Input monto */}
                <div>
                    <Input
                        label="Monto a Cobrar (S/)"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        icon={DollarSign}
                        required
                        autoFocus
                    />
                    {/* Accesos rápidos */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setAmount((item.daily_payment || 0).toFixed(2))}
                            className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-colors"
                        >
                            1 cuota ({formatCur(item.daily_payment)})
                        </button>
                        {item.overdue_count > 0 && (
                            <button
                                type="button"
                                onClick={() => setAmount(totalToCollect.toFixed(2))}
                                className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors"
                            >
                                Cuota + mora ({formatCur(totalToCollect)})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setAmount((item.total_pending || 0).toFixed(2))}
                            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                        >
                            Saldar todo
                        </button>
                    </div>
                </div>

                <p className="text-[11px] text-gray-400 italic">
                    💡 El abono se distribuye desde la cuota más antigua pendiente.
                </p>

                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" fullWidth onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="primary" fullWidth isLoading={isLoading} type="submit">
                        <Check className="w-4 h-4 mr-1.5" /> Registrar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Tarjeta de colección ─────────────────────────────────────────────────────
function CollectionCard({ item, onPay, isPaid }) {
    const navigate = useNavigate();
    const isOverdue = item.overdue_count > 0;
    const isLateHistory = item.late_paid_count > 0 && item.overdue_count === 0;

    return (
        <Card
            className={`transition-all shadow-sm ${
                isPaid
                    ? 'opacity-60 border-green-200 bg-green-50/40'
                    : isOverdue
                        ? 'border-red-200 hover:border-red-400 hover:shadow-md'
                        : 'hover:border-brand-400 hover:shadow-md'
            }`}
        >
            <CardBody className="p-0">
                <div className="flex items-stretch">
                    {/* Franja lateral */}
                    <div className={`w-1.5 rounded-l-xl flex-shrink-0 ${
                        isPaid ? 'bg-green-400' :
                        isOverdue ? 'bg-red-500' :
                        isLateHistory ? 'bg-orange-400' :
                        'bg-brand-500'
                    }`} />

                    <div className="p-4 flex-1 min-w-0">
                        {/* Fila superior */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div
                                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                onClick={() => navigate(`/loans/${item.loan_id}`)}
                            >
                                <div className={`p-2.5 rounded-full flex-shrink-0 ${
                                    isPaid ? 'bg-green-100' :
                                    isOverdue ? 'bg-red-100' : 'bg-brand-50'
                                }`}>
                                    {isPaid
                                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        : <User className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-brand-600'}`} />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-lg text-gray-900 uppercase leading-tight truncate">
                                        {item.client_name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-0.5 text-gray-400 text-xs font-semibold flex-wrap">
                                        {item.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {item.phone}
                                            </span>
                                        )}
                                        {item.client_dni && (
                                            <span className="flex items-center gap-1">
                                                <IdCard className="w-3 h-3" /> {item.client_dni}
                                            </span>
                                        )}
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500">
                                            #{item.loan_id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Badges + botón */}
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                {isPaid ? (
                                    <Badge variant="success" className="text-[10px] px-2.5 py-1 font-black">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        COBRADO HOY
                                    </Badge>
                                ) : item.has_today_installment ? (
                                    <Badge variant="success" className="text-[10px] px-2.5 py-1 font-black">
                                        <Clock className="w-3 h-3 mr-1" /> CUOTA HOY
                                    </Badge>
                                ) : (
                                    <Badge variant="neutral" className="text-[10px] px-2.5 py-1 font-black">
                                        Sin cuota programada
                                    </Badge>
                                )}
                                {isLateHistory && (
                                    <Badge variant="warning" className="text-[10px] px-2.5 py-1 font-black">
                                        <TrendingDown className="w-3 h-3 mr-1" /> {item.late_paid_count} tardíos
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Fila de montos */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Cuota Diaria</p>
                                <p className={`text-xl font-black ${isPaid ? 'text-green-700' : isOverdue ? 'text-gray-700' : 'text-brand-700'}`}>
                                    {formatCur(item.daily_payment)}
                                </p>
                            </div>

                            {isOverdue && !isPaid && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center animate-pulse">
                                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> MORA
                                    </p>
                                    <p className="text-xl font-black text-red-700">{item.overdue_count} cuota{item.overdue_count > 1 ? 's' : ''}</p>
                                    <p className="text-xs text-red-600 font-bold">{formatCur(item.overdue_amount)}</p>
                                </div>
                            )}

                            {isPaid && item.today_paid_amount > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">
                                        Cobrado hoy
                                    </p>
                                    <p className="text-xl font-black text-green-700">{formatCur(item.today_paid_amount)}</p>
                                    {item.overdue_count > 0 && (
                                        <p className="text-[10px] text-orange-500 font-bold mt-0.5">
                                            Aún {item.overdue_count} cuota{item.overdue_count > 1 ? 's' : ''} morosa{item.overdue_count > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Deuda Total</p>
                                    <p className="text-xl font-black text-gray-800">{formatCur(item.total_pending)}</p>
                                </div>

                                {!isPaid && (
                                    <button
                                        onClick={() => onPay(item)}
                                        className="ml-2 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-3 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                                        title="Registrar cobro"
                                    >
                                        <Zap className="w-3.5 h-3.5" />
                                        Cobrar
                                    </button>
                                )}

                                <ChevronRight
                                    className="text-gray-300 w-4 h-4 hidden md:block cursor-pointer hover:text-brand-400 transition-colors"
                                    onClick={() => navigate(`/loans/${item.loan_id}`)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

// ─── Página principal de cobranza ─────────────────────────────────────────────
export default function DailyCollectionPage() {
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    const [search, setSearch] = useState('');
    const [payingItem, setPayingItem] = useState(null);     // item a cobrar
    const [showPaid, setShowPaid] = useState(false);         // toggle sección cobrados

    const { data: roadmap, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['collection_roadmap'],
        queryFn: getCollectionRoadmap,
        refetchInterval: 120000,    // refresca cada 2 min
    });

    const payMutation = useMutation({
        mutationFn: ({ loan_id, amount }) => registerPayment({ loan_id, payment_amount: amount }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['collection_roadmap'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_metrics'] });
            addToast('✅ Cobro registrado correctamente', 'success');
            setPayingItem(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.detail || 'Error al registrar el cobro', 'error');
        }
    });

    const handleConfirmPayment = (amount) => {
        if (!payingItem) return;
        payMutation.mutate({ loan_id: payingItem.loan_id, amount });
    };

    // ── Filtros ───────────────────────────────────────────────────────────────
    const filtered = (roadmap || []).filter(r =>
        r.client_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.client_dni && r.client_dni.includes(search))
    );

    const pendingItems = filtered.filter(r => !r.today_paid);
    const paidItems    = filtered.filter(r => r.today_paid);

    // Sub-grupos de pendientes
    const overdueItems   = pendingItems.filter(r => r.overdue_count > 0);
    const regularItems   = pendingItems.filter(r => r.overdue_count === 0);

    // ── Estadísticas de progreso ──────────────────────────────────────────────
    const totalCount   = filtered.length;
    const paidCount    = paidItems.length;
    const pendingCount = pendingItems.length;
    const progress     = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const totalCollectedToday = paidItems.reduce((s, i) => s + i.today_paid_amount, 0);

    const today = new Date();

    if (isLoading) return <div className="mt-20"><Loader size="xl" /></div>;
    if (isError) return <div className="text-red-500 text-center py-20">Error al cargar la ruta de cobranza.</div>;

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <PageHeader
                    title="Ruta de Cobranza"
                    description={`Cobros del ${format(today, "EEEE d 'de' MMMM", { locale: es })}.`}
                />
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 font-bold transition-colors"
                    title="Actualizar lista"
                >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Buscador */}
            <Input
                placeholder="Buscar cliente por nombre o DNI..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="shadow-sm"
            />

            {/* ── Barra de progreso ────────────────────────────────────────────── */}
            {roadmap && roadmap.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    {/* Estadísticas */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{totalCount}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase">Total</p>
                        </div>
                        <div className="text-center">
                            <p className={`text-2xl font-black ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                {pendingCount}
                            </p>
                            <p className="text-[10px] text-orange-400 font-black uppercase">Pendientes</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-green-600">{paidCount}</p>
                            <p className="text-[10px] text-green-500 font-black uppercase">Cobrados</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-brand-700 leading-none mt-1">
                                {formatCur(totalCollectedToday)}
                            </p>
                            <p className="text-[10px] text-brand-500 font-black uppercase">Recaudado</p>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-gray-500">Progreso del día</span>
                            <span className="font-black text-brand-700">{progress}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {progress === 100 && (
                            <p className="text-center text-xs font-black text-green-600 mt-1.5">
                                🎉 ¡Ruta completada! Todos los cobros del día están registrados.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── SECCIÓN: Pendientes con mora ─────────────────────────────────── */}
            {overdueItems.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-red-500">
                            ⚡ Prioridad — Con Mora ({overdueItems.length})
                        </h2>
                    </div>
                    {overdueItems.map(item => (
                        <CollectionCard
                            key={item.loan_id}
                            item={item}
                            isPaid={false}
                            onPay={setPayingItem}
                        />
                    ))}
                </div>
            )}

            {/* ── SECCIÓN: Pendientes sin mora ─────────────────────────────────── */}
            {regularItems.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-brand-600">
                            Pendientes de Cobro ({regularItems.length})
                        </h2>
                    </div>
                    {regularItems.map(item => (
                        <CollectionCard
                            key={item.loan_id}
                            item={item}
                            isPaid={false}
                            onPay={setPayingItem}
                        />
                    ))}
                </div>
            )}

            {/* ── SECCIÓN: Ya cobrados hoy (colapsable) ────────────────────────── */}
            {paidItems.length > 0 && (
                <div className="space-y-3">
                    <button
                        onClick={() => setShowPaid(v => !v)}
                        className="flex items-center gap-2 w-full text-left group"
                    >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-green-600 flex-1">
                            Cobrados Hoy ({paidItems.length})
                            <span className="ml-2 font-normal normal-case text-green-500 text-[10px]">
                                — {formatCur(totalCollectedToday)} recaudados
                            </span>
                        </h2>
                        {showPaid
                            ? <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                            : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                        }
                    </button>

                    {showPaid && (
                        <div className="space-y-3">
                            {paidItems.map(item => (
                                <CollectionCard
                                    key={item.loan_id}
                                    item={item}
                                    isPaid={true}
                                    onPay={setPayingItem}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Estado vacío ─────────────────────────────────────────────────── */}
            {pendingItems.length === 0 && paidItems.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">¡Sin cobros pendientes por hoy!</p>
                    <p className="text-gray-400 text-xs mt-1">Todos los clientes están al día o no tienen cuota programada para hoy.</p>
                </div>
            )}

            {pendingItems.length === 0 && paidItems.length > 0 && (
                <div className="text-center py-6 bg-green-50 rounded-xl border-2 border-dashed border-green-200">
                    <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-black uppercase tracking-widest text-sm">¡Ruta completada! 🎉</p>
                    <p className="text-green-600 text-xs mt-1 font-medium">
                        Total recaudado hoy: <strong>{formatCur(totalCollectedToday)}</strong>
                    </p>
                </div>
            )}

            {/* ── Modal de cobro rápido ─────────────────────────────────────────── */}
            <QuickPaymentModal
                isOpen={!!payingItem}
                onClose={() => setPayingItem(null)}
                item={payingItem}
                onConfirm={handleConfirmPayment}
                isLoading={payMutation.isPending}
            />
        </div>
    );
}