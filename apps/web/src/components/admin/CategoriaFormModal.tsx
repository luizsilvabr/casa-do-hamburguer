import { useEffect, useState, type FormEvent } from "react";
import { XIcon } from "@phosphor-icons/react";
import { HttpError } from "../../lib/http";
import type { AdminCategory } from "../../types/admin";

interface CategoriaFormModalProps {
  category: AdminCategory | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

const ANIM_MS = 200;

export default function CategoriaFormModal({
  category,
  onSubmit,
  onClose,
}: CategoriaFormModalProps) {
  const isEditing = category !== null;

  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  function close() {
    if (submitting) return;
    setShow(false);
    setTimeout(onClose, ANIM_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Informe o nome da categoria.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setShow(false);
      setTimeout(onClose, ANIM_MS);
    } catch (err) {
      setError(
        err instanceof HttpError
          ? err.message
          : "Não foi possível salvar. Tente novamente.",
      );
      setSubmitting(false);
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
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-[440px] max-h-[92dvh] overflow-y-auto bg-ink-soft border border-white/10 rounded-card p-5 sm:p-8 transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between -mx-5 px-5 sm:-mx-8 sm:px-8 pb-4 border-b border-white/10">
          <h2 className="font-alfa text-[22px] text-parchment">
            {isEditing ? "Editar categoria" : "Nova categoria"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center text-sand hover:text-parchment cursor-pointer transition-colors"
          >
            <XIcon size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6">
          <label
            htmlFor="categoria-nome"
            className="mb-1.5 block font-body text-[13px] font-bold uppercase tracking-[0.12em] text-sand"
          >
            NOME
          </label>
          <input
            id="categoria-nome"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-brand border border-white/15 bg-ink-deep px-3.5 py-3 font-body text-[16px] text-parchment outline-none transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30"
          />

          {error && (
            <p
              role="alert"
              className="font-body text-[15px] text-red-400 mt-3"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 -mx-5 px-5 sm:-mx-8 sm:px-8 pt-5 mt-8 border-t border-white/10">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="cursor-pointer rounded-brand px-4 py-2.5 font-body text-[16px] font-semibold text-sand transition-colors hover:bg-white/10 hover:text-parchment disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-brand bg-brand-red px-5 py-2.5 font-body text-[16px] font-bold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
