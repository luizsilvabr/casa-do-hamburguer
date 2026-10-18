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
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="font-alfa text-[28px] text-parchment leading-none sm:text-[36px]">
            Produtos
          </h1>
          <p className="font-body text-[16px] text-sand mt-2">
            Cada produto pode ter grupos de opção (ponto da carne, adicionais).
          </p>
        </div>

        <button
          onClick={() => setModalTarget(null)}
          className="shrink-0 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-brand bg-brand-red px-4 py-3 font-body text-[15px] font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          <PlusIcon size={16} weight="bold" />
          Novo produto
        </button>
      </header>

      {/* BUSCA + FILTROS */}
      <div className="flex flex-wrap gap-3 mt-6 sm:mt-8">
        <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full rounded-brand border border-white/15 bg-ink-deep py-3 pl-11 pr-4 font-body text-[16px] text-parchment outline-none transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none rounded-brand border border-white/15 bg-ink-deep py-3 pl-4 pr-10 font-body text-[16px] text-parchment outline-none transition-colors hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30 cursor-pointer"
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
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand pointer-events-none"
          />
        </div>

        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full appearance-none rounded-brand border border-white/15 bg-ink-deep py-3 pl-4 pr-10 font-body text-[16px] text-parchment outline-none transition-colors hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30 cursor-pointer"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativos</option>
            <option value="inativas">Inativos</option>
          </select>
          <CaretDownIcon
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sand pointer-events-none"
          />
        </div>
      </div>

      {/* LISTA */}
      <div className="mt-6 sm:mt-8">
        {isLoading ? (
          <p className="font-body text-sand">Carregando produtos...</p>
        ) : loadError ? (
          <p className="font-body text-red-400">{loadError}</p>
        ) : totalItems === 0 ? (
          <p className="font-body text-sand">
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
                  <li key={product.id} className="flex items-stretch overflow-hidden rounded-card border border-white/10 bg-ink-soft">
                    {/* BADGE DE ITEM */}
                    <div className="hidden sm:flex shrink-0 w-[86px] bg-white/5 border-r border-white/10 flex-col items-center justify-center py-3">
                      <span className="font-body text-[10px] font-bold tracking-[0.18em] text-sand">
                        ITEM
                      </span>
                      <span className="font-alfa text-[22px] text-gold leading-none mt-0.5">
                        {String(itemNumber).padStart(2, "0")}
                      </span>
                    </div>

                    {/* CARD */}
                    <div
                      className={`flex-1 min-w-0 flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 ${
                        product.isActive ? "" : "opacity-60"
                      }`}
                    >
                      {/* THUMBNAIL */}
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="shrink-0 w-[60px] h-[52px] sm:w-[76px] sm:h-[64px] object-cover rounded-brand"
                        />
                      ) : (
                        <div className="shrink-0 w-[60px] h-[52px] sm:w-[76px] sm:h-[64px] rounded-brand bg-white/10 flex items-center justify-center text-sand">
                          <HamburgerIcon size={26} />
                        </div>
                      )}

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h2 className="font-alfa text-[16px] text-parchment truncate">
                            {product.name}
                          </h2>
                          <span className="shrink-0 font-body text-[15px] font-bold tabular-nums text-gold">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        {product.description && (
                          <p className="font-body text-[14px] text-sand truncate mt-0.5">
                            {product.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="font-body text-[11px] font-bold tracking-[0.08em] text-sand border border-white/20 rounded-full px-2 py-0.5 uppercase">
                            {categoryName}
                          </span>
                          {product.isActive ? (
                            <span className="font-body text-[11px] font-bold tracking-[0.08em] text-gold border border-gold/50 rounded-full px-2 py-0.5">
                              ATIVO
                            </span>
                          ) : (
                            <span className="font-body text-[11px] font-bold tracking-[0.08em] text-sand border border-white/20 rounded-full px-2 py-0.5">
                              INATIVO
                            </span>
                          )}
                          <span className="font-body text-[11px] font-bold tracking-[0.08em] text-sand border border-white/20 rounded-full px-2 py-0.5">
                            {product.optionGroupCount}{" "}
                            {product.optionGroupCount === 1
                              ? "GRUPO DE OPÇÃO"
                              : "GRUPOS DE OPÇÃO"}
                          </span>
                        </div>
                      </div>

                      {/* AÇÕES */}
                      <div className="shrink-0 flex flex-col items-center sm:flex-row gap-1 sm:gap-3 sm:mr-[15px]">
                        <button
                          aria-label="Editar produto"
                          onClick={() => setModalTarget(product)}
                          className="flex h-10 w-10 items-center justify-center text-sand hover:text-parchment cursor-pointer transition-colors sm:h-auto sm:w-auto"
                        >
                          <PencilSimpleIcon size={20} />
                        </button>
                        {product.isActive ? (
                          <button
                            aria-label="Desativar produto"
                            onClick={() => setConfirmTarget(product)}
                            className="flex h-10 w-10 items-center justify-center text-sand hover:text-red-400 cursor-pointer transition-colors sm:h-auto sm:w-auto"
                          >
                            <TrashIcon size={20} />
                          </button>
                        ) : (
                          <button
                            aria-label="Reativar produto"
                            onClick={() => handleReactivate(product)}
                            className="flex h-10 w-10 items-center justify-center text-sand hover:text-gold cursor-pointer transition-colors sm:h-auto sm:w-auto"
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
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 font-body text-[14px] text-sand">
                <span>Itens por página:</span>
                <div className="relative">
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="appearance-none rounded-brand border border-white/15 bg-ink-deep py-1.5 pl-3 pr-8 text-parchment outline-none focus:border-gold cursor-pointer transition-colors"
                  >
                    {PER_PAGE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <CaretDownIcon
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sand pointer-events-none"
                  />
                </div>
                <span className="ml-2">
                  {start + 1}–{start + paginated.length} de {totalItems}
                </span>
              </div>

              <div className="flex items-center gap-3 font-body text-[14px] text-sand">
                <button
                  aria-label="Página anterior"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="flex items-center justify-center w-10 h-10 rounded-brand border border-white/15 text-parchment hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                  className="flex items-center justify-center w-10 h-10 rounded-brand border border-white/15 text-parchment hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
