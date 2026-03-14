import { create } from 'zustand';

const useUiStore = create((set) => ({
    toasts: [],
    
    // Función para añadir una notificación
    addToast: (message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));

        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, 4000);
    },

    // Función para eliminar manualmente
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    }
}));

export default useUiStore;