import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Loader({ size = 'md', className, color = 'brand' }) {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-4',
        xl: 'h-16 w-16 border-4',
    };

    const colors = {
        brand: 'border-brand-200 border-t-brand-600',
        gray: 'border-gray-200 border-t-gray-600',
        white: 'border-white/30 border-t-white',
    };

    const classes = twMerge(
        clsx(
            'animate-spin rounded-full',
            sizes[size],
            colors[color],
            className
        )
    );

    return (
        <div className="flex justify-center items-center">
            <div className={classes} role="status">
                <span className="sr-only">Cargando...</span>
            </div>
        </div>
    );
}
