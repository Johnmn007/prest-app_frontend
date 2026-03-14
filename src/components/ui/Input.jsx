import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({
    className,
    label,
    error,
    helpText,
    id,
    type = 'text',
    icon: Icon,
    ...props
}, ref) => {
    const defaultId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const containerClasses = twMerge(
        clsx(
            'w-full',
            className
        )
    );

    const inputClasses = clsx(
        'block w-full rounded-md shadow-sm sm:text-sm transition-colors',
        'focus:outline-none focus:ring-1',
        error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 placeholder-gray-400 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500',
        Icon ? 'pl-10' : 'pl-3',
        'py-2'
    );

    return (
        <div className={containerClasses}>
            {label && (
                <label htmlFor={defaultId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div className="relative rounded-md shadow-sm">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                )}

                <input
                    ref={ref}
                    type={type}
                    id={defaultId}
                    className={inputClasses}
                    {...props}
                />
            </div>

            {error && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
            )}
            {helpText && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helpText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
