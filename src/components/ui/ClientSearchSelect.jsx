import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, User } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * ClientSearchSelect
 * Combobox con búsqueda en tiempo real para seleccionar clientes.
 * Usa createPortal para el dropdown — no queda cortado por overflow-hidden del Modal.
 *
 * Props:
 *  - clients      : [{ id, full_name, dni }]
 *  - value        : id seleccionado (number | string | '')
 *  - onChange     : (id) => void
 *  - label        : string
 *  - isLoading    : bool
 *  - error        : string
 *  - placeholder  : string
 */
export default function ClientSearchSelect({
    clients = [],
    value,
    onChange,
    label = 'Cliente Destino',
    isLoading = false,
    error,
    placeholder = 'Buscar cliente por nombre o DNI...',
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const triggerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Cliente seleccionado
    const selectedClient = clients.find(c => String(c.id) === String(value));

    // Filtro en tiempo real — nombre o DNI
    const filtered = query.trim() === ''
        ? clients
        : clients.filter(c =>
            c.full_name.toLowerCase().includes(query.toLowerCase()) ||
            c.dni.includes(query)
        );

    // Calcular posición absoluta del dropdown (relativa a viewport + scroll)
    const updateDropdownPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownMaxH = 320;

        if (spaceBelow >= dropdownMaxH || spaceBelow > rect.top) {
            setDropdownStyle({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        } else {
            setDropdownStyle({
                top: rect.top + window.scrollY - dropdownMaxH - 4,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, []);

    // Cerrar al hacer click fuera (trigger o portal)
    useEffect(() => {
        const handleClickOutside = (e) => {
            const portal = document.getElementById('css-portal');
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                (!portal || !portal.contains(e.target))
            ) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reposicionar al scroll/resize mientras está abierto
    useEffect(() => {
        if (!isOpen) return;
        const update = () => updateDropdownPosition();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [isOpen, updateDropdownPosition]);

    // Reset highlight al filtrar
    useEffect(() => { setHighlightedIndex(0); }, [query]);

    // Scroll al item resaltado
    useEffect(() => {
        if (!isOpen || !listRef.current) return;
        const item = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
        if (item) item.scrollIntoView({ block: 'nearest' });
    }, [highlightedIndex, isOpen]);

    const openDropdown = () => {
        updateDropdownPosition();
        setIsOpen(true);
        setQuery('');
        setHighlightedIndex(0);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const selectClient = useCallback((client) => {
        onChange(client.id);
        setIsOpen(false);
        setQuery('');
    }, [onChange]);

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[highlightedIndex]) selectClient(filtered[highlightedIndex]);
                break;
            case 'Escape':
                setIsOpen(false);
                setQuery('');
                break;
            default:
                break;
        }
    };

    // ─── Portal Dropdown ───────────────────────────────────────────────────────
    const dropdownPortal = isOpen ? createPortal(
        <div
            id="css-portal"
            className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
            style={{ position: 'absolute', zIndex: 9999, ...dropdownStyle }}
        >
            {/* Búsqueda interna */}
            <div className="p-2 border-b border-gray-100">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-300 transition-all">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de resultados */}
            <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
                {isLoading ? (
                    <li className="px-4 py-6 text-center text-sm text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                            Cargando clientes...
                        </div>
                    </li>
                ) : filtered.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-gray-400">
                        <div className="flex flex-col items-center gap-1">
                            <User className="h-6 w-6 text-gray-300" />
                            <span>No se encontraron clientes</span>
                            {query && <span className="text-xs">para &quot;{query}&quot;</span>}
                        </div>
                    </li>
                ) : (
                    filtered.map((client, idx) => {
                        const isSelected = String(client.id) === String(value);
                        const isHighlighted = idx === highlightedIndex;
                        return (
                            <li
                                key={client.id}
                                data-index={idx}
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onMouseDown={(e) => { e.preventDefault(); selectClient(client); }}
                                className={clsx(
                                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors mx-1 rounded-lg',
                                    isHighlighted && !isSelected && 'bg-brand-50',
                                    isSelected ? 'bg-brand-100' : 'hover:bg-gray-50'
                                )}
                            >
                                {/* Avatar inicial */}
                                <div className={clsx(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                                    isSelected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500'
                                )}>
                                    {client.full_name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={clsx(
                                        'text-sm font-medium truncate',
                                        isSelected ? 'text-brand-800' : 'text-gray-900'
                                    )}>
                                        {highlight(client.full_name, query)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        DNI: {highlight(client.dni, query)}
                                    </p>
                                </div>

                                {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                                )}
                            </li>
                        );
                    })
                )}
            </ul>

            {/* Footer con conteo */}
            {!isLoading && filtered.length > 0 && (
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-right">
                    {filtered.length === clients.length
                        ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`
                        : `${filtered.length} de ${clients.length} clientes`}
                </div>
            )}
        </div>,
        document.body
    ) : null;

    // ─── Render principal ──────────────────────────────────────────────────────
    return (
        <div className="w-full relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            )}

            {/* Trigger button */}
            <div
                ref={triggerRef}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={openDropdown}
                className={clsx(
                    'relative flex items-center w-full rounded-md border shadow-sm px-3 py-2 cursor-pointer select-none bg-white',
                    'text-sm transition-colors',
                    error ? 'border-red-300 ring-1 ring-red-400' : 'border-gray-300 hover:border-brand-400',
                    isOpen ? 'ring-1 ring-brand-500 border-brand-500' : ''
                )}
            >
                <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />

                {selectedClient ? (
                    <span className="flex-1 truncate font-medium text-gray-900">
                        {selectedClient.full_name}
                        <span className="ml-2 text-xs text-gray-400 font-normal">DNI: {selectedClient.dni}</span>
                    </span>
                ) : (
                    <span className="flex-1 text-gray-400">
                        {isLoading ? 'Cargando clientes...' : '-- Selecciona un cliente --'}
                    </span>
                )}

                <div className="flex items-center gap-1 ml-2">
                    {selectedClient && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Limpiar selección"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <ChevronDown className={clsx(
                        'h-4 w-4 text-gray-400 transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )} />
                </div>
            </div>

            {/* Portal dropdown */}
            {dropdownPortal}

            {error && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
            )}
        </div>
    );
}

/** Resalta la coincidencia con el query en negrita */
function highlight(text, query) {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <strong className="text-brand-700 font-semibold">{text.slice(idx, idx + query.length)}</strong>
            {text.slice(idx + query.length)}
        </>
    );
}
