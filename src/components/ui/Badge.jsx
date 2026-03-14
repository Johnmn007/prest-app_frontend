import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const badgeVariants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-gray-100 text-gray-800",
    primary: "bg-brand-100 text-brand-800",
};

export default function Badge({
    children,
    variant = "neutral",
    className,
    rounded = "full",
    ...props
}) {
    const roundedClass = rounded === "full" ? "rounded-full" : "rounded-md";

    const classes = twMerge(
        clsx(
            "inline-flex items-center px-2.5 py-0.5 font-medium text-xs",
            roundedClass,
            badgeVariants[variant],
            className
        )
    );

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
}
