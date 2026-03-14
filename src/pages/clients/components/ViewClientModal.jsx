import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { User, Phone, MapPin, Hash, Building, Shield } from 'lucide-react';

export default function ViewClientModal({ isOpen, onClose, client }) {
    if (!client) return null;

    const getRiskBadge = (risk) => {
        switch (risk) {
            case 'VERDE': return <Badge variant="success">Excelente</Badge>;
            case 'NORMAL': return <Badge variant="info">Normal</Badge>;
            case 'AMARILLO': return <Badge variant="warning">Riesgo Medio</Badge>;
            case 'ROJO': return <Badge variant="danger">Riesgo Alto</Badge>;
            case 'NEGRO': return <Badge variant="neutral" className="bg-black text-white">Bloqueado</Badge>;
            default: return <Badge variant="neutral">{risk || 'N/A'}</Badge>;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Cliente" size="md">
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{client.full_name}</h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Hash className="w-4 h-4 mr-1 text-gray-400" /> DNI: {client.dni}
                        </p>
                    </div>
                    {getRiskBadge(client.risk_score)}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center text-gray-700">
                        <Phone className="w-5 h-5 mr-3 text-brand-600" />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Teléfono</p>
                            <p className="font-medium">{client.phone || 'No registrado'}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                        <MapPin className="w-5 h-5 mr-3 text-brand-600" />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Dirección</p>
                            <p className="font-medium">{client.address || 'No registrada'}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-gray-700">
                        <Building className="w-5 h-5 mr-3 text-brand-600" />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Referencia / Ciudad</p>
                            <p className="font-medium">{client.reference_address || 'No registrada'}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                        <Shield className="w-5 h-5 mr-3 text-brand-600" />
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">Calificación de Riesgo</p>
                            <p className="font-medium capitalize">{client.risk_score}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
