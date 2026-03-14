import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export default function Card({ children, className, ...props }) {
    const classes = twMerge(
        clsx(
            "bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden",
            className
        )
    );

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className, title, subtitle, action }) {
    return (
        <div className={twMerge(clsx("border-b border-gray-200 px-4 py-5 sm:px-6 flex justify-between items-center", className))}>
            <div>
                {title && <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>}
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                {children}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

// Añadimos CardTitle para compatibilidad
export function CardTitle({ children, className }) {
    return (
        <h3 className={twMerge(clsx("text-lg font-medium leading-6 text-gray-900", className))}>
            {children}
        </h3>
    );
}

// CardBody y CardContent ahora son lo mismo para evitar errores
export function CardBody({ children, className }) {
    return <div className={twMerge(clsx("px-4 py-5 sm:p-6", className))}>{children}</div>;
}

export function CardContent({ children, className }) {
    return <div className={twMerge(clsx("px-4 py-5 sm:p-6", className))}>{children}</div>;
}

export function CardFooter({ children, className }) {
    return <div className={twMerge(clsx("border-t border-gray-200 px-4 py-4 sm:px-6", className))}>{children}</div>;
}