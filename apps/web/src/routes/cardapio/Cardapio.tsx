import { useEffect, useState } from "react";
import {
  BasketIcon,
  HamburgerIcon,
  InstagramLogoIcon,
  PhoneIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react";
import { useCartStore } from "../../stores/cartStore";
import CarrinhoDrawer from "../../components/carrinho/CarrinhoDrawer";
import ProdutoModal from "../../components/produto/ProdutoModal";
import { http } from "../../lib/http";
import { resolveImageUrl } from "../../lib/images";
import type { Category, Product } from "../../types";

const ALL_CATEGORY_ID = "todos";
const ALL_CATEGORY: Category = {
  id: ALL_CATEGORY_ID,
  name: "Todos",
  order: -1,
  isActive: true,
};

export default function Cardapio() {
  const { toggleCart, getTotalQuantity } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(ALL_CATEGORY_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
  }, [selectedCategoryId, products]);

  useEffect(() => {
    async function loadCardapio() {
      try {
        setIsLoading(true);
        setError(null);

        const [categoriasData, produtosData] = await Promise.all([
          http.get<Category[]>("/categorias"),
          http.get<Product[]>("/produtos"),
        ]);

        setCategories(categoriasData);
        setProducts(produtosData.map(normalizeProduct));
      } catch {
        setError("Não foi possível carregar o cardápio. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCardapio();
  }, []);

  const categoriesWithAll: Category[] = [ALL_CATEGORY, ...categories];

  const selectedCategory = categoriesWithAll.find(
    (c) => c.id === selectedCategoryId,
  );

  const categoryOrderById = new Map(categories.map((c) => [c.id, c.order]));

  const filteredProducts =
    selectedCategoryId === ALL_CATEGORY_ID
      ? [...products].sort((a, b) => {
          const orderA = categoryOrderById.get(a.categoryId) ?? 0;
          const orderB = categoryOrderById.get(b.categoryId) ?? 0;
          return orderA - orderB; // dentro da mesma order, mantém a ordem alfabética que já veio da API
        })
      : products.filter((p) => p.categoryId === selectedCategoryId);

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

  return (
    <>
      {/* HEADER */}
      <div className="bg-[#171210] h-[120px] flex justify-between items-center w-full px-22 mx-auto border-b-1 border-[#FBE9BC]">
        <div>
          <img src="./images/logo.png" alt="Logo" />
        </div>
        <div
          className="bg-[#FBE9BC] rounded-[5px] p-1 cursor-pointer"
          onClick={toggleCart}
        >
          <ShoppingCartIcon size={29} />
          {getTotalQuantity() > 0 && (
            <span className="absolute top-[33px] right-[81px] bg-[#C81D25] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {getTotalQuantity()}
            </span>
          )}
        </div>
      </div>

      {/* MENU */}
      <div className="bg-[#171210] min-h-screen w-full px-22 mx-auto mt-10">
        {error && <p className="text-[#C81D25] font-inter mb-5">{error}</p>}

        {/* CATEGORIAS */}
        <div className="flex justify-start items-center font-oswald">
          {categoriesWithAll.map((categoria) => {
            const isSelected = categoria.id === selectedCategoryId;
            return (
              <button
                key={categoria.id}
                onClick={() => setSelectedCategoryId(categoria.id)}
                className={`cursor-pointer outline-none transition-colors rounded-[5px] w-[130px] h-[42px] border-1 font-bold mr-5 ${
                  isSelected
                    ? "bg-[#FBE9BC] text-[#171210] border-[#171210]"
                    : "bg-[#171210] text-[#FBE9BC] border-[#FBE9BC] hover:bg-[#FBE9BC] hover:text-[#171210] hover:border-[#171210]"
                }`}
              >
                {categoria.name.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* ITENS */}
        <div className="my-10">
          {isLoading ? (
            <p className="text-[#C4B49A] font-inter mt-5">
              Carregando cardápio...
            </p>
          ) : (
            <div
              className={`transition-opacity duration-200 ${
                isGridVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {displayedCategory && (
                <h2 className="text-[#F0C264] font-alfa text-2xl">
                  {displayedCategory.name.toUpperCase()}
                </h2>
              )}

              <div className="grid grid-cols-2 gap-x-10 gap-y-8 mt-5">
                {displayedProducts.length === 0 ? (
                  <p className="col-span-2 text-center text-[#C4B49A] font-inter text-[17px] mt-10">
                    Nenhum produto encontrado nessa categoria.
                  </p>
                ) : (
                  displayedProducts.map((produto) => (
                    <div key={produto.id} className="flex gap-4">
                      {resolveImageUrl(produto.imageUrl) ? (
                        <img
                          src={resolveImageUrl(produto.imageUrl)}
                          alt={produto.name}
                          className="w-[300px] h-[240px] object-cover rounded-[5px]"
                        />
                      ) : (
                        <div className="shrink-0 w-[289px] h-[240px] rounded-[5px] bg-[#E4D6B8] flex items-center justify-center text-[#B0A488]">
                          <HamburgerIcon size={72} />
                        </div>
                      )}
                      <div className="flex flex-col justify-between w-full">
                        <div>
                          <h3 className="text-[#F3E9D2] font-alfa text-[20px]">
                            {produto.name.toUpperCase()}
                          </h3>
                          <p className="text-[#C4B49A] text-[17px] mt-1 font-inter">
                            {produto.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-[#E8A93D] font-medium font-inter text-[17px] mr-5">
                            {produto.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </span>
                          <button onClick={() => setSelectedProduct(produto)}>
                            <BasketIcon
                              className="cursor-pointer text-[#F3E9D2]"
                              size={29}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#171210] h-[100px] flex justify-end items-center w-full px-22 mx-auto border-t-1 border-[#FBE9BC] font-pacifico text-[#F0C264] text-[18px]">
        <div className="flex items-center justify-center mr-1">
          Siga-nos no Instagram &nbsp;&nbsp; <InstagramLogoIcon size={29} />
        </div>

        <div className="w-[2px] h-10 bg-[#F0C264] mx-3" />

        <div className="w-[154px] flex flex-wrap items-center">
          <span className="w-full text-center">Fale conosco</span>
          <span className="w-full flex items-center justify-center">
            <PhoneIcon size={29} className="mr-2" /> 14 99999-9999
          </span>
        </div>
      </div>

      <CarrinhoDrawer />

      {selectedProduct && (
        <ProdutoModal
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
