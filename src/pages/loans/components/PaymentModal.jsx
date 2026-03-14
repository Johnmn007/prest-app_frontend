import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { DollarSign, Check, AlertCircle } from 'lucide-react';

const formatCur = (val) => new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', minimumFractionDigits: 2
}).format(val || 0);

export default function PaymentModal({ isOpen, onClose, loan, onConfirm, isLoading }) {
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (isOpen && loan) {
            // Por defecto sugiere el monto de una cuota diaria
            setAmount(loan.daily_payment?.toFixed(2) || '');
        }
    }, [isOpen, loan]);

    if (!loan) return null;

    // Cuotas pendientes (deuda pendiente total)
    const pendingInstallments = loan.installment_details?.filter(i => i.status !== 'PAID') || [];
    const totalPending = pendingInstallments.reduce((sum, i) => sum + (i.amount - (i.paid_amount || 0)), 0);
    const overdueCount = pendingInstallments.filter(i => {
        const due = new Date(i.due_date + 'T00:00:00');
        return due < new Date(new Date().toDateString());
    }).length;

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) return;
        onConfirm(parsedAmount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Abono al Préstamo">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Resumen del estado */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Cuota Diaria</p>
                        <p className="text-xl font-black text-gray-900">{formatCur(loan.daily_payment)}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Deuda Total</p>
                        <p className="text-xl font-black text-brand-600">{formatCur(totalPending)}</p>
                    </div>
                </div>

                {/* Advertencia de cuotas en mora */}
                {overdueCount > 0 && (
                    <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-orange-700">
                                {overdueCount} cuota{overdueCount > 1 ? 's' : ''} en mora
                            </p>
                            <p className="text-xs text-orange-600 mt-0.5">
                                El abono pagará las cuotas más antiguas primero. Las cuotas vencidas
                                se marcarán automáticamente como <strong>PAGO TARDÍO</strong>.
                            </p>
                        </div>
                    </div>
                )}

                <div>
                    <Input
                        label="Monto a Abonar (S/)"
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
                    <div className="flex gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setAmount((loan.daily_payment || 0).toFixed(2))}
                            className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-colors"
                        >
                            1 cuota
                        </button>
                        {overdueCount > 1 && (
                            <button
                                type="button"
                                onClick={() => setAmount(totalPending.toFixed(2))}
                                className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors"
                            >
                                Saldar deuda total
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-[11px] text-gray-400 italic">
                    💡 El sistema distribuirá el monto automáticamente desde la cuota más antigua pendiente.
                </p>

                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" fullWidth onClick={onClose} type="button">
                        Cancelar
                    </Button>
                    <Button variant="primary" fullWidth isLoading={isLoading} type="submit">
                        <Check className="w-4 h-4 mr-2" /> Registrar Abono
                    </Button>
                </div>
            </form>
        </Modal>
    );
}