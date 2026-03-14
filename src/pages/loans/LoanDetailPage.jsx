// import { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getLoanById, deleteLoan } from '../../api/loans';
// import { registerPayment } from '../../api/payments';
// import Card, { CardBody } from '../../components/ui/Card';
// import Loader from '../../components/ui/Loader';
// import Badge from '../../components/ui/Badge';
// import Button from '../../components/ui/Button';
// import Modal from '../../components/ui/Modal';
// import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
// import { ArrowLeft, CalendarDays, Wallet, CheckCircle2, AlertCircle, Clock, TrendingDown, Banknote, Edit, Trash2 } from 'lucide-react';
// import { format, isBefore, startOfDay } from 'date-fns';
// import { es } from 'date-fns/locale';
// import PaymentModal from './components/PaymentModal';
// import EditLoanModal from './components/EditLoanModal';
// import useUiStore from '../../store/uiStore';
// import logo from '../../assets/img/logo_dilver.jpg';

// const formatCur = (val) => new Intl.NumberFormat('es-PE', { 
//     style: 'currency', 
//     currency: 'PEN',
//     minimumFractionDigits: 2 
// }).format(val);

// export default function LoanDetailPage() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const queryClient = useQueryClient();
//     const addToast = useUiStore((state) => state.addToast);

//     // Modales
//     const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//     const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

//     const { data: loan, isLoading, isError } = useQuery({
//         queryKey: ['loan', id],
//         queryFn: () => getLoanById(id),
//     });

//     const paymentMutation = useMutation({
//         // Pago en cascada: solo enviamos el loan_id y el monto total
//         mutationFn: (amount) => registerPayment({
//             loan_id: parseInt(id),
//             payment_amount: amount,
//             payment_type: 'NORMAL'
//         }),
//         onSuccess: (data) => {
//             queryClient.invalidateQueries({ queryKey: ['loan', id] });
//             const lateCount = data.filter(p => p.payment_type === 'NORMAL').length;
//             addToast(`Abono registrado correctamente`, 'success');
//             setIsPaymentModalOpen(false);
//         },
//         onError: (err) => {
//             addToast(err.response?.data?.detail || 'Error al procesar el abono', 'error');
//         }
//     });

//     const deleteMutation = useMutation({
//         mutationFn: deleteLoan,
//         onSuccess: () => {
//             addToast('Préstamo eliminado correctamente', 'success');
//             navigate('/loans');
//         },
//         onError: (err) => {
//             addToast(err.response?.data?.detail || 'Error al eliminar el préstamo', 'error');
//             setIsDeleteConfirmOpen(false);
//         }
//     });

//     if (isLoading) return <div className="mt-20"><Loader size="xl" /></div>;
//     if (isError || !loan) return <div className="text-red-500 mt-10 text-center font-bold">Error al cargar los datos del préstamo.</div>;

//     const getStatusStyle = (inst) => {
//         if (inst.status === 'PAID') {
//             return { 
//                 label: 'PAGADO', 
//                 variant: 'success', 
//                 icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-green-50/30' 
//             };
//         }

//         // Cuota pagada con retraso (marcada por el sistema de cascada)
//         if (inst.status === 'LATE') {
//             return { 
//                 label: 'PAGO TARDÍO', 
//                 variant: 'neutral',
//                 icon: <TrendingDown className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-purple-50/40',
//                 badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
//             };
//         }
        
//         const today = startOfDay(new Date());
//         const dueDate = startOfDay(new Date(inst.due_date + 'T00:00:00'));
        
//         if (isBefore(dueDate, today)) {
//             return { 
//                 label: 'EN MORA', 
//                 variant: 'danger', 
//                 icon: <AlertCircle className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-red-50/50' 
//             };
//         }

//         return { 
//             label: 'PENDIENTE', 
//             variant: 'warning', 
//             icon: <Clock className="w-3 h-3 mr-1" />,
//             rowClass: '' 
//         };
//     };

//     const totalInstallments = loan.installments || 0;
//     const paidCount = loan.paid_installments || 0;
//     const progressPercent = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;

//     const remainingDebt = loan.installment_details?.reduce((sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 0) ?? loan.total_amount;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const overdueInstallments = loan.installment_details?.filter(inst => {
//         if (inst.status === 'PAID' || inst.status === 'LATE' || inst.status === 'REFINANCED') return false;
//         const due = new Date(inst.due_date + 'T00:00:00');
//         return due < today;
//     }) || [];
//     const overdueCount = overdueInstallments.length;
//     const overdueAmount = overdueInstallments.reduce((s, i) => s + (i.amount - (i.paid_amount || 0)), 0);

