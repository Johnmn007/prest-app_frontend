import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export default function Table({ children, className, ...props }) {
    const classes = twMerge(
        clsx(
            "min-w-full divide-y divide-gray-300",
            className
        )
    );

    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className={classes} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHead({ children, className, ...props }) {
    return (
        <thead className={twMerge(clsx("bg-gray-50/75 backdrop-blur backdrop-filter", className))} {...props}>
            <tr>{children}</tr>
        </thead>
    );
}

export function TableHeaderCell({ children, className, ...props }) {
    return (
        <th
            scope="col"
            className={twMerge(clsx("py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6", className))}
            {...props}
        >
            {children}
        </th>
    );
}

export function TableBody({ children, className, ...props }) {
    return (
        <tbody className={twMerge(clsx("divide-y divide-gray-200 bg-white", className))} {...props}>
            {children}
        </tbody>
    );
}

export function TableRow({ children, className, ...props }) {
    return (
        <tr className={twMerge(clsx("hover:bg-gray-50/50 transition-colors", className))} {...props}>
            {children}
        </tr>
    );
}

export function TableCell({ children, className, ...props }) {
    return (
        <td
            className={twMerge(clsx("whitespace-nowrap px-3 py-4 text-sm text-gray-500", className))}
            {...props}
        >
            {children}
        </td>
    );
}
