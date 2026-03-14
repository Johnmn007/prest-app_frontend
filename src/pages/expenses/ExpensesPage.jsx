import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExpenses, getDailySummary, createExpense, updateExpense, deleteExpense } from '../../api/expenses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Card, { CardBody } from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import useUiStore from '../../store/uiStore';
import {
    Plus, Trash2, Edit, TrendingDown, Car, Wrench, FileText,
    LayoutGrid, DollarSign, Calendar, AlignLeft, Tag, RefreshCw,
    ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Constantes de categorías ─────────────────────────────────────────────────
const CATEGORIES = [
    { value: 'TRANSPORTE',     label: '🚗 Transporte',     color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200'  },
    { value: 'MANTENIMIENTO',  label: '🔧 Mantenimiento',  color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { value: 'ADMINISTRATIVO', label: '📋 Administrativo', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { value: 'VARIOS',         label: '📦 Varios',         color: 'text-gray-600',  bg: 'bg-gray-50',  border: 'border-gray-200'  },
];

const getCategoryMeta = (value) =>
    CATEGORIES.find(c => c.value === value) || CATEGORIES[3];

const formatCur = (val) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

// ─── Modal de creación / edición ──────────────────────────────────────────────
function ExpenseFormModal({ isOpen, onClose, expenseToEdit = null, onSave, isLoading }) {
    const isEdit = !!expenseToEdit;
    const today = new Date().toISOString().split('T')[0];

    const [form, setForm] = useState({
        description: expenseToEdit?.description || '',
        amount: expenseToEdit?.amount || '',
        category: expenseToEdit?.category || 'VARIOS',
        notes: expenseToEdit?.notes || '',
        date: expenseToEdit?.date || today,
    });
    const [error, setError] = useState('');

    // Resetear form cuando cambia el egreso a editar
    const handleOpen = () => {
        setForm({
            description: expenseToEdit?.description || '',
            amount: expenseToEdit?.amount || '',
            category: expenseToEdit?.category || 'VARIOS',
            notes: expenseToEdit?.notes || '',
            date: expenseToEdit?.date || today,
        });
        setError('');
    };

    const handleChange = (e) =>
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!form.description.trim()) return setError('La descripción es requerida.');
        if (!form.amount || parseFloat(form.amount) <= 0) return setError('El monto debe ser mayor a cero.');
        onSave({ ...form, amount: parseFloat(form.amount) });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar Egreso' : 'Registrar Nuevo Egreso'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Selector visual de categoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                                className={`
                                    flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all
                                    ${form.category === cat.value
                                        ? `${cat.bg} ${cat.border} ${cat.color} shadow-sm ring-1 ring-offset-0 ring-current`
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }
                                `}
                            >
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <Input
                    label="Descripción del gasto"
                    name="description"
                    placeholder="Ej. Parchado de llanta delantera"
                    icon={AlignLeft}
                    required
                    value={form.description}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Monto (S/)"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        icon={DollarSign}
                        required
                        value={form.amount}
                        onChange={handleChange}
                    />
                    <Input
                        label="Fecha del gasto"
                        name="date"
                        type="date"
                        icon={Calendar}
                        required
                        value={form.date}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nota adicional <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                        name="notes"
                        rows={2}
                        placeholder="Detalle extra, número de factura, etc."
                        value={form.notes}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400
                            focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                        {isEdit ? 'Guardar Cambios' : 'Registrar Egreso'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Página principal de Egresos ──────────────────────────────────────────────
export default function ExpensesPage() {
    const queryClient = useQueryClient();
    const addToast = useUiStore(s => s.addToast);

    // Mes en vista (navegación)
    const [viewMonth, setViewMonth] = useState(new Date());
    const [categoryFilter, setCategoryFilter] = useState('');

    // Modales
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState(null);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const dateFrom = format(startOfMonth(viewMonth), 'yyyy-MM-dd');
    const dateTo   = format(endOfMonth(viewMonth),   'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Queries
    const { data: expenses = [], isLoading, isError } = useQuery({
        queryKey: ['expenses', dateFrom, dateTo, categoryFilter],
        queryFn: () => getExpenses({ date_from: dateFrom, date_to: dateTo, category: categoryFilter || undefined }),
    });

    const { data: summary } = useQuery({
        queryKey: ['expense_summary', todayStr],
        queryFn: () => getDailySummary(todayStr),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense_summary'] });
            addToast('✅ Egreso registrado correctamente', 'success');
            setIsFormOpen(false);
        },
        onError: (err) => addToast(err.response?.data?.detail || 'Error al registrar egreso', 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: updateExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense_summary'] });
            addToast('✅ Egreso actualizado', 'success');
            setExpenseToEdit(null);
        },
        onError: (err) => addToast(err.response?.data?.detail || 'Error al actualizar', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense_summary'] });
            addToast('🗑️ Egreso eliminado', 'success');
            setExpenseToDelete(null);
        },
        onError: (err) => addToast(err.response?.data?.detail || 'Error al eliminar', 'error'),
    });

    const handleSave = (form) => {
        if (expenseToEdit) {
            updateMutation.mutate({ id: expenseToEdit.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    // Total del mes filtrado
    const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

    // Agrupado por categoría para el mes
    const byCategory = {};
    expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Control de Egresos"
                description="Registro y seguimiento de gastos operativos diarios."
                actions={
                    <Button onClick={() => { setExpenseToEdit(null); setIsFormOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Nuevo Egreso
                    </Button>
                }
            />

            {/* ── Resumen del día ─────────────────────────────────────────────── */}
            {summary && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">
                            Resumen de Hoy — {format(new Date(), "d 'de' MMMM", { locale: es })}
                        </h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {/* Total */}
                        <div className="col-span-2 sm:col-span-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Total Hoy</p>
                            <p className="text-2xl font-black text-red-700">{formatCur(summary.total)}</p>
                            <p className="text-xs text-red-400 mt-1">{summary.count} egreso{summary.count !== 1 ? 's' : ''}</p>
                        </div>

                        {/* Por categoría */}
                        {CATEGORIES.map(cat => {
                            const amt = summary.by_category?.[cat.value] || 0;
                            return (
                                <div
                                    key={cat.value}
                                    className={`${cat.bg} border ${cat.border} rounded-xl p-4 text-center`}
                                >
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${cat.color} mb-1`}>
                                        {cat.label}
                                    </p>
                                    <p className={`text-xl font-black ${amt > 0 ? cat.color : 'text-gray-300'}`}>
                                        {formatCur(amt)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Filtros y navegación de mes ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                {/* Navegación mes */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                    <button
                        onClick={() => setViewMonth(m => subMonths(m, 1))}
                        className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-gray-800 min-w-[140px] text-center capitalize">
                        {format(viewMonth, "MMMM yyyy", { locale: es })}
                    </span>
                    <button
                        onClick={() => setViewMonth(m => addMonths(m, 1))}
                        className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        disabled={format(viewMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
                    >
                        <ChevronRight className="w-4 h-4 disabled:opacity-30" />
                    </button>
                </div>

                {/* Filtro categoría */}
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                    <Select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        options={[
                            { value: '', label: 'Todas las categorías' },
                            ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))
                        ]}
                    />
                </div>

                {/* Total del mes */}
                <div className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-center shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Total {format(viewMonth, 'MMMM', { locale: es })}
                    </p>
                    <p className="text-xl font-black">{formatCur(monthTotal)}</p>
                </div>
            </div>

            {/* ── Lista de egresos ─────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="py-16"><Loader /></div>
            ) : isError ? (
                <div className="text-red-500 text-center py-10">Error al cargar los egresos.</div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <TrendingDown className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Sin egresos registrados</p>
                    <p className="text-gray-400 text-xs mt-1">
                        No hay gastos registrados para este período.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {expenses.map((expense) => {
                            const cat = getCategoryMeta(expense.category);
                            return (
                                <div
                                    key={expense.id}
                                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                                >
                                    {/* Ícono de categoría */}
                                    <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-lg ${cat.bg} border ${cat.border}`}>
                                        {expense.category === 'TRANSPORTE'     ? '🚗' :
                                         expense.category === 'MANTENIMIENTO'  ? '🔧' :
                                         expense.category === 'ADMINISTRATIVO' ? '📋' : '📦'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {expense.description}
                                            </p>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} border ${cat.border}`}>
                                                {cat.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(parseISO(expense.date), "d MMM yyyy", { locale: es })}
                                            </span>
                                            {expense.notes && (
                                                <span className="truncate max-w-xs italic">
                                                    "{expense.notes}"
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Monto */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-base font-black text-red-600">
                                            -{formatCur(expense.amount)}
                                        </p>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={() => { setExpenseToEdit(expense); setIsFormOpen(true); }}
                                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setExpenseToDelete(expense)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer con total */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">
                            {expenses.length} egreso{expenses.length !== 1 ? 's' : ''} en este período
                        </span>
                        <span className="text-sm font-black text-red-700">
                            Total: {formatCur(monthTotal)}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Modal formulario ─────────────────────────────────────────────── */}
            <ExpenseFormModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setExpenseToEdit(null); }}
                expenseToEdit={expenseToEdit}
                onSave={handleSave}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {/* ── Modal confirmar eliminación ──────────────────────────────────── */}
            <Modal
                title="Eliminar Egreso"
                isOpen={!!expenseToDelete}
                onClose={() => setExpenseToDelete(null)}
                size="sm"
            >
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl mb-5">
                    <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                        <p className="font-bold mb-1">¿Eliminar este egreso?</p>
                        <p className="font-medium">{expenseToDelete?.description}</p>
                        <p className="text-red-600 font-black mt-1">{formatCur(expenseToDelete?.amount)}</p>
                        <p className="mt-2 text-xs text-red-500">Esta acción no se puede deshacer.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setExpenseToDelete(null)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        fullWidth
                        isLoading={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(expenseToDelete?.id)}
                    >
                        Sí, eliminar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
