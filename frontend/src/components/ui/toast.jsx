import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 3500 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [
        ...prev,
        { id, title, description, variant, duration },
      ]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[320px] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={cn(
                "rounded-[var(--radius)] border border-border/60 bg-card/80 p-4 shadow-lg backdrop-blur",
                item.variant === "destructive" &&
                  "border-destructive/40 bg-destructive/15"
              )}
            >
              <p className="text-sm font-semibold text-foreground">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
