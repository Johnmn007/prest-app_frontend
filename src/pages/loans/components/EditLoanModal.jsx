import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateLoan } from '../../../api/loans';
import { getClients } from '../../../api/clients';
import useUiStore from '../../../store/uiStore';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import ClientSearchSelect from '../../../components/ui/ClientSearchSelect';
import { Banknote, Calendar, Hash } from 'lucide-react';

const formatCur = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(val || 0);

export default function EditLoanModal({ isOpen, onClose, loan }) {
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    const [formData, setFormData] = useState({
        client_id: '',
        principal_amount: '',
        interest_rate: '',
        installments: '',
        start_date: ''
    });
    const [error, setError] = useState('');

    const { data: clientsData, isLoading: isLoadingClients } = useQuery({
        queryKey: ['clients_dropdown'],
        queryFn: () => getClients({ limit: 500 }),
        enabled: isOpen,
    });

    useEffect(() => {
        if (loan && isOpen) {
            setFormData({
                client_id: loan.client_id || '',
                principal_amount: loan.principal_amount || '',
                interest_rate: loan.interest_rate || '',
                installments: loan.installments || '',
                start_date: loan.start_date || ''
            });
            setError('');
        }
    }, [loan, isOpen]);

    const mutation = useMutation({
        mutationFn: updateLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan', String(loan.id)] });
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            addToast('Préstamo actualizado correctamente ✅', 'success');
            onClose();
        },
        onError: (err) => {
            const detail = err.response?.data?.detail || 'Error al actualizar el préstamo.';
            setError(detail);
            addToast(detail, 'error');
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!formData.client_id) return setError('Debes seleccionar un cliente');

        const payload = {
            client_id: parseInt(formData.client_id),
            principal_amount: parseFloat(formData.principal_amount),
            interest_rate: parseFloat(formData.interest_rate),
            installments: parseInt(formData.installments),
            start_date: formData.start_date,
        };
        mutation.mutate({ id: loan.id, data: payload });
    };

    // Proyección en tiempo real
    const amount = parseFloat(formData.principal_amount) || 0;
    const rate = parseFloat(formData.interest_rate) || 0;
    const inst = parseInt(formData.installments) || 1;
    const totalDebt = amount * (1 + rate);
    const dailyInstallment = totalDebt / inst;

    if (!loan) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Préstamo #${loan.id}`} size="lg">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
                    ⚠️ {error}
                </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                <strong>⚠️ Solo disponible sin pagos registrados.</strong> Al guardar, el cronograma de cuotas se regenerará completamente desde la nueva fecha de inicio.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <ClientSearchSelect
                    label="Cliente Destino"
                    clients={clientsData || []}
                    value={formData.client_id}
                    onChange={(id) => setFormData({ ...formData, client_id: id })}
                    isLoading={isLoadingClients}
                />

                <Input
                    label="Monto Prestado (Capital) S/"
                    name="principal_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    icon={Banknote}
                    required
                    value={formData.principal_amount}
                    onChange={handleChange}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Interés (Ej. 0.20 = 20%)"
                        name="interest_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        icon={Hash}
                        required
                        value={formData.interest_rate}
                        onChange={handleChange}
                    />
                    <Input
                        label="N° de Cuotas (días)"
                        name="installments"
                        type="number"
                        min="1"
                        icon={Hash}
                        required
                        value={formData.installments}
                        onChange={handleChange}
                    />
                </div>

                <Input
                    label="Fecha de Inicio"
                    name="start_date"
                    type="date"
                    icon={Calendar}
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                />

                {/* Proyección */}
                {amount > 0 && (
                    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-2">Proyección del Nuevo Cronograma</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total a recaudar</span>
                            <span className="font-bold">{formatCur(totalDebt)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Cuota diaria</span>
                            <span className="font-black text-brand-700 text-base">{formatCur(dailyInstallment)}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" fullWidth isLoading={mutation.isPending}>
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
