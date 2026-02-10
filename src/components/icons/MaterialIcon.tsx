"use client";

import { cn } from "@/lib/utils";

interface MaterialIconProps {
    name: string;
    className?: string;
    filled?: boolean;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
};

export function MaterialIcon({
    name,
    className,
    filled = false,
    size = "md",
}: MaterialIconProps) {
    return (
        <span
            className={cn(
                "material-symbols-outlined select-none",
                sizeClasses[size],
                className
            )}
            style={{
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
            }}
        >
            {name}
        </span>
    );
}
