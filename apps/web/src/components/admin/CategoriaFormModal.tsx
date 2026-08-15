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
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-[440px] bg-[#F3E9D2] rounded-[6px] p-8 transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between -mx-8 px-8 pb-4 border-b border-dashed border-[#C0A88F]">
          <h2 className="font-alfa text-[22px] text-[#171210]">
            {isEditing ? "Editar categoria" : "Nova categoria"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="text-[#8E8169] hover:text-[#3A2317] cursor-pointer transition-colors"
          >
            <XIcon size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6">
          <label
            htmlFor="categoria-nome"
            className="block font-oswald font-bold text-[#3A2317] text-[13px] tracking-[0.15em] mb-1.5"
          >
            NOME
          </label>
          <input
            id="categoria-nome"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white rounded-[5px] border border-[#D8C9A6] px-3.5 py-2.5 font-inter text-[15px] text-[#171210] outline-none transition-colors focus:border-[#6B3B1F] focus:ring-2 focus:ring-[#6B3B1F]/30"
          />

          {error && (
            <p
              role="alert"
              className="font-inter text-[14px] text-[#C81D25] mt-3"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 -mx-8 px-8 pt-5 mt-8 border-t border-dashed border-[#C0A88F]">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="font-oswald font-bold text-[14px] tracking-[0.05em] text-[#3A2317] px-4 py-2.5 rounded-[5px] hover:bg-[#3A2317]/10 cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="font-oswald font-bold text-[14px] tracking-[0.05em] text-[#F3E9D2] bg-[#4A7C2F] hover:bg-[#3F6A28] px-5 py-2.5 rounded-[5px] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