//     return (
//         <div className="space-y-6 max-w-5xl mx-auto pb-10">
//             {/* Ocultar botones al imprimir */}
//             <div className="flex items-center justify-between print:hidden">
//                 <button 
//                     onClick={() => navigate('/loans')} 
//                     className="group flex items-center text-gray-500 hover:text-brand-600 transition-all font-medium"
//                 >
//                     <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
//                     Volver al listado
//                 </button>
//                 <div className="flex gap-2">
//                     {loan?.status === 'ACTIVE' && loan?.paid_installments === 0 && (
//                         <>
//                             <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50" onClick={() => setIsEditModalOpen(true)}>
//                                 <Edit className="w-4 h-4 mr-1" /> Editar
//                             </Button>
//                             <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setIsDeleteConfirmOpen(true)}>
//                                 <Trash2 className="w-4 h-4 mr-1" /> Eliminar
//                             </Button>
//                         </>
//                     )}
//                     {loan?.status === 'ACTIVE' && (
//                         <Button variant="primary" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
//                             <Banknote className="w-4 h-4 mr-2" /> Registrar Abono
//                         </Button>
//                     )}
//                     <Button variant="secondary" size="sm" onClick={() => window.print()}>Imprimir</Button>
//                 </div>
//             </div>

//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 print:pb-4">
//                 <div className="flex-1">
//                     <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
//                         {loan.client_name || `Cliente #${loan.client_id}`}
//                     </h1>
//                     <div className="flex items-center gap-3 mt-2">
//                         <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Contrato #{loan.id}</span>
//                         <span className="text-gray-400 text-sm font-medium">
//                             Emitido el {format(new Date(loan.start_date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
//                         </span>
//                     </div>
//                 </div>

//                 {/* Logo centrado, deuda restante y mora */}
//                 <div className="flex-1 flex justify-center order-first md:order-none mb-4 md:mb-0 print:order-none print:mb-0">
//                     <div className="flex items-center gap-4">
//                         {/* Indicador de mora - a la izquierda del logo */}
//                         <div className="flex flex-col items-end gap-2">
//                             <div>
//                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Deuda Restante</p>
//                                 <p className="text-2xl font-black text-brand-600 leading-none">{formatCur(remainingDebt)}</p>
//                             </div>
//                             {overdueCount > 0 && (
//                                 <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-right">
//                                     <p className="text-[9px] text-red-500 font-black uppercase tracking-widest flex items-center justify-end gap-1">
//                                         <AlertCircle className="w-3 h-3" /> EN MORA
//                                     </p>
//                                     <p className="text-base font-black text-red-700 leading-none">{overdueCount} cuota{overdueCount > 1 ? 's' : ''} — {formatCur(overdueAmount)}</p>
//                                 </div>
//                             )}
//                         </div>
//                         <img src={logo} alt="Dilver Cash" className="h-20 w-auto rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none" />
//                     </div>
//                 </div>

//                 <div className="flex-1 flex md:justify-end items-center">
//                     <Badge variant={loan.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-xs px-4 py-1 font-extrabold tracking-widest">
//                         ESTADO: {loan.status}
//                     </Badge>
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="space-y-6">
//                     <Card className="border-brand-100 shadow-md overflow-hidden">
//                         <div className="bg-brand-600 p-5 text-white">
//                             <p className="text-[10px] text-brand-100 font-black uppercase tracking-widest opacity-80 mb-1">Cuota Diaria</p>
//                             <p className="font-black text-4xl italic tracking-tighter">{formatCur(loan.daily_payment)}</p>
//                         </div>
//                         <CardBody className="space-y-4 bg-white">
//                             <div className="space-y-3">
//                                 <div className="flex justify-between items-center">
//                                     <span className="text-xs text-gray-400 font-bold uppercase">Capital</span>
//                                     <span className="font-bold text-gray-700">{formatCur(loan.principal_amount)}</span>
//                                 </div>
//                                 <div className="flex justify-between items-center border-t border-gray-100 pt-2">
//                                     <span className="text-xs text-gray-400 font-bold uppercase">Total a Recaudar</span>
//                                     <span className="font-black text-gray-900">{formatCur(loan.total_amount)}</span>
//                                 </div>
//                             </div>
                            
//                             <div className="pt-4 border-t border-gray-100">
//                                 <div className="flex justify-between text-[10px] font-black uppercase mb-2">
//                                     <span className="text-brand-600">Progreso de Pago</span>
//                                     <span className="text-gray-500">{paidCount} / {totalInstallments} Letras</span>
//                                 </div>
//                                 <div className="w-full bg-gray-100 rounded-full h-3 ring-1 ring-inset ring-gray-200">
//                                     <div 
//                                         className="bg-brand-500 h-3 rounded-full transition-all duration-1000 shadow-inner" 
//                                         style={{ width: `${progressPercent}%` }}
//                                     ></div>
//                                 </div>
//                             </div>
//                         </CardBody>
//                     </Card>

