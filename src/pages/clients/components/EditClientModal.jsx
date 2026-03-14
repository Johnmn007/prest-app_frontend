import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateClient } from '../../../api/clients';
import useUiStore from '../../../store/uiStore';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { User, Phone, MapPin, Hash, Building } from 'lucide-react';

export default function EditClientModal({ isOpen, onClose, client }) {
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);
    
    const [formData, setFormData] = useState({
        full_name: '',
        dni: '',
        phone: '',
        address: '',
        reference_address: '',
        risk_score: 'NORMAL'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (client) {
            setFormData({
                full_name: client.full_name || '',
                dni: client.dni || '',
                phone: client.phone || '',
                address: client.address || '',
                reference_address: client.reference_address || '',
                risk_score: client.risk_score || 'NORMAL'
            });
        }
    }, [client]);

    const mutation = useMutation({
        mutationFn: updateClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            addToast('Cliente actualizado exitosamente', 'success');
            onClose();
        },
        onError: (err) => {
            const detail = err.response?.data?.detail || 'Error al actualizar al cliente.';
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

        const payload = {
            full_name: formData.full_name.trim(),
            dni: formData.dni,
            phone: formData.phone,
            address: formData.address,
            reference_address: formData.reference_address,
            gps_location: client?.gps_location || "", 
            risk_score: formData.risk_score
        };

        mutation.mutate({ id: client.id, data: payload });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <Input
                    label="Nombre Completo"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    icon={User}
                    placeholder="Ej. Juan Carlos Perez"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="DNI (Documento de Identidad)"
                        name="dni"
                        required
                        value={formData.dni}
                        onChange={handleChange}
                        icon={Hash}
                        placeholder="Número único"
                    />
                    <Input
                        label="Teléfono Móvil"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        icon={Phone}
                        placeholder="300 000 0000"
                    />
                </div>

                <Input
                    label="Dirección de Residencia"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="Calle, Número y Barrio"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Ciudad / Zona / Referencia"
                        name="reference_address"
                        value={formData.reference_address}
                        onChange={handleChange}
                        icon={Building}
                        placeholder="Ej. Centro"
                    />
                    <Select
                        label="Calificación de Riesgo"
                        name="risk_score"
                        value={formData.risk_score}
                        onChange={handleChange}
                        options={[
                            { value: 'VERDE', label: 'VERDE (Excelente)' },
                            { value: 'NORMAL', label: 'NORMAL (Promedio)' },
                            { value: 'AMARILLO', label: 'AMARILLO (Riesgo)' },
                            { value: 'ROJO', label: 'ROJO (Moroso)' },
                            { value: 'NEGRO', label: 'NEGRO (Bloqueado)' },
                        ]}
                    />
                </div>

                <div className="pt-4 mt-6 flex justify-end space-x-3 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" isLoading={mutation.isPending}>
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
