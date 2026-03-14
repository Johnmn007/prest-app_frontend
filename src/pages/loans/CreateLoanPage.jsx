import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createLoan } from '../../api/loans';
import { getClients } from '../../api/clients';
import useUiStore from '../../store/uiStore';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import ClientSearchSelect from '../../components/ui/ClientSearchSelect';
import { ArrowLeft, Banknote, Calendar, Calculator } from 'lucide-react';

export default function CreateLoanPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    // Carga de clientes para el dropdown
    const { data: clientsData, isLoading: isLoadingClients } = useQuery({
        queryKey: ['clients_dropdown'],
        queryFn: () => getClients({ limit: 500 }),
    });

    const [formData, setFormData] = useState({
        client_id: '',
        principal_amount: 100000,
        interest_rate: 0.20,
        installments: 24,
        start_date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: createLoan,
        onSuccess: (newLoan) => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            addToast('Préstamo otorgado con éxito', 'success');
            navigate(`/loans/${newLoan.id}`);
        },
        onError: (err) => {
            const detail = err.response?.data?.detail || 'Error al generar el crédito.';
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

        if (!formData.client_id) return setError("Debes seleccionar un cliente");

        const payload = {
            ...formData,
            client_id: parseInt(formData.client_id),
            principal_amount: parseFloat(formData.principal_amount),
            interest_rate: parseFloat(formData.interest_rate),
            installments: parseInt(formData.installments)
        };
        mutation.mutate(payload);
    };

    // Cálculos de vista previa
    const calcTotalAmount = formData.principal_amount * (1 + parseFloat(formData.interest_rate));
    const calcDailyAmount = calcTotalAmount / (formData.installments || 1);
    const formatCur = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 mb-2">
                <button onClick={() => navigate('/loans')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <PageHeader title="Otorgar Nuevo Préstamo" description="Abre una nueva línea de crédito a un cliente." />
            </div>

            <form onSubmit={handleSubmit}>
                {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <div className="px-6 py-5 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Configuración Comercial</h3>
                        </div>
                        <CardBody className="space-y-5">
                            <ClientSearchSelect
                                label="Cliente Destino"
                                clients={clientsData || []}
                                value={formData.client_id}
                                onChange={(id) => setFormData({ ...formData, client_id: id })}
                                isLoading={isLoadingClients}
                                error={!formData.client_id && error === 'Debes seleccionar un cliente' ? error : ''}
                            />

                            <Input
                                label="Monto Prestado (Capital) $"
                                name="principal_amount"
                                type="number"
                                icon={Banknote}
                                required
                                value={formData.principal_amount}
                                onChange={handleChange}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Interés (Ej. 0.20)"
                                    name="interest_rate"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.interest_rate}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Días (Cuotas)"
                                    name="installments"
                                    type="number"
                                    icon={Calendar}
                                    required
                                    value={formData.installments}
                                    onChange={handleChange}
                                />
                            </div>

                            <Input
                                label="Fecha de Inicio"
                                name="start_date"
                                type="date"
                                required
                                value={formData.start_date}
                                onChange={handleChange}
                            />
                        </CardBody>
                    </Card>

                    <Card className="bg-gray-50 border-brand-100">
                        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <Calculator className="w-5 h-5 mr-2 text-brand-600" /> Resumen
                            </h3>
                        </div>
                        <CardBody className="space-y-6">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Capital:</span>
                                <span className="font-semibold">{formatCur(formData.principal_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600 font-bold">TOTAL A COBRAR:</span>
                                <span className="font-bold text-xl text-brand-700">{formatCur(calcTotalAmount || 0)}</span>
                            </div>

                            <div className="bg-brand-100 p-4 rounded-xl mt-4 flex items-center justify-between">
                                <p className="text-sm text-brand-700 font-bold uppercase">Cuota Diaria</p>
                                <p className="text-2xl font-black text-brand-800">{formatCur(calcDailyAmount || 0)}</p>
                            </div>

                            <Button fullWidth type="submit" isLoading={mutation.isPending}>
                                Crear Préstamo
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </form>
        </div>
    );
}