//                     <Button fullWidth onClick={() => navigate('/payments')} className="py-4 shadow-xl shadow-brand-100 uppercase font-black text-xs tracking-widest">
//                         <Wallet className="w-4 h-4 mr-2" /> Ir a Cobranza Diaria
//                     </Button>
//                 </div>

//                 <Card className="col-span-1 md:col-span-2 shadow-2xl border-none ring-1 ring-gray-200 overflow-hidden">
//                     <div className="px-6 py-4 border-b bg-gray-50/80 flex justify-between items-center">
//                         <h3 className="font-black text-gray-800 uppercase flex items-center text-sm tracking-wider">
//                             <CalendarDays className="w-5 h-5 mr-3 text-brand-600" /> Plan de Pagos
//                         </h3>
//                         <span className="text-[9px] bg-white px-3 py-1 rounded-full border border-gray-200 font-black text-gray-400 uppercase tracking-tighter">
//                             Domingos No Laborables
//                         </span>
//                     </div>
                    
//                     <div className="max-h-[600px] overflow-y-auto">
//                         <Table className="border-none">
//                             <TableHead className="sticky top-0 bg-white z-20 shadow-sm">
//                                 <TableHeaderCell className="text-center w-16">Letra</TableHeaderCell>
//                                 <TableHeaderCell>Fecha de Pago</TableHeaderCell>
//                                 <TableHeaderCell>Monto</TableHeaderCell>
//                                 <TableHeaderCell className="text-center">Estado</TableHeaderCell>
//                             </TableHead>
//                             <TableBody>
//                                 {loan.installment_details?.length > 0 ? (
//                                     loan.installment_details.map((inst) => {
//                                         const status = getStatusStyle(inst);
//                                         const dateObj = new Date(inst.due_date + 'T00:00:00');
                                        
//                                         return (
//                                             <TableRow 
//                                                 key={inst.id} 
//                                                 className={`${status.rowClass} transition-colors`}
//                                             >
//                                                 <TableCell className="text-center font-black text-gray-300">
//                                                     #{inst.installment_number}
//                                                 </TableCell>
//                                                 <TableCell className="font-bold text-gray-700 capitalize">
//                                                     {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
//                                                 </TableCell>
//                                                 <TableCell className="font-black text-gray-900 text-lg">
//                                                     {formatCur(inst.amount)}
//                                                 </TableCell>
//                                                 <TableCell className="flex justify-center">
//                                                     <Badge 
//                                                         variant={status.variant} 
//                                                         className={`w-36 justify-center font-black text-[9px] tracking-widest py-1.5 shadow-sm border border-black/5 ${ status.badgeClass || ''}`}
//                                                     >
//                                                         {status.icon}
//                                                         {status.label}
//                                                     </Badge>
//                                                 </TableCell>
//                                             </TableRow>
//                                         );
//                                     })
//                                 ) : (
//                                     <TableRow>
//                                         <TableCell colSpan={4} className="py-32 text-center text-gray-400 uppercase text-xs font-bold tracking-widest">
//                                             Generando cronograma...
//                                         </TableCell>
//                                     </TableRow>
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </Card>
//             </div>

//             <PaymentModal 
//                 isOpen={isPaymentModalOpen}
//                 onClose={() => setIsPaymentModalOpen(false)}
//                 loan={loan}
//                 isLoading={paymentMutation.isPending}
//                 onConfirm={(amount) => paymentMutation.mutate(amount)}
//             />

//             <EditLoanModal
//                 isOpen={isEditModalOpen}
//                 onClose={() => setIsEditModalOpen(false)}
//                 loan={loan}
//             />

//             {/* Modal de confirmación de eliminación */}
//             <Modal
//                 title="Eliminar Préstamo"
//                 isOpen={isDeleteConfirmOpen}
//                 onClose={() => setIsDeleteConfirmOpen(false)}
//             >
//                 <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
//                     <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
//                     <div className="text-sm text-red-700">
//                         <p className="font-bold mb-1">¿Estás seguro de eliminar este préstamo?</p>
//                         <p>Se eliminarán el préstamo <strong>#{loan?.id}</strong> y todo su cronograma de cuotas. Esta acción <strong>no se puede deshacer</strong>.</p>
//                         <p className="mt-2 text-xs">⚠️ Solo está permitido si el préstamo no tiene cobros registrados.</p>
//                     </div>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button variant="secondary" fullWidth onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
//                     <Button
//                         variant="danger"
//                         fullWidth
//                         isLoading={deleteMutation.isPending}
//                         onClick={() => deleteMutation.mutate(loan?.id)}
//                     >
//                         Sí, eliminar préstamo
//                     </Button>
//                 </div>
//             </Modal>
//         </div>
//     );
// }




// -------------------------------------------------------------------------------------------------------------------------------


