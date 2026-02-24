import { X } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";

interface AppModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function AppModal({
    isOpen,
    onClose,
    title,
    children,
}: AppModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-[92%] max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 animate-scale-in max-h-[90vh] flex flex-col">

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-5 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>,
        document.body
    );
}