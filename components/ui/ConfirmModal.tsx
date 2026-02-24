import AppModal from "./AppModal";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    danger?: boolean;
    loading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    danger = false,
    loading = false,
}: ConfirmModalProps) {
    return (
        <AppModal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-slate-400 mb-6">{description}</p>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </button>

                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${danger
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-primary-600 hover:bg-primary-500 text-white"
                        } disabled:opacity-50`}
                >
                    {loading ? "Processing..." : confirmText}
                </button>
            </div>
        </AppModal>
    );
}