// import { useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { getLoanById, deleteLoan } from '../../api/loans';
// import { registerPayment } from '../../api/payments';
// import Card, { CardBody } from '../../components/ui/Card';
// import Loader from '../../components/ui/Loader';
// import Badge from '../../components/ui/Badge';
// import Button from '../../components/ui/Button';
// import Modal from '../../components/ui/Modal';
// import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
// import { ArrowLeft, CalendarDays, Wallet, CheckCircle2, AlertCircle, Clock, TrendingDown, Banknote, Edit, Trash2 } from 'lucide-react';
// import { format, isBefore, startOfDay } from 'date-fns';
// import { es } from 'date-fns/locale';
// import PaymentModal from './components/PaymentModal';
// import EditLoanModal from './components/EditLoanModal';
// import useUiStore from '../../store/uiStore';
// import logo from '../../assets/img/logo_dilver.jpg';

// const formatCur = (val) => new Intl.NumberFormat('es-PE', { 
//     style: 'currency', 
//     currency: 'PEN',
//     minimumFractionDigits: 2 
// }).format(val);

// export default function LoanDetailPage() {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const queryClient = useQueryClient();
//     const addToast = useUiStore((state) => state.addToast);

//     // Modales
//     const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//     const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//     const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

//     const { data: loan, isLoading, isError } = useQuery({
//         queryKey: ['loan', id],
//         queryFn: () => getLoanById(id),
//     });

//     const paymentMutation = useMutation({
//         mutationFn: (amount) => registerPayment({
//             loan_id: parseInt(id),
//             payment_amount: amount,
//             payment_type: 'NORMAL'
//         }),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['loan', id] });
//             addToast(`Abono registrado correctamente`, 'success');
//             setIsPaymentModalOpen(false);
//         },
//         onError: (err) => {
//             addToast(err.response?.data?.detail || 'Error al procesar el abono', 'error');
//         }
//     });

//     const deleteMutation = useMutation({
//         mutationFn: deleteLoan,
//         onSuccess: () => {
//             addToast('Préstamo eliminado correctamente', 'success');
//             navigate('/loans');
//         },
//         onError: (err) => {
//             addToast(err.response?.data?.detail || 'Error al eliminar el préstamo', 'error');
//             setIsDeleteConfirmOpen(false);
//         }
//     });

//     if (isLoading) return <div className="mt-20"><Loader size="xl" /></div>;
//     if (isError || !loan) return <div className="text-red-500 mt-10 text-center font-bold">Error al cargar los datos del préstamo.</div>;

//     const getStatusStyle = (inst) => {
//         if (inst.status === 'PAID') {
//             return { 
//                 label: 'PAGADO', 
//                 variant: 'success', 
//                 icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-green-50/30' 
//             };
//         }
//         if (inst.status === 'LATE') {
//             return { 
//                 label: 'PAGO TARDÍO', 
//                 variant: 'neutral',
//                 icon: <TrendingDown className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-purple-50/40',
//                 badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
//             };
//         }
//         const today = startOfDay(new Date());
//         const dueDate = startOfDay(new Date(inst.due_date + 'T00:00:00'));
//         if (isBefore(dueDate, today)) {
//             return { 
//                 label: 'EN MORA', 
//                 variant: 'danger', 
//                 icon: <AlertCircle className="w-3 h-3 mr-1" />,
//                 rowClass: 'bg-red-50/50' 
//             };
//         }
//         return { 
//             label: 'PENDIENTE', 
//             variant: 'warning', 
//             icon: <Clock className="w-3 h-3 mr-1" />,
//             rowClass: '' 
//         };
//     };

//     const totalInstallments = loan.installments || 0;
//     const paidCount = loan.paid_installments || 0;
//     const progressPercent = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;
//     const remainingDebt = loan.installment_details?.reduce((sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 0) ?? loan.total_amount;

//     const today = startOfDay(new Date());
//     const overdueInstallments = loan.installment_details?.filter(inst => {
//         if (inst.status === 'PAID' || inst.status === 'LATE' || inst.status === 'REFINANCED') return false;
//         const due = new Date(inst.due_date + 'T00:00:00');
//         return due < today;
//     }) || [];
//     const overdueCount = overdueInstallments.length;
//     const overdueAmount = overdueInstallments.reduce((s, i) => s + (i.amount - (i.paid_amount || 0)), 0);

//     return (
//         <div className="space-y-6 max-w-5xl mx-auto pb-10">
//             {/* Acciones Superiores */}
//             <div className="flex items-center justify-between print:hidden">
//                 <button 
//                     onClick={() => navigate('/loans')} 
//                     className="group flex items-center text-gray-500 hover:text-brand-600 transition-all font-medium"
//                 >
//                     <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
//                     Volver al listado
//                 </button>
//                 <div className="flex gap-2">
//                     {loan?.status === 'ACTIVE' && loan?.paid_installments === 0 && (
//                         <>
//                             <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50" onClick={() => setIsEditModalOpen(true)}>
//                                 <Edit className="w-4 h-4 mr-1" /> Editar
//                             </Button>
//                             <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setIsDeleteConfirmOpen(true)}>
//                                 <Trash2 className="w-4 h-4 mr-1" /> Eliminar
//                             </Button>
//                         </>
//                     )}
//                     {loan?.status === 'ACTIVE' && (
//                         <Button variant="primary" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
//                             <Banknote className="w-4 h-4 mr-2" /> Registrar Abono
//                         </Button>
//                     )}
//                 </div>
//             </div>

