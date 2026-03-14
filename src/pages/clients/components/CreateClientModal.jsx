import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../../../api/clients';
import useUiStore from '../../../store/uiStore'; // Importación de la Etapa 12
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { User, Phone, MapPin, Hash, Building } from 'lucide-react';

export default function CreateClientModal({ isOpen, onClose }) {
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast); // Función de notificaciones
    
    // Estado inicial del formulario (mantenemos nombres y apellidos separados para UX)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        dni: '',
        phone: '',
        address: '',
        city: '',
        risk_score: 'NORMAL'
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            
            // Etapa 12: Notificación de éxito
            addToast('Cliente registrado exitosamente', 'success');
            
            // Limpiar formulario
            setFormData({
                first_name: '', last_name: '', dni: '', phone: '', address: '', city: '', risk_score: 'NORMAL'
            });
            onClose();
        },
        onError: (err) => {
            const detail = err.response?.data?.detail || 'Error al registrar al cliente. Verifique si el DNI ya existe.';
            setError(detail);
            addToast(detail, 'error'); // Etapa 12: Notificación de error
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // ADAPTACIÓN AL BACKEND: Construimos el payload exacto para el modelo del servidor
        const payload = {
            full_name: `${formData.first_name} ${formData.last_name}`.trim(),
            dni: formData.dni,
            phone: formData.phone,
            address: formData.address,
            reference_address: formData.city, // Mapeamos ciudad como referencia
            gps_location: "", 
            risk_score: formData.risk_score
        };

        mutation.mutate(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Cliente" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nombres"
                        name="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        icon={User}
                        placeholder="Ej. Juan Carlos"
                    />
                    <Input
                        label="Apellidos"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        icon={User}
                        placeholder="Ej. Perez"
                    />
                </div>

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
                        label="Ciudad / Zona"
                        name="city"
                        value={formData.city}
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
                        ]}
                    />
                </div>

                <div className="pt-4 mt-6 flex justify-end space-x-3 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" isLoading={mutation.isPending}>
                        Guardar Cliente
                    </Button>
                </div>
            </form>
        </Modal>
    );
}