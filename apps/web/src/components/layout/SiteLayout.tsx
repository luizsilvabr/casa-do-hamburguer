import {
  InstagramLogoIcon,
  PhoneIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react";
import { Link, NavLink, Outlet, ScrollRestoration } from "react-router";
import CarrinhoDrawer from "../carrinho/CarrinhoDrawer";
import Toast from "./Toast";
import { useCartStore } from "../../stores/cartStore";
import { formatBRL } from "../../lib/format";
import {
  CONTACT_PHONE,
  FOCUS_RING,
  HEADER_H,
  INSTAGRAM_URL,
  PAGE_MAX,
  PAGE_X,
  WHATSAPP_NUMBER,
} from "../../lib/site";

// Link de navegação do header: dourado e sublinhado na página atual
function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-11 items-center rounded-brand px-3 font-body text-[16px] font-semibold transition-colors ${FOCUS_RING} ${
    isActive
      ? "text-gold underline decoration-2 underline-offset-8"
      : "text-parchment hover:text-gold"
  }`;
}

const FOOTER_LINK =
  "flex min-h-11 items-center gap-2 rounded-brand font-body text-[16px] text-parchment transition-colors hover:text-gold";

// Layout público: header, rodapé, carrinho e barra flutuante ficam aqui pra
// valer em todas as páginas (início e cardápio) sem repetir código.
export default function SiteLayout() {
  const { toggleCart, getTotalQuantity, getSubtotal } = useCartStore();
  const totalQuantity = getTotalQuantity();
  const subtotal = getSubtotal();

  return (
    <div className="bg-ink-deep font-body">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-deep">
        <div
          className={`${PAGE_X} ${PAGE_MAX} flex ${HEADER_H} items-center justify-between gap-3`}
        >
          <Link
            to="/"
            aria-label="Casa do Hambúrguer — página inicial"
            className={`flex items-center gap-3 rounded-brand ${FOCUS_RING}`}
          >
            <img
              src="/images/logo.png"
              alt=""
              width={84}
              height={84}
              className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            />
            <div className="leading-none">
              <p className="font-alfa text-[17px] uppercase text-parchment sm:text-xl">
                Casa do
              </p>
              <p className="mt-1 font-pacifico text-[15px] text-gold">
                Hambúrguer
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            <nav aria-label="Principal" className="flex items-center">
              {/* no mobile o logo já leva ao início — sobra espaço pro carrinho */}
              <NavLink
                to="/"
                end
                className={(state) => `hidden sm:flex ${navLinkClass(state)}`}
              >
                Início
              </NavLink>
              <NavLink to="/cardapio" className={navLinkClass}>
                Cardápio
              </NavLink>
            </nav>

            <button
              type="button"
              onClick={toggleCart}
              aria-label={
                totalQuantity > 0
                  ? `Abrir carrinho, ${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}, ${formatBRL(subtotal)}`
                  : "Abrir carrinho"
              }
              className={`relative flex h-11 cursor-pointer items-center gap-2 rounded-full bg-cream px-4 font-body text-[16px] font-bold text-ink transition-colors hover:bg-gold ${FOCUS_RING}`}
            >
              <ShoppingCartIcon size={22} weight="bold" aria-hidden="true" />
              <span
                className="hidden tabular-nums sm:inline"
                aria-hidden="true"
              >
                {totalQuantity > 0 ? formatBRL(subtotal) : "Carrinho"}
              </span>
              {totalQuantity > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-xs font-bold tabular-nums text-white ring-2 ring-ink-deep"
                >
                  {totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <Outlet />

      {/* FOOTER — pb extra no mobile pra barra flutuante do carrinho não cobrir */}
      <footer
        className={`border-t border-white/10 bg-ink-deep ${totalQuantity > 0 ? "pb-24 sm:pb-0" : ""}`}
      >
        <div
          className={`${PAGE_X} ${PAGE_MAX} flex flex-col gap-10 py-12 md:flex-row md:items-start md:justify-between`}
        >
          <div className="flex max-w-sm items-center gap-4">
            <img
              src="/images/logo.png"
              alt=""
              width={84}
              height={84}
              loading="lazy"
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="font-alfa text-2xl uppercase text-parchment">
                Casa do
              </p>
              <p className="font-pacifico text-lg text-gold">Hambúrguer</p>
            </div>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-14">
            <div>
              <p className="font-alfa text-[15px] text-gold">Siga-nos</p>
              {INSTAGRAM_URL ? (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 ${FOOTER_LINK} ${FOCUS_RING}`}
                >
                  <InstagramLogoIcon size={24} aria-hidden="true" />
                  Instagram
                </a>
              ) : (
                <div className={`mt-2 ${FOOTER_LINK}`}>
                  <InstagramLogoIcon size={24} aria-hidden="true" />
                  Instagram
                </div>
              )}
            </div>

            {CONTACT_PHONE && (
              <div>
                <p className="font-alfa text-[15px] text-gold">Fale conosco</p>
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className={`mt-2 tabular-nums ${FOOTER_LINK} ${FOCUS_RING}`}
                >
                  <PhoneIcon size={24} aria-hidden="true" />
                  {CONTACT_PHONE}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10">
          <p
            className={`${PAGE_X} ${PAGE_MAX} py-5 font-body text-[14px] text-sand`}
          >
            © {new Date().getFullYear()} Casa do Hambúrguer. Todos os
            direitos reservados.
          </p>
        </div>
      </footer>

      {/* BARRA FLUTUANTE DO CARRINHO — só no mobile, onde o botão do header
          fica longe do polegar */}
      {totalQuantity > 0 && (
        <button
          type="button"
          onClick={toggleCart}
          className={`fixed inset-x-4 bottom-4 z-30 flex h-14 cursor-pointer items-center justify-between rounded-brand bg-brand-red px-5 font-body text-[17px] font-bold text-white transition-colors hover:bg-brand-red-dark sm:hidden ${FOCUS_RING}`}
        >
          <span className="flex items-center gap-2">
            <ShoppingCartIcon size={22} weight="bold" aria-hidden="true" />
            Ver carrinho ({totalQuantity})
          </span>
          <span className="tabular-nums">{formatBRL(subtotal)}</span>
        </button>
      )}

      <Toast />
      <CarrinhoDrawer />
      <ScrollRestoration />
    </div>
  );
}