//             {/* Cabecera Principal */}
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
//                 <div className="flex-1">
//                     <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
//                         {loan.client_name || `Cliente #${loan.client_id}`}
//                     </h1>
//                     <div className="flex items-center gap-3 mt-2">
//                         <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">ID #{loan.id}</span>
//                         <span className="text-gray-400 text-sm font-medium">
//                             {format(new Date(loan.start_date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}
//                         </span>
//                     </div>
//                 </div>

//                 <div className="flex-1 flex justify-center order-first md:order-none">
//                     <div className="flex items-center gap-4">
//                         <div className="text-right">
//                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Deuda Restante</p>
//                             <p className="text-2xl font-black text-brand-600 leading-none">{formatCur(remainingDebt)}</p>
//                         </div>
//                         <img src={logo} alt="Dilver Cash" className="h-16 w-auto rounded-xl border border-gray-100 shadow-sm" />
//                     </div>
//                 </div>

//                 <div className="flex-1 flex md:justify-end">
//                     <Badge variant={loan.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-xs px-4 py-1 font-extrabold tracking-widest">
//                         {loan.status}
//                     </Badge>
//                 </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Resumen Lateral */}
//                 <div className="space-y-6">
//                     <Card className="border-brand-100 shadow-md">
//                         <div className="bg-brand-600 p-5 text-white">
//                             <p className="text-[10px] text-brand-100 font-black uppercase tracking-widest opacity-80 mb-1">Cuota Diaria</p>
//                             <p className="font-black text-3xl italic">{formatCur(loan.daily_payment)}</p>
//                         </div>
//                         <CardBody className="space-y-4">
//                             <div className="flex justify-between items-center text-sm">
//                                 <span className="text-gray-400 font-bold uppercase">Capital</span>
//                                 <span className="font-bold text-gray-700">{formatCur(loan.principal_amount)}</span>
//                             </div>
//                             <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
//                                 <span className="text-gray-400 font-bold uppercase">Total</span>
//                                 <span className="font-black text-gray-900">{formatCur(loan.total_amount)}</span>
//                             </div>
//                             <div className="pt-2">
//                                 <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
//                                     <span className="text-brand-600">Progreso</span>
//                                     <span className="text-gray-500">{paidCount}/{totalInstallments}</span>
//                                 </div>
//                                 <div className="w-full bg-gray-100 rounded-full h-2">
//                                     <div className="bg-brand-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
//                                 </div>
//                             </div>
//                         </CardBody>
//                     </Card>
//                     <Button fullWidth onClick={() => navigate('/payments')} className="py-4 shadow-lg shadow-brand-100 uppercase font-black text-xs tracking-widest">
//                         <Wallet className="w-4 h-4 mr-2" /> Cobranza del Día
//                     </Button>
//                 </div>

//                 {/* CRONOGRAMA - Mejorado para Móvil con Etiquetas Originales */}
//                 <Card className="col-span-1 md:col-span-2 shadow-xl border-none ring-1 ring-gray-200 overflow-hidden">
//                     <div className="px-6 py-4 border-b bg-gray-50/80 flex justify-between items-center">
//                         <h3 className="font-black text-gray-800 uppercase flex items-center text-sm tracking-wider">
//                             <CalendarDays className="w-5 h-5 mr-3 text-brand-600" /> Plan de Pagos
//                         </h3>
//                         <span className="hidden sm:inline-block text-[9px] bg-white px-3 py-1 rounded-full border border-gray-200 font-black text-gray-400 uppercase tracking-tighter">
//                             DOMINGOS NO LABORABLES
//                         </span>
//                     </div>
                    
//                     <div className="max-h-[600px] overflow-y-auto">
//                         {/* --- VISTA MÓVIL (Lista de cards con Badges originales) --- */}
//                         <div className="md:hidden divide-y divide-gray-100">
//                             {loan.installment_details?.map((inst) => {
//                                 const status = getStatusStyle(inst);
//                                 const dateObj = new Date(inst.due_date + 'T00:00:00');
                                
