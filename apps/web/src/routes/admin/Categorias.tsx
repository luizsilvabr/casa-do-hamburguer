import { useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { adminCategorias } from "../../lib/adminCategorias";
import { useToastStore } from "../../stores/toastStore";
import CategoriaFormModal from "../../components/admin/CategoriaFormModal";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import type { AdminCategory, CategoryStatusFilter } from "../../types/admin";

export default function Categorias() {
  const addToast = useToastStore((s) => s.addToast);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CategoryStatusFilter>("todas");

  const [modalTarget, setModalTarget] = useState<
    AdminCategory | null | undefined
  >(undefined);
  const [confirmTarget, setConfirmTarget] = useState<AdminCategory | null>(
    null,
  );

  async function load() {
    try {
      setIsLoading(true);
      setLoadError(null);
      setCategories(await adminCategorias.listAll());
    } catch {
      setLoadError("Não foi possível carregar as categorias.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.order - b.order || a.name.localeCompare(b.name);
      }),
    [categories],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sorted.filter((c) => {
      if (statusFilter === "ativas" && !c.isActive) return false;
      if (statusFilter === "inativas" && c.isActive) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [sorted, search, statusFilter]);

  const canReorder = search.trim() === "" && statusFilter === "todas";

  const activeSorted = useMemo(
    () => sorted.filter((c) => c.isActive),
    [sorted],
  );
  const firstActiveId = activeSorted[0]?.id;
  const lastActiveId = activeSorted[activeSorted.length - 1]?.id;

  const orderLabelById = useMemo(() => {
    const map = new Map<string, string>();
    let n = 0;
    for (const c of filtered) {
      if (c.isActive) {
        n += 1;
        map.set(c.id, String(n).padStart(2, "0"));
      } else {
        map.set(c.id, "—");
      }
    }
    return map;
  }, [filtered]);

  async function move(category: AdminCategory, direction: "up" | "down") {
    if (!category.isActive) return; // inativa não reordena

    const active = sorted.filter((c) => c.isActive);
    const idx = active.findIndex((c) => c.id === category.id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= active.length) return;

    const nextActive = [...active];
    [nextActive[idx], nextActive[target]] = [
      nextActive[target],
      nextActive[idx],
    ];

    const reordered = categories.map((c) => {
      const newOrder = nextActive.findIndex((a) => a.id === c.id);
      return newOrder === -1 ? c : { ...c, order: newOrder };
    });
    setCategories(reordered);

    const changed = reordered.filter((c) => {
      const original = categories.find((o) => o.id === c.id);
      return original && original.order !== c.order;
    });

    try {
      await Promise.all(
        changed.map((c) =>
          adminCategorias.update(c.id, { name: c.name, order: c.order }),
        ),
      );
    } catch {
      addToast("error", "Não foi possível salvar a nova ordem.");
      load();
    }
  }

  async function handleSubmitModal(name: string) {
    const editing = Boolean(modalTarget);
    if (modalTarget) {
      await adminCategorias.update(modalTarget.id, {
        name,
        order: modalTarget.order,
      });
    } else {
      const nextOrder = categories.length
        ? Math.max(...categories.map((c) => c.order)) + 1
        : 0;
      await adminCategorias.create({ name, order: nextOrder });
    }
    await load();
    addToast(
      "success",
      editing
        ? `Categoria "${name}" atualizada.`
        : `Categoria "${name}" adicionada.`,
    );
  }

  async function handleConfirmDeactivate() {
    if (!confirmTarget) return;
    const name = confirmTarget.name;
    try {
      await adminCategorias.deactivate(confirmTarget.id);
      await load();
      addToast("success", `Categoria "${name}" desativada.`);
    } catch {
      addToast("error", "Não foi possível desativar a categoria.");
    }
  }

  async function handleReactivate(category: AdminCategory) {
    try {
      await adminCategorias.reactivate(category.id);
      await load();
      addToast("success", `Categoria "${category.name}" reativada.`);
    } catch {
      addToast("error", "Não foi possível reativar a categoria.");
    }
  }

  return (
    <>
      {/* HEADER */}
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h1 className="font-alfa text-[28px] text-parchment leading-none sm:text-[36px]">
            Categorias
          </h1>
          <p className="font-body text-[16px] text-sand mt-2">
            Use as setas para ordenar — a ordem define a sequência no cardápio do cliente.
          </p>
        </div>

        <button
          onClick={() => setModalTarget(null)}
          className="shrink-0 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-brand bg-brand-red px-4 py-3 font-body text-[15px] font-bold text-white transition-colors hover:bg-brand-red-dark"
        >
          <PlusIcon size={16} weight="bold" />
          Nova categoria
        </button>
      </header>

      {/* BUSCA + FILTRO */}
      <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:mt-8">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full rounded-brand border border-white/15 bg-ink-deep py-3 pl-11 pr-4 font-body text-[16px] text-parchment outline-none transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        <div className="relative sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CategoryStatusFilter)
            }
            className="w-full appearance-none rounded-brand border border-white/15 bg-ink-deep py-3 pl-4 pr-10 font-body text-[16px] text-parchment outline-none transition-colors hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30 cursor-pointer"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
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
          <p className="font-body text-sand">Carregando categorias...</p>
        ) : loadError ? (
          <p className="font-body text-red-400">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="font-body text-sand">
            Nenhuma categoria encontrada.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((category) => {
              const canMove = canReorder && category.isActive;
              const disableUp = !canMove || category.id === firstActiveId;
              const disableDown = !canMove || category.id === lastActiveId;

              return (
                <li key={category.id} className="flex items-stretch overflow-hidden rounded-card border border-white/10 bg-ink-soft">
                  {/* BADGE DE ORDEM */}
                  <div className="shrink-0 w-[60px] sm:w-[86px] bg-white/5 border-r border-white/10 flex flex-col items-center justify-center py-3">
                    <span className="font-body text-[10px] font-bold tracking-[0.18em] text-sand">
                      ORDEM
                    </span>
                    <span className="font-alfa text-[22px] text-gold leading-none my-0.5">
                      {orderLabelById.get(category.id)}
                    </span>
                    {category.isActive && (
                      <div className="flex gap-1">
                        <button
                          aria-label="Mover para cima"
                          disabled={disableUp}
                          onClick={() => move(category, "up")}
                          className="flex h-8 w-8 items-center justify-center text-sand hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer sm:h-auto sm:w-auto"
                        >
                          <CaretUpIcon size={14} weight="bold" />
                        </button>
                        <button
                          aria-label="Mover para baixo"
                          disabled={disableDown}
                          onClick={() => move(category, "down")}
                          className="flex h-8 w-8 items-center justify-center text-sand hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer sm:h-auto sm:w-auto"
                        >
                          <CaretDownIcon size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CARD */}
                  <div
                    className={`flex-1 min-w-0 flex items-center justify-between gap-3 px-3 py-4 sm:gap-4 sm:px-6 ${
                      category.isActive ? "" : "opacity-60"
                    }`}
                  >
                    <div className="min-w-0">
                      <h2 className="font-alfa text-[17px] text-parchment truncate">
                        {category.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {category.isActive ? (
                          <span className="font-body text-[11px] font-bold tracking-[0.08em] text-gold border border-gold/50 rounded-full px-2 py-0.5">
                            ATIVA
                          </span>
                        ) : (
                          <span className="font-body text-[11px] font-bold tracking-[0.08em] text-sand border border-white/20 rounded-full px-2 py-0.5">
                            INATIVA
                          </span>
                        )}
                        <span className="font-body text-[11px] font-bold tracking-[0.08em] text-sand border border-white/20 rounded-full px-2 py-0.5">
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "PRODUTO" : "PRODUTOS"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 sm:gap-3">
                      <button
                        aria-label="Editar categoria"
                        onClick={() => setModalTarget(category)}
                        className="flex h-10 w-10 items-center justify-center text-sand hover:text-parchment cursor-pointer transition-colors sm:h-auto sm:w-auto"
                      >
                        <PencilSimpleIcon size={20} />
                      </button>
                      {category.isActive ? (
                        <button
                          aria-label="Desativar categoria"
                          onClick={() => setConfirmTarget(category)}
                          className="flex h-10 w-10 items-center justify-center text-sand hover:text-red-400 cursor-pointer transition-colors sm:h-auto sm:w-auto"
                        >
                          <TrashIcon size={20} />
                        </button>
                      ) : (
                        <button
                          aria-label="Reativar categoria"
                          onClick={() => handleReactivate(category)}
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
        )}
      </div>

      {/* MODAIS */}
      {modalTarget !== undefined && (
        <CategoriaFormModal
          category={modalTarget}
          onSubmit={handleSubmitModal}
          onClose={() => setModalTarget(undefined)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Desativar categoria?"
          message={`A categoria "${confirmTarget.name}" deixará de aparecer no cardápio do cliente. Você pode reativá-la depois.`}
          confirmLabel="Desativar"
          onConfirm={handleConfirmDeactivate}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </>
  );
}
