import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRouteById, assignClientToRoute } from '../../api/routes';
import { getClients } from '../../api/clients'; // We need this to list all clients to assign
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { MapPin, ArrowLeft, UserPlus, ListOrdered } from 'lucide-react';

export default function RouteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [clientOrder, setClientOrder] = useState('1');

    const { data: route, isLoading: isLoadingRoute, isError: isErrorRoute } = useQuery({
        queryKey: ['route', id],
        queryFn: () => getRouteById(id)
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => getClients({ skip: 0, limit: 1000 }) // fetch practically all for select
    });

    const assignMutation = useMutation({
        mutationFn: assignClientToRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['route', id] });
            setIsAssignModalOpen(false);
            setSelectedClientId('');
            setClientOrder('');
        },
        onError: (err) => {
            alert('Error al asignar el cliente a la ruta');
            console.error(err);
        }
    });

    const handleAssignSubmit = (e) => {
        e.preventDefault();
        if (!selectedClientId) return;

        assignMutation.mutate({
            route_id: parseInt(id),
            client_id: parseInt(selectedClientId),
            order: parseInt(clientOrder) || 1
        });
    };

    if (isLoadingRoute) return <div className="py-20"><Loader /></div>;
    if (isErrorRoute || !route) return <div className="text-red-500 text-center py-20">Error al cargar la ruta.</div>;

    // Dummy array of assigned clients if backend doesn't return nested clients yet.
    // If route.clients exists, we map that. Otherwise fallback empty array.
    const assignedClients = route.clients || [];

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Detalle de Ruta: ${route.name}`}
                description="Administra los clientes asignados y el orden de visita."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/routes')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <Button onClick={() => setIsAssignModalOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Agregar Cliente
                        </Button>
                    </div>
                }
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                        <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                        Itinerario Diario
                    </h3>
                </div>

                <Table>
                    <TableHead>
                        <TableHeaderCell>Orden</TableHeaderCell>
                        <TableHeaderCell>Cliente ID</TableHeaderCell>
                        <TableHeaderCell>Nombre</TableHeaderCell>
                        <TableHeaderCell>Dirección / Zona</TableHeaderCell>
                        <TableHeaderCell className="text-right">Acción</TableHeaderCell>
                    </TableHead>
                    <TableBody>
                        {assignedClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No hay clientes asignados a esta ruta aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            assignedClients
                                .sort((a, b) => a.order - b.order)
                                .map((assignment) => (
                                    <TableRow key={assignment.id || assignment.client_id}>
                                        <TableCell>
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border border-blue-200">
                                                {assignment.order}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900">#{assignment.client_id}</TableCell>
                                        <TableCell>{assignment.client?.name || '---'}</TableCell>
                                        <TableCell className="text-gray-500 text-sm">{assignment.client?.address || '---'}</TableCell>
                                        <TableCell className="text-right">
                                            {/* Dummy reorder button that could open a modal to change order */}
                                            <Button variant="ghost" size="sm" title="Reordenar">
                                                <ListOrdered className="h-4 w-4 text-gray-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Asignar Cliente a la Ruta"
            >
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                    <Select
                        label="Seleccionar Cliente"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        options={[
                            { value: '', label: '-- Seleccione un cliente --' },
                            ...(clients?.map(c => ({ value: c.id, label: `${c.name} - ${c.dni}` })) || [])
                        ]}
                        required
                    />

                    <Input
                        label="Orden de Visita / Prioridad"
                        type="number"
                        min="1"
                        value={clientOrder}
                        onChange={(e) => setClientOrder(e.target.value)}
                        required
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={assignMutation.isLoading}>
                            {assignMutation.isLoading ? 'Asignando...' : 'Asignar a Ruta'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
