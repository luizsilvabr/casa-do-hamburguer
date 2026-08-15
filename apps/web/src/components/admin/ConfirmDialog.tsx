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
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      <div
        role="alertdialog"
        aria-modal="true"
        className={`relative w-full max-w-[400px] bg-[#F3E9D2] rounded-[6px] p-7 transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between -mx-7 px-7 pb-3 border-b border-dashed border-[#C0A88F]">
          <h2 className="font-oswald font-bold text-[20px] text-[#171210]">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Fechar"
            className="text-[#8E8169] hover:text-[#3A2317] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XIcon size={20} />
          </button>
        </div>
        <p className="font-inter text-[15px] text-[#5C5A52] mt-4">{message}</p>

        <div className="flex justify-end gap-3 -mx-7 px-7 pt-4 mt-7 border-t border-dashed border-[#C0A88F]">
          <button
            onClick={close}
            disabled={busy}
            className="font-oswald font-bold text-[14px] tracking-[0.05em] text-[#3A2317] px-4 py-2.5 rounded-[5px] hover:bg-[#3A2317]/10 cursor-pointer transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className="font-oswald font-bold text-[14px] tracking-[0.05em] text-[#F3E9D2] bg-[#C81D25] hover:bg-[#a8171e] px-5 py-2.5 rounded-[5px] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
