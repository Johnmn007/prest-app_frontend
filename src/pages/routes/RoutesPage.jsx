import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getRoutes, createRoute } from '../../api/routes';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { Plus, Eye, Map } from 'lucide-react';

export default function RoutesPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');

    const { data: routes, isLoading, isError } = useQuery({
        queryKey: ['routes'],
        queryFn: getRoutes
    });

    const createMutation = useMutation({
        mutationFn: createRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            setIsCreateModalOpen(false);
            setNewRouteName('');
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.detail || 'Error al crear la ruta';
            alert(errorMsg);
            console.error(errorMsg, err);
        }
    });

    const handleCreateRoute = (e) => {
        e.preventDefault();
        if (!newRouteName) return;
        // Include collector_id: 1 as backend requires it for route creation
        createMutation.mutate({ name: newRouteName, collector_id: 1 });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Rutas de Cobradores"
                description="Administración de rutas y zonas de cobranza."
                actions={
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Ruta
                    </Button>
                }
            />

            {isLoading ? (
                <div className="py-20"><Loader /></div>
            ) : isError ? (
                <div className="text-red-500 text-center py-10">Error al cargar listado de rutas.</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHead>
                            <TableHeaderCell>ID Ruta</TableHeaderCell>
                            <TableHeaderCell>Nombre / Zona</TableHeaderCell>
                            <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
                        </TableHead>
                        <TableBody>
                            {!routes || routes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                        No hay rutas configuradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                routes.map((route) => (
                                    <TableRow key={route.id}>
                                        <TableCell className="font-medium text-gray-900">#{route.id}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Map className="h-4 w-4 text-gray-400" />
                                                {route.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/routes/${route.id}`)}>
                                                <Eye className="h-4 w-4 text-blue-600 mr-2" />
                                                Ver y Asignar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Crear Nueva Ruta"
            >
                <form onSubmit={handleCreateRoute} className="space-y-4">
                    <Input
                        label="Nombre de la Ruta / Zona"
                        placeholder="Ej. Ruta Norte, Zona Centro..."
                        value={newRouteName}
                        onChange={(e) => setNewRouteName(e.target.value)}
                        required
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={createMutation.isPending} disabled={createMutation.isPending}>
                            Crear Ruta
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
