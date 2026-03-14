import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoanById } from '../../api/loans';
import { createRefinancing } from '../../api/refinancing';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import useUiStore from '../../store/uiStore';
import { RefreshCw, ArrowLeft, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCur = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

const MODALITIES = [
    {
        id: 'RENOVACION',
        label: 'Renovación',
        icon: CheckCircle2,
        color: 'green',
        description: 'El cliente pagó todo de golpe y solicita un crédito nuevo.',
        detail: 'El préstamo anterior debe estar saldado. El cliente recibe el nuevo monto completo en efectivo.',
        amountLabel: 'Monto del nuevo crédito',
        amountEditable: true,
    },
    {
        id: 'MORA',
        label: 'Mora — Recapitalizar',
        icon: AlertTriangle,
        color: 'orange',
        description: 'El crédito venció con cuotas en mora. La deuda se convierte en nuevo préstamo.',
        detail: 'El cliente NO recibe dinero. Su deuda actual pasa a ser el capital del nuevo crédito con nuevo cronograma.',
        amountLabel: 'Monto (calculado: deuda actual)',
        amountEditable: false,
    },
    {
        id: 'MORA_CAPITAL',
        label: 'Mora + Nuevo Capital',
        icon: TrendingUp,
        color: 'purple',
        description: 'El cliente tiene mora pero quiere un crédito mayor. La deuda se absorbe en el nuevo monto.',
        detail: 'El cliente recibe la diferencia entre el monto solicitado y su deuda pendiente en efectivo.',
        amountLabel: 'Nuevo monto total solicitado',
        amountEditable: true,
    },
];

export default function RefinanceLoanPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    const [selectedModality, setSelectedModality] = useState('RENOVACION');
    const [newAmount, setNewAmount] = useState('');
    const [interestRate, setInterestRate] = useState('20');
    const [installments, setInstallments] = useState('24');

    const { data: loan, isLoading, isError } = useQuery({
        queryKey: ['loan', id],
        queryFn: () => getLoanById(id)
    });

    const refinanceMutation = useMutation({
        mutationFn: createRefinancing,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            addToast('Refinanciamiento procesado con éxito ✅', 'success');
            navigate('/refinancing');
        },
        onError: (err) => {
            addToast(err.response?.data?.detail || 'Error al refinanciar', 'error');
        }
    });

    const remainingBalance = useMemo(() => {
        if (!loan) return 0;
        return loan.installment_details?.reduce(
            (sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 0
        ) ?? (loan.total_amount - (loan.paid_installments * loan.daily_payment));
    }, [loan]);

    const modality = MODALITIES.find(m => m.id === selectedModality);

    const effectiveAmount = useMemo(() => {
        if (selectedModality === 'MORA') return remainingBalance;
        return parseFloat(newAmount) || 0;
    }, [selectedModality, newAmount, remainingBalance]);

    const calculations = useMemo(() => {
        const rate = parseFloat(interestRate) / 100 || 0;
        const inst = parseInt(installments) || 1;
        const totalDebt = effectiveAmount * (1 + rate);
        const dailyInstallment = totalDebt / inst;
        const cashInHand = selectedModality === 'MORA_CAPITAL'
            ? Math.max(0, effectiveAmount - remainingBalance)
            : selectedModality === 'MORA'
            ? 0
            : effectiveAmount;

        return { totalDebt, dailyInstallment, cashInHand };
    }, [effectiveAmount, interestRate, installments, selectedModality, remainingBalance]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (effectiveAmount <= 0) return;

        refinanceMutation.mutate({
            original_loan_id: parseInt(id),
            reason: selectedModality,
            new_principal_amount: effectiveAmount,
            new_interest_rate: parseFloat(interestRate) / 100,
            new_installments: parseInt(installments)
        });
    };

    if (isLoading) return <div className="py-20"><Loader size="xl" /></div>;
    if (isError) return <div className="text-red-500 text-center py-20">Error al cargar datos del préstamo.</div>;

    const colorMap = {
        green: 'border-green-200 bg-green-50 text-green-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700',
    };
    const iconColorMap = {
        green: 'text-green-600',
        orange: 'text-orange-500',
        purple: 'text-purple-600',
    };
    const selectedBorderMap = {
        green: 'ring-2 ring-green-400',
        orange: 'ring-2 ring-orange-400',
        purple: 'ring-2 ring-purple-400',
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/refinancing')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <PageHeader
                    title="Refinanciar Crédito"
                    description={`Reestructuración del préstamo #${id} — ${loan.client_name || `Cliente #${loan.client_id}`}`}
                />
            </div>

            {/* Estado actual del préstamo */}
            <Card className="border-blue-100 bg-blue-50/30">
                <CardBody>
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3">Estado Actual del Préstamo</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Capital Original</p>
                            <p className="font-black text-gray-800">{formatCur(loan.principal_amount)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total a Cobrar</p>
                            <p className="font-black text-gray-800">{formatCur(loan.total_amount)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Cuotas Pagadas</p>
                            <p className="font-black text-gray-800">{loan.paid_installments} / {loan.installments}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-red-400 font-bold uppercase">Saldo Pendiente</p>
                            <p className="font-black text-red-600 text-lg">{formatCur(remainingBalance)}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Selector de modalidad */}
            <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3">Selecciona la Modalidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MODALITIES.map((m) => {
                        const Icon = m.icon;
                        const isSelected = selectedModality === m.id;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedModality(m.id); setNewAmount(''); }}
                                className={`text-left p-4 rounded-xl border-2 transition-all ${
                                    isSelected
                                        ? `${colorMap[m.color]} ${selectedBorderMap[m.color]} shadow-md`
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-5 h-5 ${isSelected ? iconColorMap[m.color] : 'text-gray-400'}`} />
                                    <span className={`text-sm font-black ${isSelected ? '' : 'text-gray-700'}`}>{m.label}</span>
                                </div>
                                <p className={`text-xs leading-relaxed ${isSelected ? '' : 'text-gray-500'}`}>{m.description}</p>
                            </button>
                        );
                    })}
                </div>
                {/* Instrucción de la modalidad seleccionada */}
                <div className={`mt-3 p-3 rounded-lg border text-xs ${colorMap[modality.color]}`}>
                    💡 {modality.detail}
                </div>
            </div>

            {/* Formulario */}
            <Card className="shadow-lg">
                <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Condiciones del Nuevo Crédito</h3>

                        {/* Monto */}
                        <div>
                            {selectedModality === 'MORA' ? (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">{modality.amountLabel}</p>
                                    <p className="text-3xl font-black text-orange-700">{formatCur(remainingBalance)}</p>
                                    <p className="text-xs text-orange-500 mt-1">Este monto es calculado automáticamente y no puede editarse.</p>
                                </div>
                            ) : (
                                <Input
                                    label={modality.amountLabel}
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="S/ 0.00"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    icon={DollarSign}
                                    required
                                />
                            )}
                        </div>

                        {/* Tasa y cuotas */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Interés %"
                                type="number"
                                step="0.1"
                                min="0"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                icon={Hash}
                            />
                            <Input
                                label="N° de Cuotas (días)"
                                type="number"
                                min="1"
                                value={installments}
                                onChange={(e) => setInstallments(e.target.value)}
                                icon={Hash}
                            />
                        </div>

                        {/* Resumen de cálculos */}
                        {effectiveAmount > 0 && (
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Proyección del Nuevo Crédito</p>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Capital del nuevo préstamo</span>
                                        <span className="font-bold">{formatCur(effectiveAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total a recaudar (con interés)</span>
                                        <span className="font-bold">{formatCur(calculations.totalDebt)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t pt-3">
                                        <span className="text-gray-500">Cuota diaria</span>
                                        <span className="font-black text-lg text-brand-600">{formatCur(calculations.dailyInstallment)}</span>
                                    </div>
                                    {/* Efectivo que recibirá el cliente */}
                                    {selectedModality !== 'MORA' && (
                                        <div className={`flex justify-between text-sm rounded-lg p-3 border mt-2 ${
                                            selectedModality === 'MORA_CAPITAL'
                                                ? 'bg-purple-50 border-purple-200'
                                                : 'bg-green-50 border-green-200'
                                        }`}>
                                            <span className="font-bold">💵 Efectivo que recibe el cliente</span>
                                            <span className={`font-black text-lg ${
                                                selectedModality === 'MORA_CAPITAL' ? 'text-purple-700' : 'text-green-700'
                                            }`}>
                                                {formatCur(calculations.cashInHand)}
                                            </span>
                                        </div>
                                    )}
                                    {selectedModality === 'MORA_CAPITAL' && (
                                        <p className="text-xs text-gray-400 italic">
                                            Deuda absorbida: {formatCur(remainingBalance)} · Dinero en mano: {formatCur(calculations.cashInHand)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button
                            fullWidth
                            type="submit"
                            isLoading={refinanceMutation.isPending}
                            disabled={effectiveAmount <= 0}
                            className="py-3"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Aplicar {modality.label}
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}