//                                 return (
//                                     <div key={inst.id} className={`p-4 ${status.rowClass}`}>
//                                         <div className="flex justify-between items-start mb-2">
//                                             <div className="flex items-center gap-2">
//                                                 <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{inst.installment_number}</span>
//                                                 <p className="text-xs font-black text-gray-900 uppercase">
//                                                     {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
//                                                 </p>
//                                             </div>
//                                             <p className="text-sm font-black text-gray-900">
//                                                 {formatCur(inst.amount)}
//                                             </p>
//                                         </div>
//                                         <div className="flex justify-end">
//                                             {/* Reutilización del componente Badge original para móvil */}
//                                             <Badge 
//                                                 variant={status.variant} 
//                                                 className={`text-[9px] px-3 py-1 font-black tracking-widest shadow-sm ${status.badgeClass || ''}`}
//                                             >
//                                                 {status.icon}
//                                                 {status.label}
//                                             </Badge>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>

//                         {/* --- VISTA DESKTOP (Tabla) --- */}
//                         <div className="hidden md:block">
//                             <Table className="border-none">
//                                 <TableHead className="sticky top-0 bg-white z-20 shadow-sm">
//                                     <TableHeaderCell className="text-center w-16">Letra</TableHeaderCell>
//                                     <TableHeaderCell>Fecha de Pago</TableHeaderCell>
//                                     <TableHeaderCell>Monto</TableHeaderCell>
//                                     <TableHeaderCell className="text-center">Estado</TableHeaderCell>
//                                 </TableHead>
//                                 <TableBody>
//                                     {loan.installment_details?.map((inst) => {
//                                         const status = getStatusStyle(inst);
//                                         const dateObj = new Date(inst.due_date + 'T00:00:00');
//                                         return (
//                                             <TableRow key={inst.id} className={`${status.rowClass} transition-colors`}>
//                                                 <TableCell className="text-center font-black text-gray-300">#{inst.installment_number}</TableCell>
//                                                 <TableCell className="font-bold text-gray-700 capitalize">
//                                                     {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
//                                                 </TableCell>
//                                                 <TableCell className="font-black text-gray-900 text-lg">{formatCur(inst.amount)}</TableCell>
//                                                 <TableCell className="flex justify-center">
//                                                     <Badge variant={status.variant} className={`w-36 justify-center font-black text-[9px] tracking-widest py-1.5 ${status.badgeClass || ''}`}>
//                                                         {status.icon} {status.label}
//                                                     </Badge>
//                                                 </TableCell>
//                                             </TableRow>
//                                         );
//                                     })}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </div>
//                 </Card>
//             </div>

//             {/* Modales */}
//             <PaymentModal 
//                 isOpen={isPaymentModalOpen}
//                 onClose={() => setIsPaymentModalOpen(false)}
//                 loan={loan}
//                 isLoading={paymentMutation.isPending}
//                 onConfirm={(amount) => paymentMutation.mutate(amount)}
//             />
//             <EditLoanModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} loan={loan} />
//             <Modal title="Eliminar Préstamo" isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
//                 <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
//                     <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
//                     <div className="text-sm text-red-700">
//                         <p className="font-bold mb-1">¿Estás seguro?</p>
//                         <p>Se eliminará el contrato <strong>#{loan?.id}</strong>. Esta acción no se puede deshacer.</p>
//                     </div>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button variant="secondary" fullWidth onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
//                     <Button variant="danger" fullWidth isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(loan?.id)}>Eliminar</Button>
//                 </div>
//             </Modal>
//         </div>
//     );
// }















