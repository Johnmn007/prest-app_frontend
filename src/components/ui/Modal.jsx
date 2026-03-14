import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]',
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal panel container */}
            <div
                className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all flex flex-col max-h-[90vh]`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                        {title}
                    </h3>
                    <button
                        type="button"
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                        onClick={onClose}
                    >
                        <span className="sr-only">Cerrar diálogo</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Content body - scrollable */}
                <div className="px-6 py-5 overflow-y-auto w-full max-w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
