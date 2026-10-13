import { useEffect, useRef, useState } from "react";
import { CheckIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import type { Product, SelectedOption } from "../../types";
import { useCartStore } from "../../stores/cartStore";
import { formatBRL } from "../../lib/format";
import { resolveImageUrl } from "../../lib/images";
import { useSiteToastStore } from "../../stores/siteToastStore";

interface ProdutoModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

type GroupSelection = string | string[] | null;
interface MissingGroup {
  id: string;
  name: string;
}

const TRANSITION_MS = 200;
const OBSERVATION_MAX_LENGTH = 150;
const MAX_QUANTITY = 20;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft";

// Rótulo de cada grupo de opções — mesmo estilo para <legend> e <label>
const GROUP_TITLE_CLASS =
  "p-0 font-body text-[17px] font-semibold sm:text-[19px]";

export default function ProdutoModal({
  product,
  isOpen,
  onClose,
}: ProdutoModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useSiteToastStore((state) => state.show);

  const [selections, setSelections] = useState<Record<string, GroupSelection>>(
    {},
  );
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");
  const [missingGroups, setMissingGroups] = useState<MissingGroup[]>([]);

  const [isVisible, setIsVisible] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Esc fecha, o fundo para de rolar enquanto a modal está aberta (no mobile,
  // sem isso o cardápio rola atrás do overlay), o Tab fica preso dentro do
  // painel e o foco volta pro botão que abriu a modal quando ela fecha.
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
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, TRANSITION_MS);
  }

  if (!isOpen) return null;

  function clearMissing(groupId: string) {
    setMissingGroups((prev) => prev.filter((group) => group.id !== groupId));
  }

  function handleSingleSelect(groupId: string, itemId: string) {
    setSelections((prev) => ({ ...prev, [groupId]: itemId }));
    clearMissing(groupId);
  }

  function handleMultipleToggle(groupId: string, itemId: string) {
    setSelections((prev) => {
      const current = (prev[groupId] as string[]) ?? [];
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      return { ...prev, [groupId]: next };
    });
    clearMissing(groupId);
  }

  function buildSelectedOptions(): SelectedOption[] {
    const selected: SelectedOption[] = [];
    for (const group of product.optionGroups) {
      const selection = selections[group.id];
      const itemIds = Array.isArray(selection)
        ? selection
        : selection
          ? [selection]
          : [];
      for (const itemId of itemIds) {
        const item = group.items.find((i) => i.id === itemId);
        if (!item) continue;
        selected.push({
          groupId: group.id,
          groupName: group.name,
          itemId: item.id,
          itemName: item.name,
          extraPrice: item.extraPrice,
        });
      }
    }
    return selected;
  }

  function validate(): MissingGroup[] {
    const missing = product.optionGroups
      .filter((group) => group.required)
      .filter((group) => {
        const selection = selections[group.id];
        return Array.isArray(selection) ? selection.length === 0 : !selection;
      })
      .map((group) => ({ id: group.id, name: group.name }));
    setMissingGroups(missing);
    return missing;
  }

  function handleAddToCart() {
    const missing = validate();
    if (missing.length > 0) {
      // o botão Adicionar fica no rodapé fixo, longe do grupo que falta —
      // leva o primeiro grupo pendente pra dentro da tela
      document
        .getElementById(`grupo-${missing[0].id}`)
        ?.scrollIntoView({ block: "center" });
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      basePrice: product.price,
      quantity,
      selectedOptions: buildSelectedOptions(),
      observation: observation.trim() || undefined,
    });
    showToast(`${product.name} adicionado`);
    handleClose();
  }

  const optionsTotal = buildSelectedOptions().reduce(
    (sum, opt) => sum + opt.extraPrice,
    0,
  );
  const totalPrice = (product.price + optionsTotal) * quantity;

  // SINGLE sempre antes de MULTIPLE, sem mexer na ordem entre grupos do mesmo tipo
  const sortedGroups = [...product.optionGroups].sort((a, b) =>
    a.type === b.type ? 0 : a.type === "SINGLE" ? -1 : 1,
  );

  const isMissing = (groupId: string) =>
    missingGroups.some((group) => group.id === groupId);

  return (
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* PAINEL — flex column: só o miolo rola, header e footer ficam parados.
          Antes o overflow ficava no painel inteiro e a barra cortava as bordas
          arredondadas de ponta a ponta. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="produto-titulo"
        className={`relative flex max-h-[92dvh] w-full max-w-[700px] flex-col overflow-hidden rounded-card border border-white/10 bg-ink-soft transition-[opacity,transform] duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FECHAR — flutua sobre a foto; fica fora da área rolável */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-ink-deep/85 text-parchment transition-colors hover:bg-ink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <XIcon size={22} weight="bold" />
        </button>

        {/* BODY — único elemento com rolagem */}
        <section className="custom-scroll flex-1 overflow-y-auto [scrollbar-gutter:auto]">
          <div className="relative h-[190px] sm:h-[240px]">
            <img
              src={resolveImageUrl(product.imageUrl)}
              alt={product.name}
              width={700}
              height={240}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-ink-soft via-ink-soft/10 to-transparent"
            />
          </div>

          <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-6 relative">
            <h2
              id="produto-titulo"
              className="font-alfa text-[22px] leading-tight text-parchment sm:text-[26px]"
            >
              {product.name}
            </h2>
            <p className="mt-2 font-body text-[16px] text-sand sm:text-[17px]">
              {product.description}
            </p>
            <p className="mt-3 font-body text-[22px] font-bold tabular-nums text-gold">
              {formatBRL(product.price)}
            </p>
          </div>

          {sortedGroups.map((group) => {
            const legendClass = `${GROUP_TITLE_CLASS} ${isMissing(group.id) ? "text-red-400" : "text-parchment"}`;
            const requiredMark = group.required && (
              <span className="text-red-400" aria-hidden="true">
                {" "}
                *
              </span>
            );

            return group.type === "SINGLE" ? (
              // GROUPS [SINGLE]
              <fieldset
                key={group.id}
                id={`grupo-${group.id}`}
                className="mt-6 min-w-0"
              >
                <legend className={legendClass}>
                  {group.name}
                  {requiredMark}
                  {group.required && <span className="sr-only"> (obrigatório)</span>}
                </legend>
                {isMissing(group.id) && (
                  <p
                    role="alert"
                    className="mt-1 font-body text-[16px] font-bold text-red-400"
                  >
                    Selecione uma opção
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1">
                  {group.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex min-h-11 cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name={group.id}
                        value={item.id}
                        checked={selections[group.id] === item.id}
                        onChange={() => handleSingleSelect(group.id, item.id)}
                        className="peer sr-only"
                      />
                      <span className="h-4 w-4 shrink-0 rounded-full border-2 border-white/40 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:shadow-[inset_0_0_0_1px_var(--color-ink-soft)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-soft" />
                      <span className="font-body text-[16px] text-sand sm:text-[17px]">
                        {item.name}
                        {item.extraPrice > 0 && (
                          <span className="tabular-nums text-gold">
                            {" "}
                            (+ {formatBRL(item.extraPrice)})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              // GROUPS [MULTIPLE]
              <fieldset
                key={group.id}
                id={`grupo-${group.id}`}
                className="mt-6 min-w-0"
              >
                <legend className={legendClass}>
                  {group.name}
                  {requiredMark}
                  {group.required && <span className="sr-only"> (obrigatório)</span>}
                </legend>
                {isMissing(group.id) && (
                  <p
                    role="alert"
                    className="mt-1 font-body text-[16px] font-bold text-red-400"
                  >
                    Selecione uma opção
                  </p>
                )}
                <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const isChecked = (
                      (selections[group.id] as string[]) ?? []
                    ).includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative h-4 w-4 shrink-0">
                            <input
                              type="checkbox"
                              value={item.id}
                              checked={isChecked}
                              onChange={() =>
                                handleMultipleToggle(group.id, item.id)
                              }
                              className="peer sr-only"
                            />
                            <span className="absolute inset-0 rounded-[4px] border-2 border-white/40 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-soft" />
                            <CheckIcon
                              weight="bold"
                              aria-hidden="true"
                              className="absolute inset-0 m-auto h-3 w-3 text-ink opacity-0 transition-opacity peer-checked:opacity-100"
                            />
                          </div>
                          <span className="min-w-0 break-words font-body text-[16px] text-sand sm:text-[17px]">
                            {item.name}
                          </span>
                        </div>
                        <span className="shrink-0 font-body text-[16px] font-semibold tabular-nums text-gold sm:text-[17px]">
                          {formatBRL(item.extraPrice)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {/* OBSERVAÇÕES */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor="produto-observacao"
                className={`${GROUP_TITLE_CLASS} text-parchment`}
              >
                Observação
              </label>
              <span
                aria-hidden="true"
                className="font-body text-[12px] tabular-nums text-sand"
              >
                {observation.length}/{OBSERVATION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="produto-observacao"
              name="observation"
              className="mt-1 w-full resize-none rounded-brand border border-white/15 bg-ink-deep p-3 font-body text-[17px] text-parchment placeholder:text-sand hover:border-white/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              rows={4}
              placeholder="Digite suas observações aqui…"
              value={observation}
              maxLength={OBSERVATION_MAX_LENGTH}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>

          {/* QUANTIDADE */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <span
              id="produto-quantidade"
              className={`${GROUP_TITLE_CLASS} text-parchment`}
            >
              Quantidade
            </span>
            <div
              role="group"
              aria-labelledby="produto-quantidade"
              className="flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuir quantidade"
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-brand bg-white/10 text-parchment transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
              >
                <MinusIcon weight="bold" size={16} />
              </button>
              <span
                aria-live="polite"
                className="min-w-6 text-center font-body text-[17px] font-bold tabular-nums text-parchment"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
                disabled={quantity >= MAX_QUANTITY}
                aria-label="Aumentar quantidade"
                className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-brand bg-white/10 text-parchment transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
              >
                <PlusIcon weight="bold" size={16} />
              </button>
            </div>
          </div>

          </div>
        </section>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-white/10 px-5 py-4 sm:px-8 sm:py-5">
          <div className="min-w-0">
            <span className="block font-body text-[14px] text-sand">
              Total
            </span>
            <span className="font-body text-[18px] font-bold tabular-nums text-parchment">
              {formatBRL(totalPrice)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            className={`min-h-12 w-[150px] shrink-0 cursor-pointer rounded-brand bg-brand-red py-2 font-body font-bold text-white transition-colors hover:bg-brand-red-dark sm:w-[210px] ${FOCUS_RING}`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
