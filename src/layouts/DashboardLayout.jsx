import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    Home, Users, Landmark, Banknote, RefreshCcw,
    Map as MapIcon, BarChart3, LogOut, Menu, X,
    TrendingDown, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import useAuthStore from '../store/authStore';
import logo from '../assets/img/logo_dilver.jpg';

// Navegación principal (aparece en bottom bar móvil y sidebar desktop)
const PRIMARY_NAV = [
    { name: 'Inicio',    shortName: 'Inicio',    href: '/dashboard', icon: Home    },
    { name: 'Clientes',  shortName: 'Clientes',  href: '/clients',   icon: Users   },
    { name: 'Préstamos', shortName: 'Créditos',  href: '/loans',     icon: Landmark },
    { name: 'Cobros',    shortName: 'Cobros',    href: '/payments',  icon: Banknote },
    { name: 'Más',       shortName: 'Más',       href: null,         icon: Menu,  isMore: true },
];

// Navegación secundaria (en el panel "Más" del móvil y sidebar desktop)
const SECONDARY_NAV = [
    { name: 'Egresos',          href: '/expenses',    icon: TrendingDown },
    { name: 'Rutas',            href: '/routes',      icon: MapIcon      },
    { name: 'Refinanciamiento', href: '/refinancing', icon: RefreshCcw   },
    { name: 'Reportes',         href: '/reports',     icon: BarChart3    },
];

const ALL_NAV = [
    ...PRIMARY_NAV.filter(n => !n.isMore),
    ...SECONDARY_NAV,
];

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen]   = useState(false); // sidebar full en móvil
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // panel "Más" en móvil
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);

    const isActive = (href) => href && location.pathname === href;

    // ── Sidebar Desktop (sin cambios) ─────────────────────────────────────────
    const DesktopSidebar = () => (
        <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 h-16 bg-gray-950 border-b border-gray-800">
                <img src={logo} alt="Logo" className="h-8 w-auto rounded-md" />
                <span className="text-white font-bold text-base uppercase tracking-wider italic leading-tight">
                    PREST-APP<br />MAGOR
                </span>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {ALL_NAV.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        className={clsx(
                            'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                            isActive(item.href)
                                ? 'bg-brand-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        )}
                    >
                        <item.icon className={clsx('mr-3 h-5 w-5 flex-shrink-0', isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-white')} />
                        {item.name}
                        {isActive(item.href) && <ChevronRight className="ml-auto h-4 w-4 text-white/50" />}
                    </Link>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" /> Cerrar Sesión
                </button>
            </div>
        </aside>
    );

    // ── Panel "Más" en móvil (drawer desde abajo) ─────────────────────────────
    const MoreDrawer = () => (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                onClick={() => setIsMoreMenuOpen(false)}
            />
            {/* Panel */}
            <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 pb-safe">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

                <div className="px-4 pb-4 space-y-1">
                    {SECONDARY_NAV.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMoreMenuOpen(false)}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-colors',
                                isActive(item.href)
                                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                                    : 'text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            <div className={clsx(
                                'p-2 rounded-lg',
                                isActive(item.href) ? 'bg-brand-100' : 'bg-gray-100'
                            )}>
                                <item.icon className={clsx('h-5 w-5', isActive(item.href) ? 'text-brand-600' : 'text-gray-500')} />
                            </div>
                            {item.name}
                            <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                        </Link>
                    ))}
                </div>

                {/* Logout en el drawer */}
                <div className="border-t border-gray-100 px-4 py-3">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <div className="p-2 rounded-lg bg-red-100">
                            <LogOut className="h-5 w-5 text-red-500" />
                        </div>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );

    // ── Bottom Navigation Bar (solo móvil) ────────────────────────────────────
    const BottomNavBar = () => (
        <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex items-stretch h-16">
                {PRIMARY_NAV.map((item) => {
                    const active = item.isMore
                        ? isMoreMenuOpen || SECONDARY_NAV.some(s => isActive(s.href))
                        : isActive(item.href);

                    if (item.isMore) {
                        return (
                            <button
                                key="more"
                                onClick={() => setIsMoreMenuOpen(v => !v)}
                                className={clsx(
                                    'flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative',
                                    active ? 'text-brand-600' : 'text-gray-400'
                                )}
                            >
                                {active && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
                                )}
                                <Menu className={clsx('h-5 w-5 transition-transform', isMoreMenuOpen && 'rotate-90')} />
                                <span className="text-[10px] font-bold tracking-wide">Más</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMoreMenuOpen(false)}
                            className={clsx(
                                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative',
                                active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
                            )}
                        >
                            {/* Indicador activo */}
                            {active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
                            )}
                            {/* Ícono con fondo cuando activo */}
                            <div className={clsx(
                                'p-1.5 rounded-xl transition-all',
                                active ? 'bg-brand-50' : ''
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold tracking-wide leading-none">{item.shortName}</span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area para iPhone (notch) */}
            <div className="h-safe-bottom bg-white" />
        </nav>
    );

    // ── Top Header (móvil) ────────────────────────────────────────────────────
    const MobileHeader = () => {
        const currentPage = ALL_NAV.find(n => isActive(n.href));
        return (
            <header className="md:hidden flex-shrink-0 bg-white border-b border-gray-100 h-14 flex items-center px-4 justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                    <img src={logo} alt="Logo" className="h-7 w-auto rounded-md" />
                    <div>
                        <p className="font-black text-gray-900 text-sm leading-none">
                            {currentPage?.name || 'PREST-APP'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">MAGOR</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 py-1 px-2.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    En línea
                </div>
            </header>
        );
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
            <DesktopSidebar />

            {/* ── Content Area ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Mobile Header (solo visible en móvil) */}
                <MobileHeader />

                {/* Desktop Header */}
                <header className="hidden md:flex flex-shrink-0 bg-white border-b border-gray-200 h-16 items-center px-8 justify-between">
                    <div /> {/* Spacer */}
                    <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 py-1.5 px-3 rounded-full">
                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse" />
                        Caja Abierta
                    </div>
                </header>

                {/* Main content — con padding bottom extra en móvil para la bottom nav */}
                <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-8 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* ── Bottom Nav Bar (solo móvil) ───────────────────────────────── */}
            <BottomNavBar />

            {/* ── Drawer "Más" (solo móvil cuando está abierto) ────────────── */}
            {isMoreMenuOpen && <MoreDrawer />}
        </div>
    );
}