import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoanById, deleteLoan } from '../../api/loans';
import { registerPayment } from '../../api/payments';
import Card, { CardBody } from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table, { TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../../components/ui/Table';
import { ArrowLeft, CalendarDays, Wallet, CheckCircle2, AlertCircle, Clock, TrendingDown, Banknote, Edit, Trash2 } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import PaymentModal from './components/PaymentModal';
import EditLoanModal from './components/EditLoanModal';
import useUiStore from '../../store/uiStore';
import logo from '../../assets/img/logo_dilver.jpg';

const formatCur = (val) => new Intl.NumberFormat('es-PE', { 
    style: 'currency', 
    currency: 'PEN',
    minimumFractionDigits: 2 
}).format(val);

export default function LoanDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUiStore((state) => state.addToast);

    // Modales
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { data: loan, isLoading, isError } = useQuery({
        queryKey: ['loan', id],
        queryFn: () => getLoanById(id),
    });

    const paymentMutation = useMutation({
        mutationFn: (amount) => registerPayment({
            loan_id: parseInt(id),
            payment_amount: amount,
            payment_type: 'NORMAL'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loan', id] });
            addToast(`Abono registrado correctamente`, 'success');
            setIsPaymentModalOpen(false);
        },
        onError: (err) => {
            addToast(err.response?.data?.detail || 'Error al procesar el abono', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLoan,
        onSuccess: () => {
            addToast('Préstamo eliminado correctamente', 'success');
            navigate('/loans');
        },
        onError: (err) => {
            addToast(err.response?.data?.detail || 'Error al eliminar el préstamo', 'error');
            setIsDeleteConfirmOpen(false);
        }
    });

    if (isLoading) return <div className="mt-20"><Loader size="xl" /></div>;
    if (isError || !loan) return <div className="text-red-500 mt-10 text-center font-bold">Error al cargar los datos del préstamo.</div>;

    const getStatusStyle = (inst) => {
        if (inst.status === 'PAID') {
            return { 
                label: 'PAGADO', 
                variant: 'success', 
                icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                rowClass: 'bg-green-50/30' 
            };
        }
        if (inst.status === 'LATE') {
            return { 
                label: 'PAGO TARDÍO', 
                variant: 'neutral',
                icon: <TrendingDown className="w-3 h-3 mr-1" />,
                rowClass: 'bg-purple-50/40',
                badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
            };
        }
        const today = startOfDay(new Date());
        const dueDate = startOfDay(new Date(inst.due_date + 'T00:00:00'));
        if (isBefore(dueDate, today)) {
            return { 
                label: 'EN MORA', 
                variant: 'danger', 
                icon: <AlertCircle className="w-3 h-3 mr-1" />,
                rowClass: 'bg-red-50/50' 
            };
        }
        return { 
            label: 'PENDIENTE', 
            variant: 'warning', 
            icon: <Clock className="w-3 h-3 mr-1" />,
            rowClass: '' 
        };
    };

    const totalInstallments = loan.installments || 0;
    const paidCount = loan.paid_installments || 0;
    const progressPercent = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;
    
    // Cálculo de Deuda Restante Total
    const remainingDebt = loan.installment_details?.reduce((sum, inst) => sum + (inst.amount - (inst.paid_amount || 0)), 0) ?? loan.total_amount;

    // Lógica de Mora (cuotas vencidas antes de hoy no pagadas)
    const todayDate = startOfDay(new Date());
    const overdueInstallments = loan.installment_details?.filter(inst => {
        if (inst.status === 'PAID' || inst.status === 'LATE' || inst.status === 'REFINANCED') return false;
        const due = startOfDay(new Date(inst.due_date + 'T00:00:00'));
        return isBefore(due, todayDate);
    }) || [];
    
    const overdueCount = overdueInstallments.length;
    const overdueAmount = overdueInstallments.reduce((s, i) => s + (i.amount - (i.paid_amount || 0)), 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Acciones Superiores */}
            <div className="flex items-center justify-between print:hidden">
                <button 
                    onClick={() => navigate('/loans')} 
                    className="group flex items-center text-gray-500 hover:text-brand-600 transition-all font-medium"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Volver al listado
                </button>
                <div className="flex gap-2">
                    {loan?.status === 'ACTIVE' && loan?.paid_installments === 0 && (
                        <>
                            <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setIsDeleteConfirmOpen(true)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                        </>
                    )}
                    {loan?.status === 'ACTIVE' && (
                        <Button variant="primary" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
                            <Banknote className="w-4 h-4 mr-2" /> Registrar Abono
                        </Button>
                    )}
                </div>
            </div>

            {/* Cabecera Principal - Aquí restauramos el detalle de Mora */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 print:pb-4">
                <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight leading-none">
                        {loan.client_name || `Cliente #${loan.client_id}`}
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Contrato #{loan.id}</span>
                        <span className="text-gray-400 text-sm font-medium">
                            Iniciado {format(new Date(loan.start_date + 'T00:00:00'), "dd 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                </div>

                {/* Columna central: Deuda y Mora */}
                <div className="flex-1 flex justify-center order-first md:order-none mb-4 md:mb-0">
                    <div className="flex items-center gap-5">
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Deuda Restante</p>
                                <p className="text-3xl font-black text-brand-600 leading-none tracking-tighter">{formatCur(remainingDebt)}</p>
                            </div>
                            
                            {/* INDICADOR DE MORA RESTAURADO */}
                            {overdueCount > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-right shadow-sm shadow-red-100 animate-in fade-in zoom-in duration-300">
                                    <p className="text-[9px] text-red-500 font-black uppercase tracking-widest flex items-center justify-end gap-1 mb-0.5">
                                        <AlertCircle className="w-3 h-3" /> Estado: En Mora
                                    </p>
                                    <p className="text-base font-black text-red-700 leading-none uppercase italic">
                                        {overdueCount} Letra{overdueCount > 1 ? 's' : ''} — {formatCur(overdueAmount)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <img src={logo} alt="Dilver Cash" className="h-20 w-auto rounded-2xl border border-gray-100 shadow-sm print:hidden" />
                    </div>
                </div>

                <div className="flex-1 flex md:justify-end items-center">
                    <Badge variant={loan.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-[10px] px-5 py-1.5 font-black uppercase tracking-widest border border-black/5 shadow-sm">
                        Contrato {loan.status}
                    </Badge>
                </div>
            </div>

            {/* Cuerpo de la Página */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card className="border-brand-100 shadow-md overflow-hidden">
                        <div className="bg-brand-600 p-5 text-white">
                            <p className="text-[10px] text-brand-100 font-black uppercase tracking-widest opacity-80 mb-1">Cuota Diaria</p>
                            <p className="font-black text-4xl italic tracking-tighter">{formatCur(loan.daily_payment)}</p>
                        </div>
                        <CardBody className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-wide">Capital</span>
                                <span className="font-bold text-gray-700">{formatCur(loan.principal_amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                                <span className="text-gray-400 font-bold uppercase tracking-wide">Total a Cobrar</span>
                                <span className="font-black text-gray-900">{formatCur(loan.total_amount)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                                    <span className="text-brand-600">Progreso de Pago</span>
                                    <span className="text-gray-500">{paidCount} / {totalInstallments} Letras</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 ring-1 ring-inset ring-gray-200">
                                    <div 
                                        className="bg-brand-500 h-3 rounded-full transition-all duration-1000 shadow-inner" 
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    <Button fullWidth onClick={() => navigate('/payments')} className="py-4 shadow-xl shadow-brand-100 uppercase font-black text-xs tracking-widest">
                        <Wallet className="w-4 h-4 mr-2" /> Ir a Cobranza Diaria
                    </Button>
                </div>

                <Card className="col-span-1 md:col-span-2 shadow-xl border-none ring-1 ring-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50/80 flex justify-between items-center">
                        <h3 className="font-black text-gray-800 uppercase flex items-center text-sm tracking-wider">
                            <CalendarDays className="w-5 h-5 mr-3 text-brand-600" /> Plan de Pagos
                        </h3>
                        <span className="hidden sm:inline-block text-[9px] bg-white px-3 py-1 rounded-full border border-gray-200 font-black text-gray-400 uppercase tracking-tighter">
                            DOMINGOS NO LABORABLES
                        </span>
                    </div>
                    
                    <div className="max-h-[600px] overflow-y-auto">
                        {/* VISTA MÓVIL (Cards) */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {loan.installment_details?.map((inst) => {
                                const status = getStatusStyle(inst);
                                const dateObj = new Date(inst.due_date + 'T00:00:00');
                                return (
                                    <div key={inst.id} className={`p-4 ${status.rowClass}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{inst.installment_number}</span>
                                                <p className="text-xs font-black text-gray-900 uppercase">
                                                    {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
                                                </p>
                                            </div>
                                            <p className="text-sm font-black text-gray-900">{formatCur(inst.amount)}</p>
                                        </div>
                                        <div className="flex justify-end">
                                            <Badge variant={status.variant} className="text-[9px] px-3 py-1 font-black tracking-widest shadow-sm">
                                                {status.icon}{status.label}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* VISTA DESKTOP (Tabla) */}
                        <div className="hidden md:block">
                            <Table className="border-none">
                                <TableHead className="sticky top-0 bg-white z-20 shadow-sm">
                                    <TableHeaderCell className="text-center w-16">Letra</TableHeaderCell>
                                    <TableHeaderCell>Fecha de Pago</TableHeaderCell>
                                    <TableHeaderCell>Monto</TableHeaderCell>
                                    <TableHeaderCell className="text-center">Estado</TableHeaderCell>
                                </TableHead>
                                <TableBody>
                                    {loan.installment_details?.map((inst) => {
                                        const status = getStatusStyle(inst);
                                        const dateObj = new Date(inst.due_date + 'T00:00:00');
                                        return (
                                            <TableRow key={inst.id} className={`${status.rowClass} transition-colors`}>
                                                <TableCell className="text-center font-black text-gray-300">#{inst.installment_number}</TableCell>
                                                <TableCell className="font-bold text-gray-700 capitalize">
                                                    {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
                                                </TableCell>
                                                <TableCell className="font-black text-gray-900 text-lg">{formatCur(inst.amount)}</TableCell>
                                                <TableCell className="flex justify-center">
                                                    <Badge variant={status.variant} className={`w-36 justify-center font-black text-[9px] tracking-widest py-1.5 ${status.badgeClass || ''}`}>
                                                        {status.icon} {status.label}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Modales */}
            <PaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={() => setIsPaymentModalOpen(false)} 
                loan={loan} 
                isLoading={paymentMutation.isPending} 
                onConfirm={(amount) => paymentMutation.mutate(amount)} 
            />
            <EditLoanModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} loan={loan} />
            <Modal title="Eliminar Préstamo" isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)}>
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl mb-4 text-sm text-red-700">
                    <Trash2 className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="font-bold">¿Eliminar contrato #{loan?.id}?</p>
                        <p>Esta acción borrará todas las cuotas y registros. Es irreversible.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
                    <Button variant="danger" fullWidth isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(loan?.id)}>Eliminar</Button>
                </div>
            </Modal>
        </div>
    );
}