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
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-alfa text-[36px] text-[#F3E9D2] leading-none">
            Categorias
          </h1>
          <p className="font-inter text-[15px] text-[#9B8F7D] mt-2">
            Arraste pela ordem — ela define a sequência no cardápio do cliente.
          </p>
        </div>

        <button
          onClick={() => setModalTarget(null)}
          className="shrink-0 flex items-center gap-1.5 bg-[#4A7C2F] hover:bg-[#3F6A28] text-[#F3E9D2] font-oswald font-bold text-[13px] tracking-[0.08em] px-4 py-3 rounded-[6px] cursor-pointer transition-colors"
        >
          <PlusIcon size={16} weight="bold" />
          NOVA CATEGORIA
        </button>
      </header>

      {/* BUSCA + FILTRO */}
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
            placeholder="Buscar categoria..."
            className="w-full bg-[#171210] border border-[#3A2317] rounded-[8px] pl-11 pr-4 py-3 font-inter text-[15px] text-[#F3E9D2] placeholder:text-[#8E8169] outline-none focus:border-[#6B3B1F] transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CategoryStatusFilter)
            }
            className="appearance-none bg-[#171210] border border-[#3A2317] rounded-[8px] pl-4 pr-10 py-3 font-inter text-[15px] text-[#F3E9D2] outline-none focus:border-[#6B3B1F] cursor-pointer transition-colors"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
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
          <p className="font-inter text-[#C4B49A]">Carregando categorias...</p>
        ) : loadError ? (
          <p className="font-inter text-[#C81D25]">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="font-inter text-[#C4B49A]">
            Nenhuma categoria encontrada.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((category) => {
              const canMove = canReorder && category.isActive;
              const disableUp = !canMove || category.id === firstActiveId;
              const disableDown = !canMove || category.id === lastActiveId;

              return (
                <li key={category.id} className="flex items-stretch">
                  {/* BADGE DE ORDEM */}
                  <div className="shrink-0 w-[86px] bg-[#3A2317] rounded-l-[8px] flex flex-col items-center justify-center py-3">
                    <span className="font-oswald text-[10px] tracking-[0.18em] text-[#C0A88F]">
                      ORDEM
                    </span>
                    <span className="font-alfa text-[22px] text-[#F0C264] leading-none my-0.5">
                      {orderLabelById.get(category.id)}
                    </span>
                    {category.isActive && (
                      <div className="flex gap-1">
                        <button
                          aria-label="Mover para cima"
                          disabled={disableUp}
                          onClick={() => move(category, "up")}
                          className="text-[#C0A88F] hover:text-[#F0C264] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <CaretUpIcon size={14} weight="bold" />
                        </button>
                        <button
                          aria-label="Mover para baixo"
                          disabled={disableDown}
                          onClick={() => move(category, "down")}
                          className="text-[#C0A88F] hover:text-[#F0C264] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <CaretDownIcon size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CARD */}
                  <div
                    className={`flex-1 min-w-0 bg-[#F3E9D2] rounded-r-[8px] flex items-center justify-between gap-4 px-6 py-4 ${
                      category.isActive ? "" : "opacity-60"
                    }`}
                  >
                    <div className="min-w-0">
                      <h2 className="font-oswald font-bold text-[19px] text-[#171210] truncate">
                        {category.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1.5">
                        {category.isActive ? (
                          <span className="font-oswald text-[10px] tracking-[0.1em] text-[#4A7C2F] border border-[#4A7C2F] rounded-full px-2 py-0.5">
                            ATIVA
                          </span>
                        ) : (
                          <span className="font-oswald text-[10px] tracking-[0.1em] text-[#9B8F7D] border border-[#9B8F7D] rounded-full px-2 py-0.5">
                            INATIVA
                          </span>
                        )}
                        <span className="font-oswald text-[10px] tracking-[0.1em] text-[#C08A2E] border border-[#C08A2E] rounded-full px-2 py-0.5">
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "PRODUTO" : "PRODUTOS"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <button
                        aria-label="Editar categoria"
                        onClick={() => setModalTarget(category)}
                        className="text-[#3A2317] hover:text-[#171210] cursor-pointer transition-colors"
                      >
                        <PencilSimpleIcon size={20} />
                      </button>
                      {category.isActive ? (
                        <button
                          aria-label="Desativar categoria"
                          onClick={() => setConfirmTarget(category)}
                          className="text-[#3A2317] hover:text-[#C81D25] cursor-pointer transition-colors"
                        >
                          <TrashIcon size={20} />
                        </button>
                      ) : (
                        <button
                          aria-label="Reativar categoria"
                          onClick={() => handleReactivate(category)}
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
