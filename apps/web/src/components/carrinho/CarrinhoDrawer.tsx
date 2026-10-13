import { useCallback, useEffect, useRef, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { useCartStore } from "../../stores/cartStore";
import { buildOrderMessage, getWhatsAppOrderUrl } from "../../lib/whatsapp";
import { formatPhoneNumber } from "../../lib/masks";
import { formatBRL } from "../../lib/format";
import { resolveImageUrl } from "../../lib/images";

const OBSERVATION_LIMIT = 80;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// 16px nos campos: abaixo disso o Safari do iOS dá zoom ao focar o input.
// Estilo compartilhado pelos dois campos do cliente — muda num lugar só.
const INPUT_CLASS =
  "w-full rounded-brand border border-white/15 bg-ink-deep py-3 pl-10 pr-3 font-body text-[16px] text-parchment transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const INPUT_ICON_CLASS =
  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft";

const QTY_BUTTON =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-brand bg-white/10 text-parchment transition-colors hover:bg-white/20";

export default function CarrinhoDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    getSubtotal,
    getItemPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCartStore();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // Depois de "Enviar Pedido" o WhatsApp abre numa nova aba, mas o carrinho só é
  // limpo quando a pessoa confirma que enviou — se o pop-up for bloqueado ou ela
  // desistir, o pedido continua aqui. Guarda o link pra poder abrir de novo.
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const isCustomerInfoComplete =
    customerName.trim().length > 0 && customerPhone.trim().length > 0;

  // fechar também desfaz a pergunta de confirmação: ao reabrir, o pedido está
  // intacto, pronto pra enviar de novo
  const handleClose = useCallback(() => {
    setPendingUrl(null);
    closeCart();
  }, [closeCart]);

  // Enquanto aberto: foco entra no drawer, Tab fica preso nele, Esc fecha e o
  // fundo não rola. Ao fechar, o foco volta pro botão que abriu o carrinho.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable =
        drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, handleClose]);

  // a pergunta de confirmação ocupa o lugar do formulário: leva o foco pra ela
  useEffect(() => {
    if (pendingUrl) confirmButtonRef.current?.focus();
  }, [pendingUrl]);

  function handleSendOrder() {
    if (!isCustomerInfoComplete) return;

    const message = buildOrderMessage(
      items,
      customerName.trim(),
      customerPhone.trim(),
      getItemPrice,
      getSubtotal(),
    );
    const url = getWhatsAppOrderUrl(message);
    window.open(url, "_blank", "noopener");
    setPendingUrl(url);
  }

  function handleConfirmSent() {
    clearCart();
    setCustomerName("");
    setCustomerPhone("");
    handleClose();
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/70 transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={handleClose}
      />

      {/* inert tira o drawer fechado da ordem de Tab e dos leitores de tela
          (só aria-hidden deixava os botões focáveis fora da tela) */}
      <aside
        ref={drawerRef}
        inert={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrinho-titulo"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[88vw] max-w-[400px] flex-col rounded-l-card border-l border-white/10 bg-ink-soft font-body transition-transform duration-300 sm:w-[400px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 id="carrinho-titulo" className="font-alfa text-xl text-parchment">
            Meu carrinho
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Fechar carrinho"
            className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-brand text-parchment transition-colors hover:bg-white/10 ${FOCUS_RING}`}
          >
            <XIcon size={24} weight="bold" />
          </button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto px-5 pt-5">
          {items.length === 0 && (
            <p className="mt-10 text-center text-[17px] text-sand">
              Seu carrinho está vazio
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="mb-5 grid grid-cols-[80px_minmax(0,1fr)_auto] items-start gap-3"
            >
              <img
                src={resolveImageUrl(item.imageUrl)}
                alt={item.name}
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                className="h-[80px] w-[80px] rounded-brand object-cover"
              />
              <div className="flex min-w-0 flex-wrap">
                <h3
                  title={item.name}
                  className="line-clamp-2 w-full break-words font-alfa text-[16px] leading-snug text-parchment"
                >
                  {item.name}
                </h3>

                {/* ADICIONAIS — um ao lado do outro, separados por vírgula */}
                {item.selectedOptions.length > 0 && (
                  <p className="w-full truncate text-[15px] text-sand">
                    + {item.selectedOptions.map((o) => o.itemName).join(", ")}
                  </p>
                )}

                {item.observation && (() => {
                  const isTruncated =
                    item.observation.length > OBSERVATION_LIMIT;
                  const displayObservation = isTruncated
                    ? `${item.observation.slice(0, OBSERVATION_LIMIT)}…`
                    : item.observation;

                  const textEl = (
                    <p className="w-full break-words text-[15px] italic text-sand">
                      Obs: {displayObservation}
                    </p>
                  );

                  return isTruncated ? (
                    <Tippy
                      content={item.observation}
                      theme="carrinho"
                      appendTo={() => document.body}
                    >
                      {textEl}
                    </Tippy>
                  ) : (
                    textEl
                  );
                })()}

                <p className="w-full text-[17px] font-bold tabular-nums text-gold">
                  {formatBRL(getItemPrice(item))}
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decrementItem(item.id)}
                    aria-label={`Diminuir quantidade de ${item.name}`}
                    className={`${QTY_BUTTON} ${FOCUS_RING}`}
                  >
                    <MinusIcon weight="bold" size={15} />
                  </button>
                  <span
                    aria-live="polite"
                    className="min-w-4 text-center text-[17px] font-bold tabular-nums text-parchment"
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => incrementItem(item.id)}
                    aria-label={`Aumentar quantidade de ${item.name}`}
                    className={`${QTY_BUTTON} ${FOCUS_RING}`}
                  >
                    <PlusIcon weight="bold" size={15} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remover ${item.name} do carrinho`}
                className={`flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-brand text-sand transition-colors hover:bg-white/10 hover:text-red-400 ${FOCUS_RING}`}
              >
                <TrashIcon size={24} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex justify-between text-[18px] font-bold tabular-nums text-parchment">
            <span>Subtotal</span>
            <span>{formatBRL(getSubtotal())}</span>
          </div>

          {pendingUrl ? (
            // CONFIRMAÇÃO — o carrinho só é limpo depois do "Já enviei"
            <div className="mt-4">
              <p className="font-alfa text-[17px] text-parchment">
                Abrimos o WhatsApp
              </p>
              <p className="mt-1 text-[16px] leading-snug text-sand">
                Confira se a mensagem do pedido foi enviada. Seu carrinho só é
                limpo quando você confirmar.
              </p>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirmSent}
                className={`mt-4 w-full cursor-pointer rounded-brand bg-green-700 py-3.5 text-[17px] font-bold text-white transition-colors hover:bg-green-800 ${FOCUS_RING}`}
              >
                Já enviei, limpar carrinho
              </button>
              <a
                href={pendingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-brand border border-white/25 text-[16px] font-bold text-parchment transition-colors hover:border-gold hover:text-gold ${FOCUS_RING}`}
              >
                <WhatsappLogoIcon size={20} weight="bold" aria-hidden="true" />
                Abrir o WhatsApp de novo
              </a>
              <button
                type="button"
                onClick={() => setPendingUrl(null)}
                className={`mt-1 min-h-11 w-full cursor-pointer rounded-brand text-[16px] font-medium text-sand transition-colors hover:text-parchment ${FOCUS_RING}`}
              >
                Voltar ao pedido
              </button>
            </div>
          ) : (
            <>
              {/* DADOS DO CLIENTE — vão junto na mensagem do WhatsApp */}
              <div className="mt-4 flex flex-col gap-2.5">
                <div className="relative">
                  <UserIcon
                    size={18}
                    weight="bold"
                    aria-hidden="true"
                    className={INPUT_ICON_CLASS}
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Seu nome"
                    aria-label="Seu nome"
                    autoComplete="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="relative">
                  <WhatsappLogoIcon
                    size={18}
                    weight="bold"
                    aria-hidden="true"
                    className={INPUT_ICON_CLASS}
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Seu contato (WhatsApp)"
                    aria-label="Seu contato no WhatsApp"
                    autoComplete="tel"
                    inputMode="numeric"
                    value={customerPhone}
                    onChange={(e) =>
                      setCustomerPhone(formatPhoneNumber(e.target.value))
                    }
                    maxLength={15}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* diz por que o botão está desligado, em vez de deixar o cliente
                  clicando num botão apagado sem entender */}
              {items.length > 0 && !isCustomerInfoComplete && (
                <p id="carrinho-dica" className="mt-3 text-[15px] text-sand">
                  Preencha nome e contato para enviar o pedido.
                </p>
              )}

              <button
                type="button"
                disabled={items.length === 0 || !isCustomerInfoComplete}
                aria-describedby={
                  items.length > 0 && !isCustomerInfoComplete
                    ? "carrinho-dica"
                    : undefined
                }
                onClick={handleSendOrder}
                className={`mt-3 w-full cursor-pointer rounded-brand bg-green-700 py-3.5 text-[17px] font-bold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-700 ${FOCUS_RING}`}
              >
                Enviar pedido pelo WhatsApp
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
