import { X } from "lucide-react";

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
