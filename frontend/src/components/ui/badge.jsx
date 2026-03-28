import React from "react";
import { cn } from "../../lib/utils";

const variantStyles = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-foreground text-background",
  warning: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border border-border text-foreground",
};

export function Badge({ className, variant = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}
