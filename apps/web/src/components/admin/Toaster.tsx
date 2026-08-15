import { useEffect, useState } from "react";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useToastStore, type Toast } from "../../stores/toastStore";

const VISIBLE_MS = 3500;
const EXIT_MS = 300;

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setShow(true));
    const hide = setTimeout(() => setShow(false), VISIBLE_MS);
    const remove = setTimeout(
      () => removeToast(toast.id),
      VISIBLE_MS + EXIT_MS,
    );
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, [toast.id, removeToast]);

  const isSuccess = toast.type === "success";
  const accent = isSuccess ? "#4A7C2F" : "#C81D25";

  return (
    <div
      role="status"
      style={{ borderLeftColor: accent }}
      className={`flex items-center gap-3 min-w-[260px] max-w-[360px] bg-[#221A16] border border-[#3A2317] border-l-4 rounded-[6px] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-300 ${
        show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      <span style={{ color: accent }} className="shrink-0">
        {isSuccess ? (
          <CheckCircleIcon size={22} weight="fill" />
        ) : (
          <WarningCircleIcon size={22} weight="fill" />
        )}
      </span>
      <p className="font-inter text-[14px] text-[#F3E9D2]">{toast.message}</p>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
