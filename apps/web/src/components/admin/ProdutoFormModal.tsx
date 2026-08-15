import { useEffect, useState, type FormEvent } from "react";
import { CaretDownIcon, ImageIcon, XIcon } from "@phosphor-icons/react";
import { HttpError } from "../../lib/http";
import { resolveImageUrl, uploadImage } from "../../lib/images";
import type {
  AdminCategory,
  AdminProduct,
  ProductInput,
} from "../../types/admin";

interface ProdutoFormModalProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  onSubmit: (data: ProductInput) => Promise<void>;
  onClose: () => void;
}

const ANIM_MS = 200;

function priceToInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function parsePrice(value: string): number {
  return Number(value.trim().replace(/\./g, "").replace(",", "."));
}

const inputClass =
  "w-full bg-white rounded-[5px] border border-[#D8C9A6] px-3.5 py-2.5 font-inter text-[15px] text-[#171210] outline-none transition-colors focus:border-[#6B3B1F] focus:ring-2 focus:ring-[#6B3B1F]/30";

const labelClass =
  "block font-oswald font-bold text-[#3A2317] text-[13px] tracking-[0.15em] mb-1.5";

export default function ProdutoFormModal({
  product,
  categories,
  onSubmit,
  onClose,
}: ProdutoFormModalProps) {
  const isEditing = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? "",
  );
  const [price, setPrice] = useState(
    product ? priceToInput(product.price) : "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImageError(null);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setImageError(
        err instanceof HttpError
          ? err.message
          : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Informe o nome do produto.");
      return;
    }
    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    const parsedPrice = parsePrice(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Informe um preço válido (maior que zero).");
      return;
    }

    const data: ProductInput = {
      name: trimmedName,
      categoryId,
      price: parsedPrice,
      ...(description.trim() && { description: description.trim() }),
      ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }),
    };

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(data);
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
        className={`relative w-full max-w-[520px] bg-[#F3E9D2] rounded-[6px] px-8 py-4 max-h-[90vh] overflow-y-auto overflow-x-hidden transition-transform duration-200 ${
          show ? "scale-100" : "scale-95"
        }`}
      >
        <div className="flex items-center justify-between -mx-8 px-8 pb-4 pt-2 border-b border-dashed border-[#C0A88F]">
          <h2 className="font-alfa text-[22px] text-[#171210]">
            {isEditing ? "Editar produto" : "Novo produto"}
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
          <div className="mb-4">
            <label htmlFor="produto-nome" className={labelClass}>
              NOME
            </label>
            <input
              id="produto-nome"
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <label htmlFor="produto-categoria" className={labelClass}>
                CATEGORIA
              </label>
              <div className="relative">
                <select
                  id="produto-categoria"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white rounded-[5px] border border-[#D8C9A6] pl-3.5 pr-10 py-2.5 font-inter text-[15px] text-[#171210] outline-none transition-colors focus:border-[#6B3B1F] focus:ring-2 focus:ring-[#6B3B1F]/30 appearance-none cursor-pointer"
                >
                  {categories.length === 0 && (
                    <option value="">Nenhuma categoria</option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isActive ? "" : " (inativa)"}
                    </option>
                  ))}
                </select>
                <CaretDownIcon
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8169] pointer-events-none"
                />
              </div>
            </div>

            <div className="w-[140px] shrink-0">
              <label htmlFor="produto-preco" className={labelClass}>
                PREÇO (R$)
              </label>
              <input
                id="produto-preco"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="produto-descricao" className={labelClass}>
              DESCRIÇÃO
            </label>
            <textarea
              id="produto-descricao"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none thin-scroll`}
            />
          </div>

          <div>
            <span className={labelClass}>IMAGEM</span>
            <div className="flex items-center gap-4">
              {resolveImageUrl(imageUrl) ? (
                <img
                  src={resolveImageUrl(imageUrl)}
                  alt="Prévia da imagem"
                  className="w-[80px] h-[66px] object-cover rounded-[5px] border border-[#D8C9A6]"
                />
              ) : (
                <div className="w-[80px] h-[66px] rounded-[5px] bg-[#E4D6B8] flex items-center justify-center text-[#B0A488]">
                  <ImageIcon size={26} />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  className={`inline-flex items-center justify-center font-oswald font-bold text-[13px] tracking-[0.05em] rounded-[5px] px-4 py-2 transition-colors ${
                    uploading
                      ? "bg-[#D8C9A6] text-[#8E8169] cursor-not-allowed"
                      : "bg-[#3A2317] text-[#F3E9D2] hover:bg-[#4a2f1e] cursor-pointer"
                  }`}
                >
                  {uploading ? "Enviando..." : "Escolher imagem"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileChange}
                  />
                </label>

                {imageUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-left font-inter text-[13px] text-[#C81D25] hover:underline cursor-pointer"
                  >
                    Remover imagem
                  </button>
                )}
              </div>
            </div>

            {imageError && (
              <p
                role="alert"
                className="font-inter text-[14px] text-[#C81D25] mt-2"
              >
                {imageError}
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="font-inter text-[14px] text-[#C81D25] mt-4"
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
              disabled={submitting || uploading}
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
