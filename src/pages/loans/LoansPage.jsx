import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getLoans, deleteLoan } from '../../api/loans';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EditLoanModal from './components/EditLoanModal';
import useUiStore from '../../store/uiStore';
import { Plus, Search, Eye, Edit, Trash2, Landmark } from 'lucide-react';

import { format } from 'date-fns';

const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

export default function LoansPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Estados para modales
    const [loanToEdit, setLoanToEdit] = useState(null);
    const [loanToDelete, setLoanToDelete] = useState(null);

    const { data: loans, isLoading, isError } = useQuery({
        queryKey: ['loans', searchTerm, statusFilter],
        queryFn: () => getLoans({ search: searchTerm, status: statusFilter }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            addToast('Préstamo eliminado correctamente', 'success');
            setLoanToDelete(null);
        },
        onError: (err) => {
            addToast(err.response?.data?.detail || 'No se puede eliminar este préstamo', 'error');
            setLoanToDelete(null);
        }
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return <Badge variant="success">Activo</Badge>;
            case 'PAID': return <Badge variant="neutral">Pagado</Badge>;
            case 'CANCELED': return <Badge variant="danger">Cancelado</Badge>;
            case 'REFINANCED': return <Badge variant="warning">Refinanciado</Badge>;
            default: return <Badge variant="neutral">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900">Préstamos</h1>
                    <p className="text-xs text-gray-400 mt-0.5 hidden md:block">Listado de créditos otorgados y su estatus.</p>
                </div>
                <Button onClick={() => navigate('/loans/new')} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Otorgar </span>Préstamo
                </Button>
            </div>

            {/* ── Filtros ──────────────────────────────────────────────────── */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar cliente..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 flex-shrink-0"
                >
                    <option value="">Todos</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="PAID">Pagados</option>
                    <option value="REFINANCED">Refinanciados</option>
                </select>
            </div>

            {/* ── Contenido ───────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="py-20"><Loader /></div>
            ) : isError ? (
                <div className="text-red-500 text-center py-10 text-sm">Error al cargar préstamos.</div>
            ) : loans?.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">Sin préstamos</p>
                </div>
            ) : (
                <>
                    {/* ── Vista MOBILE: Cards ──────────────────────────────── */}
                    <div className="md:hidden space-y-3">
                        {loans.map((loan) => {
                            const canModify = loan.paid_installments === 0 && loan.status === 'ACTIVE';
                            const progress = loan.installments > 0
                                ? Math.round((loan.paid_installments / loan.installments) * 100)
                                : 0;
                            return (
                                <div
                                    key={loan.id}
                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                                >
                                    <div className="flex items-stretch">
                                        {/* Franja lateral según estado */}
                                        <div className={`w-1.5 flex-shrink-0 ${
                                            loan.status === 'ACTIVE'     ? 'bg-green-500' :
                                            loan.status === 'DELINQUENT' ? 'bg-red-500' :
                                            loan.status === 'PAID'       ? 'bg-gray-400' :
                                            'bg-purple-500'
                                        }`} />

                                        <div className="p-4 flex-1">
                                            {/* Nombre + badge */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0">
                                                    <p className="font-black text-gray-900 uppercase leading-tight truncate">
                                                        {loan.client_name || `Cliente #${loan.client_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        #{loan.id} · {format(new Date(loan.start_date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                                {getStatusBadge(loan.status)}
                                            </div>

                                            {/* Montos */}
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Capital</p>
                                                    <p className="text-sm font-black text-gray-900">{formatCurrency(loan.principal_amount)}</p>
                                                </div>
                                                <div className="bg-brand-50 rounded-xl p-2.5 text-center">
                                                    <p className="text-[10px] text-brand-500 font-black uppercase tracking-widest">Cuota/día</p>
                                                    <p className="text-sm font-black text-brand-700">{formatCurrency(loan.daily_payment)}</p>
                                                </div>
                                            </div>

                                            {/* Barra de progreso */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                                                    <span>{loan.paid_installments}/{loan.installments} cuotas</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-500 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => navigate(`/loans/${loan.id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                </button>
                                                {canModify && (
                                                    <>
                                                        <button
                                                            onClick={() => setLoanToEdit(loan)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => setLoanToDelete(loan)}
                                                            className="flex items-center justify-center px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-center text-xs text-gray-400 pt-2">
                            {loans.length} préstamo{loans.length !== 1 ? 's' : ''} encontrado{loans.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* ── Vista DESKTOP: Tabla ─────────────────────────────── */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHead>
                                <TableHeaderCell className="w-10">Acciones</TableHeaderCell>
                                <TableHeaderCell>ID Ref</TableHeaderCell>
                                <TableHeaderCell>Fecha</TableHeaderCell>
                                <TableHeaderCell>Cliente</TableHeaderCell>
                                <TableHeaderCell>Monto (Capital)</TableHeaderCell>
                                <TableHeaderCell>Cuota / Día</TableHeaderCell>
                                <TableHeaderCell>Estado</TableHeaderCell>
                            </TableHead>
                            <TableBody>
                                {loans.map((loan) => (
                                    <TableRow key={loan.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <button title="Ver detalle" onClick={() => navigate(`/loans/${loan.id}`)}
                                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {loan.paid_installments === 0 && loan.status === 'ACTIVE' && (
                                                    <>
                                                        <button title="Editar" onClick={() => setLoanToEdit(loan)}
                                                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button title="Eliminar" onClick={() => setLoanToDelete(loan)}
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">#{loan.id}</TableCell>
                                        <TableCell>{format(new Date(loan.start_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{loan.client_name || `Cliente #${loan.client_id}`}</div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(loan.principal_amount)}</TableCell>
                                        <TableCell>
                                            <div className="text-sm font-bold">{formatCurrency(loan.daily_payment)} / día</div>
                                            <div className="text-xs text-gray-500">{loan.installments} cuotas · {(loan.interest_rate * 100).toFixed(0)}% interés</div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* ── Modales ──────────────────────────────────────────────────── */}
            <EditLoanModal isOpen={!!loanToEdit} onClose={() => setLoanToEdit(null)} loan={loanToEdit} />

            <Modal title="Eliminar Préstamo" isOpen={!!loanToDelete} onClose={() => setLoanToDelete(null)}>
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl mb-5">
                    <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">
                        <p className="font-bold mb-1">¿Eliminar el préstamo #{loanToDelete?.id}?</p>
                        <p>Cliente: <strong>{loanToDelete?.client_name || `#${loanToDelete?.client_id}`}</strong>{' '}
                        — Capital: <strong>{formatCurrency(loanToDelete?.principal_amount)}</strong></p>
                        <p className="mt-2">Se eliminará el préstamo y todo su cronograma de cuotas. <strong>No se puede deshacer.</strong></p>
                        <p className="mt-1 text-xs text-red-500">Solo permitido si no tiene cobros registrados.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setLoanToDelete(null)}>Cancelar</Button>
                    <Button variant="danger" fullWidth isLoading={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(loanToDelete?.id)}>
                        Sí, eliminar
                    </Button>
                </div>
            </Modal>
        </div>
    );
}


