import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchLoansForRefinance } from '../../api/refinancing';
import Input from '../../components/ui/Input';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { Search, RefreshCw, Landmark } from 'lucide-react';

const formatCurrency = (val) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

const calcPending = (loan) =>
    Math.max(0, loan.total_amount - loan.paid_installments * loan.daily_payment);

export default function RefinancingPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { data: loans, isLoading, isError } = useQuery({
        queryKey: ['refinance_loans_search', debouncedSearch],
        queryFn: () => searchLoansForRefinance(debouncedSearch),
        enabled: debouncedSearch.length > 0,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setDebouncedSearch(searchTerm);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900">Refinanciamiento</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                    Busca un préstamo activo para reestructurar la deuda por mora o renovación.
                </p>
            </div>

            {/* ── Buscador ─────────────────────────────────────────────────── */}
            <form onSubmit={handleSearch}>
                <div className="flex gap-2 items-center">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por cliente o ID de préstamo..."
                            icon={Search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={!searchTerm}
                        className="flex-shrink-0"
                    >
                        <Search className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Buscar</span>
                        <span className="sm:hidden">Ir</span>
                    </Button>
                </div>
            </form>

            {/* ── Resultados ───────────────────────────────────────────────── */}
            {debouncedSearch && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 text-sm">
                            Resultados para <span className="text-brand-600">"{debouncedSearch}"</span>
                        </h3>
                        {loans && loans.length > 0 && (
                            <span className="text-xs text-gray-400 font-bold">{loans.length} encontrado{loans.length !== 1 ? 's' : ''}</span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="py-10"><Loader /></div>
                    ) : isError ? (
                        <div className="text-red-500 text-center py-6 text-sm">Error al realizar la búsqueda.</div>
                    ) : !loans || loans.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-bold">Sin préstamos activos para ese criterio.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Vista MOBILE: Cards ───────────────────────── */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {loans.map((loan) => {
                                    const pending = calcPending(loan);
                                    const progress = loan.installments > 0
                                        ? Math.round((loan.paid_installments / loan.installments) * 100)
                                        : 0;
                                    return (
                                        <div key={loan.id} className="p-4">
                                            {/* Nombre + ID */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <p className="font-black text-gray-900 uppercase leading-tight">
                                                        {loan.client_name || `Cliente #${loan.client_id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Préstamo #{loan.id}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">
                                                    ACTIVO
                                                </span>
                                            </div>

                                            {/* Montos en grid */}
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Monto original</p>
                                                    <p className="text-sm font-black text-gray-800">{formatCurrency(loan.principal_amount)}</p>
                                                </div>
                                                <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-center">
                                                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Saldo pendiente</p>
                                                    <p className="text-sm font-black text-red-700">{formatCurrency(pending)}</p>
                                                </div>
                                            </div>

                                            {/* Progreso */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                                                    <span>{loan.paid_installments}/{loan.installments} cuotas pagadas</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-brand-500 rounded-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Botón Refinanciar — prominente y fácil de tocar */}
                                            <button
                                                onClick={() => navigate(`/refinancing/new/${loan.id}`)}
                                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-black text-sm transition-all shadow-sm"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Refinanciar Préstamo
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Vista DESKTOP: Tabla ──────────────────────── */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHead>
                                        <TableHeaderCell>ID Préstamo</TableHeaderCell>
                                        <TableHeaderCell>Cliente</TableHeaderCell>
                                        <TableHeaderCell>Monto Original</TableHeaderCell>
                                        <TableHeaderCell>Saldo Pendiente</TableHeaderCell>
                                        <TableHeaderCell className="text-right">Acción</TableHeaderCell>
                                    </TableHead>
                                    <TableBody>
                                        {loans.map((loan) => (
                                            <TableRow key={loan.id}>
                                                <TableCell className="font-medium text-gray-900">#{loan.id}</TableCell>
                                                <TableCell className="font-medium">
                                                    {loan.client_name || `Cliente #${loan.client_id}`}
                                                </TableCell>
                                                <TableCell>{formatCurrency(loan.principal_amount)}</TableCell>
                                                <TableCell className="text-red-600 font-medium">
                                                    {formatCurrency(calcPending(loan))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => navigate(`/refinancing/new/${loan.id}`)}
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-2" />
                                                        Refinanciar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Estado inicial (sin búsqueda aún) ────────────────────────── */}
            {!debouncedSearch && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                    <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-500">Ingresa el nombre del cliente o ID del préstamo</p>
                    <p className="text-xs text-gray-400 mt-1">para buscar préstamos disponibles para refinanciar.</p>
                </div>
            )}
        </div>
    );
}
