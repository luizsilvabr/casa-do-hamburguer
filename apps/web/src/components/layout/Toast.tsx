import { useEffect } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useSiteToastStore } from "../../stores/siteToastStore";
import { useCartStore } from "../../stores/cartStore";
import { FOCUS_RING } from "../../lib/site";

const TOAST_MS = 3200;

// Confirmação curta depois de adicionar um item. Fica acima da barra flutuante
// do carrinho no mobile e some sozinha; "Ver carrinho" abre o carrinho.
export default function Toast() {
  const { message, id, hide } = useSiteToastStore();
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(hide, TOAST_MS);
    return () => clearTimeout(timeout);
  }, [message, id, hide]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] flex justify-center sm:bottom-6"
    >
      {message && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-brand border border-white/15 bg-ink-soft py-2.5 pl-4 pr-2 font-body text-[15px] text-parchment">
          <CheckCircleIcon
            size={20}
            weight="fill"
            aria-hidden="true"
            className="shrink-0 text-gold"
          />
          <span>{message}</span>
          <button
            type="button"
            onClick={() => {
              hide();
              openCart();
            }}
            className={`min-h-9 shrink-0 cursor-pointer rounded-brand px-3 font-bold text-gold transition-colors hover:bg-white/10 ${FOCUS_RING}`}
          >
            Ver carrinho
          </button>
        </div>
      )}
    </div>
  );
}
