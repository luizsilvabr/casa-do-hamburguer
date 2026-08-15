import { useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  HamburgerIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { adminProdutos } from "../../lib/adminProdutos";
import { adminCategorias } from "../../lib/adminCategorias";
import { resolveImageUrl } from "../../lib/images";
import { useToastStore } from "../../stores/toastStore";
import ProdutoFormModal from "../../components/admin/ProdutoFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import type {
  AdminCategory,
  AdminProduct,
  ProductInput,
  StatusFilter,
} from "../../types/admin";

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Produtos() {
  const addToast = useToastStore((s) => s.addToast);

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [modalTarget, setModalTarget] = useState<
    AdminProduct | null | undefined
  >(undefined);
  const [confirmTarget, setConfirmTarget] = useState<AdminProduct | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [produtos, categorias] = await Promise.all([
        adminProdutos.listAll(),
        adminCategorias.listAll(),
      ]);
      setProducts(produtos);
      setCategories(categorias);
    } catch {
      setLoadError("Não foi possível carregar os produtos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, perPage]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...products]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((p) => {
        if (statusFilter === "ativas" && !p.isActive) return false;
        if (statusFilter === "inativas" && p.isActive) return false;
        if (categoryFilter !== "todas" && p.categoryId !== categoryFilter)
          return false;
        if (term && !p.name.toLowerCase().includes(term)) return false;
        return true;
      });
  }, [products, search, categoryFilter, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const paginated = filtered.slice(start, start + perPage);

  async function handleSubmitModal(data: ProductInput) {
    const editing = Boolean(modalTarget);
    if (modalTarget) {
      await adminProdutos.update(modalTarget.id, data);
    } else {
      await adminProdutos.create(data);
    }
    await load();
    addToast(
      "success",
      editing
        ? `Produto "${data.name}" atualizado.`
        : `Produto "${data.name}" adicionado.`,
    );
  }

  async function handleConfirmDeactivate() {
    if (!confirmTarget) return;
    const name = confirmTarget.name;
    try {
      await adminProdutos.deactivate(confirmTarget.id);
      await load();
      addToast("success", `Produto "${name}" desativado.`);
    } catch {
      addToast("error", "Não foi possível desativar o produto.");
    }
  }

  async function handleReactivate(product: AdminProduct) {
    try {
      await adminProdutos.reactivate(product.id);
      await load();
      addToast("success", `Produto "${product.name}" reativado.`);
    } catch {
      addToast("error", "Não foi possível reativar o produto.");
    }
  }

  return (
    <>
      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-alfa text-[36px] text-[#F3E9D2] leading-none">
            Produtos
          </h1>
          <p className="font-inter text-[15px] text-[#9B8F7D] mt-2">
            Cada produto pode ter grupos de opção (ponto da carne, adicionais).
          </p>
        </div>

        <button
          onClick={() => setModalTarget(null)}
          className="shrink-0 flex items-center gap-1.5 bg-[#4A7C2F] hover:bg-[#3F6A28] text-[#F3E9D2] font-oswald font-bold text-[13px] tracking-[0.08em] px-4 py-3 rounded-[6px] cursor-pointer transition-colors"
        >
          <PlusIcon size={16} weight="bold" />
          NOVO PRODUTO
        </button>
      </header>

      {/* BUSCA + FILTROS */}
      <div className="flex gap-3 mt-8">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8169]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-[#171210] border border-[#3A2317] rounded-[8px] pl-11 pr-4 py-3 font-inter text-[15px] text-[#F3E9D2] placeholder:text-[#8E8169] outline-none focus:border-[#6B3B1F] transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none bg-[#171210] border border-[#3A2317] rounded-[8px] pl-4 pr-10 py-3 font-inter text-[15px] text-[#F3E9D2] outline-none focus:border-[#6B3B1F] cursor-pointer transition-colors"
          >
            <option value="todas">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <CaretDownIcon
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8169] pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="appearance-none bg-[#171210] border border-[#3A2317] rounded-[8px] pl-4 pr-10 py-3 font-inter text-[15px] text-[#F3E9D2] outline-none focus:border-[#6B3B1F] cursor-pointer transition-colors"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativos</option>
            <option value="inativas">Inativos</option>
          </select>
          <CaretDownIcon
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E8169] pointer-events-none"
          />
        </div>
      </div>

      {/* LISTA */}
      <div className="mt-8">
        {isLoading ? (
          <p className="font-inter text-[#C4B49A]">Carregando produtos...</p>
        ) : loadError ? (
          <p className="font-inter text-[#C81D25]">{loadError}</p>
        ) : totalItems === 0 ? (
          <p className="font-inter text-[#C4B49A]">
            Nenhum produto encontrado.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {paginated.map((product, localIndex) => {
                const itemNumber = start + localIndex + 1;
                const categoryName =
                  categoryNameById.get(product.categoryId) ?? "Sem categoria";
                const thumb = resolveImageUrl(product.imageUrl);

                return (
                  <li key={product.id} className="flex items-stretch">
                    {/* BADGE DE ITEM */}
                    <div className="shrink-0 w-[86px] bg-[#3A2317] rounded-l-[8px] flex flex-col items-center justify-center py-3">
                      <span className="font-oswald text-[10px] tracking-[0.18em] text-[#C0A88F]">
                        ITEM
                      </span>
                      <span className="font-alfa text-[22px] text-[#F0C264] leading-none mt-0.5">
                        {String(itemNumber).padStart(2, "0")}
                      </span>
                    </div>

                    {/* CARD */}
                    <div
                      className={`flex-1 min-w-0 bg-[#F3E9D2] rounded-r-[8px] flex items-center gap-4 px-4 py-3 ${
                        product.isActive ? "" : "opacity-60"
                      }`}
                    >
                      {/* THUMBNAIL */}
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="shrink-0 w-[76px] h-[64px] object-cover rounded-[5px]"
                        />
                      ) : (
                        <div className="shrink-0 w-[76px] h-[64px] rounded-[5px] bg-[#E4D6B8] flex items-center justify-center text-[#B0A488]">
                          <HamburgerIcon size={26} />
                        </div>
                      )}

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h2 className="font-oswald font-bold text-[18px] text-[#171210] truncate">
                            {product.name}
                          </h2>
                          <span className="shrink-0 font-inter text-[13px] text-[#8E8169]">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="font-inter text-[13px] text-[#8E8169] truncate mt-0.5">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-oswald text-[10px] tracking-[0.1em] text-[#8E8169] border border-[#8E8169] rounded-full px-2 py-0.5 uppercase">
                            {categoryName}
                          </span>
                          {product.isActive ? (
                            <span className="font-oswald text-[10px] tracking-[0.1em] text-[#4A7C2F] border border-[#4A7C2F] rounded-full px-2 py-0.5">
                              ATIVO
                            </span>
                          ) : (
                            <span className="font-oswald text-[10px] tracking-[0.1em] text-[#9B8F7D] border border-[#9B8F7D] rounded-full px-2 py-0.5">
                              INATIVO
                            </span>
                          )}
                          <span className="font-oswald text-[10px] tracking-[0.1em] text-[#C08A2E] border border-[#C08A2E] rounded-full px-2 py-0.5">
                            {product.optionGroupCount}{" "}
                            {product.optionGroupCount === 1
                              ? "GRUPO DE OPÇÃO"
                              : "GRUPOS DE OPÇÃO"}
                          </span>
                        </div>
                      </div>

                      {/* AÇÕES */}
                      <div className="shrink-0 flex items-center gap-3 mr-[15px]">
                        <button
                          aria-label="Editar produto"
                          onClick={() => setModalTarget(product)}
                          className="text-[#3A2317] hover:text-[#171210] cursor-pointer transition-colors"
                        >
                          <PencilSimpleIcon size={20} />
                        </button>
                        {product.isActive ? (
                          <button
                            aria-label="Desativar produto"
                            onClick={() => setConfirmTarget(product)}
                            className="text-[#3A2317] hover:text-[#C81D25] cursor-pointer transition-colors"
                          >
                            <TrashIcon size={20} />
                          </button>
                        ) : (
                          <button
                            aria-label="Reativar produto"
                            onClick={() => handleReactivate(product)}
                            className="text-[#3A2317] hover:text-[#4A7C2F] cursor-pointer transition-colors"
                          >
                            <ArrowCounterClockwiseIcon size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* PAGINAÇÃO */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2 font-inter text-[13px] text-[#9B8F7D]">
                <span>Itens por página:</span>
                <div className="relative">
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="appearance-none bg-[#171210] border border-[#3A2317] rounded-[6px] pl-3 pr-8 py-1.5 text-[#F3E9D2] outline-none focus:border-[#6B3B1F] cursor-pointer transition-colors"
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8169] pointer-events-none"
                  />
                </div>
                <span className="ml-2">
                  {start + 1}–{start + paginated.length} de {totalItems}
                </span>
              </div>

              <div className="flex items-center gap-3 font-inter text-[13px] text-[#C4B49A]">
                <button
                  aria-label="Página anterior"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#3A2317] text-[#F3E9D2] hover:bg-[#3A2317] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <CaretLeftIcon size={16} weight="bold" />
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  aria-label="Próxima página"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="flex items-center justify-center w-8 h-8 rounded-[6px] border border-[#3A2317] text-[#F3E9D2] hover:bg-[#3A2317] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <CaretRightIcon size={16} weight="bold" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAIS */}
      {modalTarget !== undefined && (
        <ProdutoFormModal
          product={modalTarget}
          categories={categories}
          onSubmit={handleSubmitModal}
          onClose={() => setModalTarget(undefined)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Desativar produto?"
          message={`O produto "${confirmTarget.name}" deixará de aparecer no cardápio do cliente. Você pode reativá-lo depois.`}
          confirmLabel="Desativar"
          onConfirm={handleConfirmDeactivate}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </>
  );
}
