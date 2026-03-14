import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Select = forwardRef(({
    className,
    label,
    error,
    helpText,
    id,
    options = [],
    ...props
}, ref) => {
    const defaultId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const containerClasses = twMerge(
        clsx(
            'w-full',
            className
        )
    );

    const selectClasses = clsx(
        'block w-full rounded-md shadow-sm sm:text-sm transition-colors py-2 pl-3 pr-10 border',
        'focus:outline-none focus:ring-1 focus:border-brand-500',
        error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 text-gray-900 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500'
    );

    return (
        <div className={containerClasses}>
            {label && (
                <label htmlFor={defaultId} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <select
                    ref={ref}
                    id={defaultId}
                    className={selectClasses}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
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

Select.displayName = 'Select';
export default Select;
