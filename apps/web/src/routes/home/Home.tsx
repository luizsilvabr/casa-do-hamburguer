import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon,
  LightningIcon,
  MotorcycleIcon,
  SlidersHorizontalIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { http } from "../../lib/http";
import { formatBRL } from "../../lib/format";
import { resolveImageUrl } from "../../lib/images";
import {
  FOCUS_RING,
  PAGE_MAX,
  PAGE_X,
  STORE_INFO,
  WHATSAPP_URL,
  type StoreInfo,
} from "../../lib/site";
import type { Category, Product } from "../../types";

// Diferenciais mostrados no hero — só o que o próprio fluxo do site entrega
const HIGHLIGHTS = [
  { icon: SlidersHorizontalIcon, label: "Monte do seu jeito" },
  { icon: LightningIcon, label: "Pedido em segundos" },
  { icon: WhatsappLogoIcon, label: "Direto no WhatsApp" },
] as const;

const INFO_ICONS: Record<StoreInfo["key"], typeof ClockIcon> = {
  hours: ClockIcon,
  delivery: MotorcycleIcon,
  payment: CreditCardIcon,
};

// Foto com nome e preço por cima de um degradê escuro (legibilidade do texto)
function PhotoTile({
  produto,
  className,
}: {
  produto: Product;
  className: string;
}) {
  return (
    <figure
      className={`relative overflow-hidden rounded-card border border-white/10 bg-ink-soft ${className}`}
    >
      <img
        src={resolveImageUrl(produto.imageUrl)}
        alt=""
        width={240}
        height={230}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-ink-deep via-ink-deep/20 to-transparent"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="font-alfa text-[16px] leading-tight text-parchment">
          {produto.name}
        </span>
        <span className="shrink-0 font-body text-[16px] font-bold tabular-nums text-gold">
          {formatBRL(produto.price)}
        </span>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  // fotos do hero: se a API falhar, o hero só fica sem elas
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const [categorias, produtos] = await Promise.all([
          http.get<Category[]>("/categorias"),
          http.get<Product[]>("/produtos"),
        ]);
        // mesma ordem do cardápio: primeiro os produtos das categorias com
        // menor "order" (os burguers), pro hero mostrar o carro-chefe
        const orderById = new Map(categorias.map((c) => [c.id, c.order]));
        const ordenados = [...produtos].sort(
          (a, b) =>
            (orderById.get(a.categoryId) ?? 0) -
            (orderById.get(b.categoryId) ?? 0),
        );
        setFeatured(
          ordenados.slice(0, 3).map((p) => ({ ...p, price: Number(p.price) })),
        );
      } catch {
        // as fotos do hero são opcionais
      }
    }

    loadFeatured();
  }, []);

  return (
    <main>
      <title>Casa do Hambúrguer | Cardápio digital</title>

      {/* HERO */}
      <section className="bg-ink-deep">
        <div
          className={`${PAGE_X} ${PAGE_MAX} grid items-center gap-10 py-8 sm:py-14 lg:min-h-[calc(100dvh-76px)] lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16`}
        >
          <div className="animate-fade-up">
            {/* mobile: a primeira tela já mostra comida */}
            {featured[0] && (
              <div className="mb-8 lg:hidden" aria-hidden="true">
                <PhotoTile produto={featured[0]} className="h-[210px]" />
              </div>
            )}

            <h1 className="font-alfa text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[1.05] text-parchment">
              Seu burguer
              <span className="block text-gold">do seu jeito</span>
            </h1>

            <p className="mt-6 max-w-[34rem] font-body text-[18px] leading-relaxed text-sand sm:text-[20px]">
              Escolha seu favorito, personalize os adicionais e envie o pedido
              direto pelo WhatsApp.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to="/cardapio"
                className={`inline-flex h-14 items-center gap-2 rounded-brand bg-brand-red px-8 font-body text-[17px] font-bold text-white transition-colors hover:bg-brand-red-dark ${FOCUS_RING}`}
              >
                Ver cardápio
                <ArrowRightIcon size={18} weight="bold" aria-hidden="true" />
              </Link>
              {WHATSAPP_URL && (
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-14 items-center gap-2 rounded-brand border border-white/20 px-7 font-body text-[17px] font-bold text-parchment transition-colors hover:border-gold hover:text-gold ${FOCUS_RING}`}
                >
                  <WhatsappLogoIcon size={20} weight="bold" aria-hidden="true" />
                  Falar no WhatsApp
                </a>
              )}
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 font-body text-[16px] font-medium text-parchment"
                >
                  <Icon
                    size={20}
                    weight="fill"
                    aria-hidden="true"
                    className="text-gold"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* desktop: fotos do cardápio e a marca em quatro blocos */}
          <div
            aria-hidden="true"
            className="ml-auto hidden w-full max-w-[500px] grid-cols-2 gap-4 lg:grid [&>*:nth-child(even)]:mt-10"
          >
            {featured.length >= 2 && (
              <>
                <PhotoTile produto={featured[0]} className="h-[240px]" />
                <PhotoTile produto={featured[1]} className="h-[240px]" />
                <div className="flex h-[240px] items-center justify-center rounded-card border border-white/10 bg-ink-soft">
                  <img
                    src="/images/logo.png"
                    alt=""
                    width={84}
                    height={84}
                    className="h-28 w-28 object-contain"
                  />
                </div>
                {featured[2] && (
                  <PhotoTile produto={featured[2]} className="h-[240px]" />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* INFORMAÇÕES DA LOJA — só o que estiver configurado no .env */}
      {STORE_INFO.length > 0 && (
        <section className="border-t border-white/10 bg-ink">
          <div className={`${PAGE_X} ${PAGE_MAX} py-12 sm:py-16`}>
            <h2 className="font-alfa text-2xl uppercase text-gold sm:text-3xl">
              Informações
            </h2>
            <dl className="mt-8 grid gap-8 md:grid-cols-3">
              {STORE_INFO.map((info) => {
                const Icon = INFO_ICONS[info.key];
                return (
                  <div key={info.key} className="flex gap-4">
                    <Icon
                      size={28}
                      weight="regular"
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-gold"
                    />
                    <div>
                      <dt className="font-alfa text-[16px] text-parchment">
                        {info.label}
                      </dt>
                      <dd className="mt-1 font-body text-[17px] leading-relaxed text-sand">
                        {info.text}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>
      )}

      {/* CHAMADA FINAL */}
      <section className="border-t border-white/10 bg-ink">
        <div
          className={`${PAGE_X} ${PAGE_MAX} flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between sm:py-16`}
        >
          <div>
            <h2 className="font-alfa text-3xl uppercase text-parchment sm:text-4xl">
              Bateu a fome?
            </h2>
            <p className="mt-2 font-body text-[18px] text-sand">
              Veja o cardápio completo e faça seu pedido em poucos toques.
            </p>
          </div>
          <Link
            to="/cardapio"
            className={`inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-brand bg-brand-red px-8 font-body text-[17px] font-bold text-white transition-colors hover:bg-brand-red-dark ${FOCUS_RING}`}
          >
            Ver cardápio completo
            <ArrowRightIcon size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
