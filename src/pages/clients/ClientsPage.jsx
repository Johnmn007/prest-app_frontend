import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, deleteClient } from '../../api/clients';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import { Search, Plus, Trash2, Edit, AlertCircle, Eye, Phone, Users } from 'lucide-react';

import useUiStore from '../../store/uiStore';
import CreateClientModal from './components/CreateClientModal';
import EditClientModal from './components/EditClientModal';
import ViewClientModal from './components/ViewClientModal';
export default function ClientsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    // Queries - Usamos los parámetros que espera tu backend
    const { data: clients, isLoading, isError } = useQuery({
        queryKey: ['clients', searchTerm, riskFilter],
        queryFn: () => getClients({ search: searchTerm, risk_score: riskFilter }),
    });

    const addToast = useUiStore((state) => state.addToast);

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            addToast('Cliente eliminado exitosamente', 'success');
            setDeleteConfirmId(null);
        },
        onError: (error) => {
            const message = error.response?.data?.detail || 'Error al eliminar el cliente';
            addToast(message, 'error');
            setDeleteConfirmId(null);
        }
    });

    // Colores de Badge basados en tu modelo (VERDE, NORMAL, AMARILLO, ROJO, NEGRO)
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

    const handleDeleteConfirm = () => {
        if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900">Clientes</h1>
                    <p className="text-xs text-gray-400 mt-0.5 hidden md:block">Administra la cartera de clientes y su nivel de riesgo.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Nuevo </span>Cliente
                </Button>
            </div>

            {/* ── Buscador + Filtro ─────────────────────────────────────────── */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar nombre o DNI..."
                        icon={Search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-xs font-bold text-gray-600 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500 flex-shrink-0"
                >
                    <option value="">Todos</option>
                    <option value="VERDE">Verde</option>
                    <option value="NORMAL">Normal</option>
                    <option value="AMARILLO">Alerta</option>
                    <option value="ROJO">Alto</option>
                </select>
            </div>

            {/* ── Contenido ───────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="py-20"><Loader /></div>
            ) : isError ? (
                <div className="text-red-500 text-center py-10 text-sm">Error al cargar clientes</div>
            ) : clients?.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">Sin resultados</p>
                </div>
            ) : (
                <>
                    {/* ── Vista MOBILE: Cards ──────────────────────────────── */}
                    <div className="md:hidden space-y-3">
                        {clients.map((client) => (
                            <div
                                key={client.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                            >
                                {/* Franja lateral de color según riesgo */}
                                <div className="flex items-stretch">
                                    <div className={`w-1.5 flex-shrink-0 ${
                                        client.risk_score === 'VERDE'    ? 'bg-green-500' :
                                        client.risk_score === 'AMARILLO' ? 'bg-yellow-500' :
                                        client.risk_score === 'ROJO'     ? 'bg-red-500' :
                                        client.risk_score === 'NEGRO'    ? 'bg-gray-900' :
                                        'bg-blue-400'
                                    }`} />
                                    <div className="p-4 flex-1">
                                        {/* Nombre + Badge */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="font-black text-gray-900 uppercase leading-tight">
                                                    {client.full_name}
                                                </p>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                    DNI: {client.dni}
                                                </p>
                                            </div>
                                            {getRiskBadge(client.risk_score)}
                                        </div>

                                        {/* Info de contacto */}
                                        {client.phone && (
                                            <a
                                                href={`tel:${client.phone}`}
                                                className="flex items-center gap-1.5 text-xs text-brand-600 font-bold mb-3 w-fit"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                {client.phone}
                                            </a>
                                        )}

                                        {/* Acciones */}
                                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                                            <button
                                                onClick={() => setSelectedClient(client)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Ver
                                            </button>
                                            <button
                                                onClick={() => setClientToEdit(client)}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold"
                                            >
                                                <Edit className="w-3.5 h-3.5" /> Editar
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(client.id)}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <p className="text-center text-xs text-gray-400 pt-2">
                            {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* ── Vista DESKTOP: Tabla ─────────────────────────────── */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHead>
                                <TableHeaderCell>Nombre Completo</TableHeaderCell>
                                <TableHeaderCell>DNI / Documento</TableHeaderCell>
                                <TableHeaderCell>Contacto</TableHeaderCell>
                                <TableHeaderCell>Nivel de Riesgo</TableHeaderCell>
                                <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
                            </TableHead>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium text-gray-900">{client.full_name}</TableCell>
                                        <TableCell>{client.dni}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{client.phone}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{client.address}</div>
                                        </TableCell>
                                        <TableCell>{getRiskBadge(client.risk_score)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)} className="text-blue-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setClientToEdit(client)} className="text-emerald-600">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(client.id)} className="text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* ── Modales ──────────────────────────────────────────────────── */}
            <CreateClientModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            <EditClientModal   isOpen={!!clientToEdit}    onClose={() => setClientToEdit(null)}   client={clientToEdit} />
            <ViewClientModal   isOpen={!!selectedClient}  onClose={() => setSelectedClient(null)} client={selectedClient} />

            <Modal title="Eliminar Cliente" isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
                <div className="flex items-center text-red-600 mb-6 bg-red-50 p-4 rounded-xl">
                    <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                    <p className="text-sm">¿Está seguro de que desea eliminar este cliente? <br/><br/><strong>Nota profesional:</strong> Un cliente solo puede ser eliminado si no tiene préstamos activos. Sus datos históricos permanecerán archivados.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
                    <Button variant="danger"    fullWidth onClick={handleDeleteConfirm} isLoading={deleteMutation.isPending}>Sí, eliminar</Button>
                </div>
            </Modal>
        </div>
    );
}

