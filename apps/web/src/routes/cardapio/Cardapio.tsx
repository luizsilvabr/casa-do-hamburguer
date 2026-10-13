import { useEffect, useState } from "react";
import {
  PlusIcon,
  SlidersHorizontalIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import ProdutoModal from "../../components/produto/ProdutoModal";
import { http } from "../../lib/http";
import { formatBRL } from "../../lib/format";
import { resolveImageUrl } from "../../lib/images";
import {
  BELOW_HEADER_TOP,
  FOCUS_RING,
  PAGE_MAX,
  PAGE_X,
  TOUCH_TARGET,
} from "../../lib/site";
import { useCartStore } from "../../stores/cartStore";
import { useSiteToastStore } from "../../stores/siteToastStore";
import type { Category, Product } from "../../types";

// Categoria "Todos" não existe no banco — é só uma opção visual fixa,
// sempre primeira e pré-selecionada, que mostra o cardápio inteiro sem filtro.
const ALL_CATEGORY_ID = "todos";
const ALL_CATEGORY: Category = {
  id: ALL_CATEGORY_ID,
  name: "Todos",
  order: -1, // sempre primeiro, antes de qualquer order vindo da API
  isActive: true,
};

function normalizeProduct(produto: Product): Product {
  return {
    ...produto,
    price: Number(produto.price),
    optionGroups: produto.optionGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        extraPrice: Number(item.extraPrice),
      })),
    })),
  };
}

