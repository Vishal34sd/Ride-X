import React from "react";
import { cn } from "../../lib/utils";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variantStyles = {
  default:
    "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeStyles = {
  sm: "h-9 px-3",
  md: "h-11 px-5",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
