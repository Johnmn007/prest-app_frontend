import useUiStore from '../../store/uiStore';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { clsx } from 'clsx';

export default function ToastContainer() {
    const { toasts, removeToast } = useUiStore();

    return (
        <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={clsx(
                        "flex items-center p-4 rounded-lg shadow-lg border animate-in slide-in-from-right",
                        toast.type === 'success' && "bg-green-50 border-green-200 text-green-800",
                        toast.type === 'error' && "bg-red-50 border-red-200 text-red-800",
                        toast.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800"
                    )}
                >
                    <div className="flex-shrink-0">
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                        {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="ml-3 text-sm font-medium flex-1">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-auto flex-shrink-0 p-1 hover:bg-black/5 rounded"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}