// Esqueleto do card enquanto o cardápio carrega — mesma forma do card real,
// pra a página não "pular" quando os dados chegam.
function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse overflow-hidden rounded-card border border-white/10 bg-ink-soft md:flex-col"
    >
      <div className="h-[132px] w-[116px] shrink-0 bg-white/6 md:aspect-4/3 md:h-auto md:w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="h-5 w-2/3 rounded bg-white/10" />
        <div className="h-3.5 w-full rounded bg-white/6" />
        <div className="h-3.5 w-4/5 rounded bg-white/6" />
        <div className="mt-auto h-6 w-20 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function Cardapio() {
  const addItem = useCartStore((state) => state.addItem);
  const showToast = useSiteToastStore((state) => state.show);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // fade no grid ao trocar categoria: só troca o CONTEÚDO exibido
  // (displayedProducts) depois que o fade-out visual já rodou por completo —
  // por isso duration precisa bater com o duration-200 da classe Tailwind
  const FADE_MS = 200;
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [displayedCategory, setDisplayedCategory] = useState<Category | null>(
    null,
  );
  const [isGridVisible, setIsGridVisible] = useState(true);

  useEffect(() => {
    setIsGridVisible(false);
    const timeout = setTimeout(() => {
      setDisplayedProducts(filteredProducts);
      setDisplayedCategory(selectedCategory ?? null);
      setIsGridVisible(true);
    }, FADE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, products]);

  // isLoading/error nascem em "carregando / sem erro"; o retry zera os dois e
  // muda reloadKey, o que roda a busca de novo
  useEffect(() => {
    async function loadCardapio() {
      try {
        const [categoriasData, produtosData] = await Promise.all([
          http.get<Category[]>("/categorias"),
          http.get<Product[]>("/produtos"),
        ]);

        setCategories(categoriasData);
        setProducts(produtosData.map(normalizeProduct));
        // selectedCategoryId já começa em ALL_CATEGORY_ID — não precisa
        // mexer nele aqui, "Todos" continua selecionado até o usuário clicar
      } catch {
        setError("Não foi possível carregar o cardápio.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCardapio();
  }, [reloadKey]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }

  // Produto sem grupos de opções não precisa de modal: entra direto no carrinho
  // (quem quiser observação ou adicionais usa os produtos que têm opções).
  function handleAdd(produto: Product) {
    if (produto.optionGroups.length > 0) {
      setSelectedProduct(produto);
      return;
    }
    addItem({
      productId: produto.id,
      name: produto.name,
      imageUrl: produto.imageUrl,
      basePrice: produto.price,
      quantity: 1,
      selectedOptions: [],
      observation: undefined,
    });
    showToast(`${produto.name} adicionado`);
  }

  // "Todos" sempre primeiro, seguido das categorias reais vindas da API
  const categoriesWithAll: Category[] = [ALL_CATEGORY, ...categories];

  const selectedCategory = categoriesWithAll.find(
    (c) => c.id === selectedCategoryId,
  );

  // mapa categoryId -> order, pra não precisar de um .find() por produto
  const categoryOrderById = new Map(categories.map((c) => [c.id, c.order]));

  const filteredProducts =
    selectedCategoryId === ALL_CATEGORY_ID
      ? [...products].sort((a, b) => {
          const orderA = categoryOrderById.get(a.categoryId) ?? 0;
          const orderB = categoryOrderById.get(b.categoryId) ?? 0;
          return orderA - orderB; // dentro da mesma order, mantém a ordem alfabética que já veio da API
        })
      : products.filter((p) => p.categoryId === selectedCategoryId);

  // Seções do que está na tela: em "Todos", uma por categoria (na ordem da API);
  // numa categoria só, uma seção com o nome dela.
  const sections =
    displayedCategory?.id === ALL_CATEGORY_ID
      ? categories
          .map((category) => ({
            category,
            items: displayedProducts.filter((p) => p.categoryId === category.id),
          }))
          .filter((section) => section.items.length > 0)
      : displayedCategory
        ? [{ category: displayedCategory, items: displayedProducts }]
        : [];

  // posição de cada produto na tela: só as primeiras fotos carregam já
  const positionById = new Map(displayedProducts.map((p, i) => [p.id, i]));

  return (
    <main className="bg-ink">
      <title>Cardápio | Casa do Hambúrguer</title>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="relative overflow-hidden border-b border-white/10 bg-ink-deep">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_140%_at_85%_0%,rgb(240_194_100/0.16),transparent_70%)]"
        />
        <div className={`${PAGE_X} ${PAGE_MAX} relative py-9 sm:py-12`}>
          <h1 className="font-alfa text-[clamp(2.25rem,5vw,3.5rem)] uppercase leading-none text-parchment">
            Cardápio
          </h1>
          <p className="mt-3 max-w-[32rem] font-body text-[17px] leading-relaxed text-sand sm:text-[18px]">
            Escolha, personalize os adicionais e envie o pedido pelo WhatsApp.
          </p>
        </div>
      </header>

      {/* CATEGORIAS — grudam no topo abaixo do header ao rolar */}
      <div
        className={`sticky ${BELOW_HEADER_TOP} z-20 border-b border-white/10 bg-ink-deep/90 backdrop-blur-md`}
      >
        <div className={`${PAGE_X} ${PAGE_MAX}`}>
          <div
            role="group"
            aria-label="Categorias"
            className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0"
          >
            {categoriesWithAll.map((categoria) => {
              const isSelected = categoria.id === selectedCategoryId;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategoryId(categoria.id)}
                  className={`relative h-14 shrink-0 cursor-pointer px-4 font-body text-[17px] font-bold transition-colors sm:px-5 ${FOCUS_RING} ${
                    isSelected
                      ? "text-parchment"
                      : "text-sand hover:text-gold"
                  }`}
                >
                  {categoria.name}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-4 bottom-0 h-[3px] rounded-t-full bg-gold transition-opacity sm:inset-x-5 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ITENS */}
      <div className={`${PAGE_X} ${PAGE_MAX} pt-10 sm:pt-12`}>
        {error && (
          <div
            role="alert"
            className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-red-400/30 bg-red-400/8 p-5 font-body text-[17px] text-red-300"
          >
            <WarningCircleIcon
              size={24}
              weight="fill"
              aria-hidden="true"
              className="shrink-0"
            />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className={`cursor-pointer rounded-brand border border-red-300 px-5 py-2 font-bold transition-colors hover:bg-red-300 hover:text-ink ${FOCUS_RING}`}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="pb-16 sm:pb-24">
          {isLoading ? (
            <div role="status" aria-label="Carregando cardápio">
              <div className="h-9 w-48 animate-pulse rounded bg-white/10" />
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`transition-opacity duration-200 ${
                isGridVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {sections.length === 0 ? (
                !error && (
                  <p className="py-16 text-center font-body text-[18px] text-sand">
                    Nenhum produto nessa categoria por enquanto.
                  </p>
                )
              ) : (
                sections.map((section) => (
                  <section
                    key={section.category.id}
                    aria-labelledby={`cat-${section.category.id}`}
                    className="mb-14 last:mb-0"
                  >
                    <div className="flex items-center gap-4">
                      <h2
                        id={`cat-${section.category.id}`}
                        className="font-alfa text-[26px] uppercase leading-none text-gold sm:text-[32px]"
                      >
                        {section.category.name}
                      </h2>
                      <span className="font-body text-[16px] text-sand">
                        {section.items.length}{" "}
                        {section.items.length === 1 ? "item" : "itens"}
                      </span>
                      <span
                        aria-hidden="true"
                        className="h-px flex-1 bg-linear-to-r from-gold/40 to-transparent"
                      />
                    </div>

                    {/* celular: linha compacta (miniatura + texto);
                        a partir de md: card vertical com a foto em cima */}
                    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                      {section.items.map((produto) => {
                        const isCustomizable = produto.optionGroups.length > 0;
                        return (
                          <article
                            key={produto.id}
                            className="group flex overflow-hidden rounded-card border border-white/10 bg-ink-soft shadow-[0_1px_0_rgb(255_255_255/0.04)_inset] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.8)] md:flex-col"
                          >
                            <div className="relative w-[116px] shrink-0 overflow-hidden md:aspect-4/3 md:w-full">
                              <img
                                src={resolveImageUrl(produto.imageUrl)}
                                alt={produto.name}
                                width={320}
                                height={240}
                                // as primeiras fotos estão na primeira dobra;
                                // o resto só baixa quando chega perto da tela
                                loading={
                                  (positionById.get(produto.id) ?? 0) < 4
                                    ? "eager"
                                    : "lazy"
                                }
                                decoding="async"
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-linear-to-t from-ink-soft to-transparent md:block"
                              />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:p-5">
                              <div className="min-w-0">
                                <h3 className="font-alfa text-[18px] leading-tight text-parchment md:text-[20px]">
                                  {produto.name}
                                </h3>
                                <p className="mt-1.5 line-clamp-2 font-body text-[15px] leading-snug text-sand md:text-[16px]">
                                  {produto.description}
                                </p>
                                {isCustomizable && (
                                  <p className="mt-2 flex items-center gap-1.5 font-body text-[14px] font-semibold text-gold">
                                    <SlidersHorizontalIcon
                                      size={16}
                                      weight="bold"
                                      aria-hidden="true"
                                    />
                                    Monte do seu jeito
                                  </p>
                                )}
                              </div>

                              <div className="mt-auto flex items-center justify-between gap-3">
                                <span className="font-body text-[21px] font-bold tabular-nums text-parchment md:text-[22px]">
                                  {formatBRL(produto.price)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdd(produto)}
                                  aria-label={`Adicionar ${produto.name}`}
                                  className={`flex ${TOUCH_TARGET} cursor-pointer items-center justify-center gap-1.5 rounded-full bg-brand-red px-3 font-body text-[16px] font-bold text-white transition-colors hover:bg-brand-red-dark active:scale-95 sm:px-5 ${FOCUS_RING}`}
                                >
                                  <PlusIcon
                                    size={18}
                                    weight="bold"
                                    aria-hidden="true"
                                  />
                                  <span className="hidden sm:inline">
                                    Adicionar
                                  </span>
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProdutoModal
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}
