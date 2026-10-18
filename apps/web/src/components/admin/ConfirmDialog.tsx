import { useEffect, useState } from "react";
import { XIcon } from "@phosphor-icons/react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const ANIM_MS = 200;

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function close() {
    if (busy) return;
    setShow(false);
    setTimeout(onClose, ANIM_MS);
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setShow(false);
      setTimeout(onClose, ANIM_MS);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-200 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/70" onClick={close} />

      <div
        role="alertdialog"
        aria-modal="true"
        className={`relative w-full max-w-[400px] max-h-[92dvh] overflow-y-auto bg-ink-soft border border-white/10 rounded-card p-5 sm:p-7 transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between -mx-5 px-5 sm:-mx-7 sm:px-7 pb-3 border-b border-white/10">
          <h2 className="font-alfa text-[20px] text-parchment">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center text-sand hover:text-parchment cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XIcon size={20} />
          </button>
        </div>
        <p className="font-body text-[16px] text-sand mt-4">{message}</p>

        <div className="flex justify-end gap-3 -mx-5 px-5 sm:-mx-7 sm:px-7 pt-4 mt-7 border-t border-white/10">
          <button
            onClick={close}
            disabled={busy}
            className="cursor-pointer rounded-brand px-4 py-2.5 font-body text-[16px] font-semibold text-sand transition-colors hover:bg-white/10 hover:text-parchment disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="cursor-pointer rounded-brand bg-brand-red px-5 py-2.5 font-body text-[16px] font-bold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
