"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "@/components/icons/MaterialIcon";

interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Reusable modal dialog component.
 * - Portal renders to body
 * - Click outside to close
 * - Escape key to close
 * - Focus trap (basic)
 */
export function Dialog({ open, onClose, title, children, className = "" }: DialogProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    }, [onClose]);

    // Handle click outside
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    }, [onClose]);

    // Register/unregister escape listener
    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            // Prevent body scroll
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, handleKeyDown]);

    // Focus content when opened
    useEffect(() => {
        if (open && contentRef.current) {
            contentRef.current.focus();
        }
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div
                ref={contentRef}
                tabIndex={-1}
                className={`bg-[var(--bg)] border border-[var(--gray)]/30 rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
            >
                {/* Header (only when title is provided) */}
                {title && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gray)]/20">
                        <h2 id="dialog-title" className="text-lg font-semibold text-[var(--fg)]">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-[var(--bg-soft)] transition-colors"
                            aria-label="Fechar"
                        >
                            <MaterialIcon name="close" size="sm" className="text-[var(--fg-alt)]" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
