import { NavLink, Outlet, useNavigate } from "react-router";
import { HamburgerIcon, ListIcon, SignOutIcon } from "@phosphor-icons/react";
import { useAuthStore } from "../../stores/authStore";
import Toaster from "./Toaster";

function navItemClass({ isActive }: { isActive: boolean }) {
  const base =
    "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-brand px-3 font-body text-[16px] font-semibold transition-colors lg:flex-none lg:justify-start lg:gap-3";
  return isActive
    ? `${base} bg-white/10 text-gold`
    : `${base} text-sand hover:bg-white/5 hover:text-parchment`;
}

// Abaixo de lg o menu vira uma barra no topo (logo + sair, e as abas embaixo);
// de lg pra cima é a sidebar lateral de sempre.
export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-ui flex min-h-screen flex-col bg-ink font-body lg:flex-row">
      <aside className="flex w-full flex-wrap items-center border-b border-white/10 bg-ink-deep px-4 pt-3 pb-2 lg:w-[255px] lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-r lg:border-b-0 lg:p-0">
        {/* LOGO */}
        <div className="order-1 flex flex-1 items-center gap-3 lg:order-none lg:flex-none lg:flex-col lg:gap-0 lg:px-6 lg:pt-8 lg:pb-5 lg:text-center">
          <img
            src="/images/logo.svg"
            alt=""
            width={84}
            height={84}
            className="h-10 w-10 shrink-0 object-contain lg:mb-3 lg:h-16 lg:w-16"
          />
          <div className="leading-none">
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.3em] text-gold lg:text-[11px]">
              Casa do
            </p>
            <p className="mt-1 font-alfa text-[16px] uppercase tracking-wide text-parchment lg:mt-1.5 lg:text-[22px]">
              Hambúrguer
            </p>
            <p className="mt-1 font-body text-[11px] font-bold tracking-[0.3em] text-sand lg:mt-1.5 lg:text-[12px]">
              ADMIN
            </p>
          </div>
        </div>

        <div className="mx-6 hidden border-t border-white/10 lg:block" />

        {/* NAV */}
        <nav className="order-3 mt-2 w-full lg:order-none lg:mt-6 lg:px-4">
          <p className="mb-3 hidden px-3 font-body text-[12px] font-bold uppercase tracking-[0.2em] text-sand lg:block">
            Cardápio
          </p>
          <div className="flex gap-1.5 lg:flex-col">
            <NavLink to="/admin/categorias" className={navItemClass}>
              <ListIcon size={20} weight="bold" />
              Categorias
            </NavLink>
            <NavLink to="/admin/produtos" className={navItemClass}>
              <HamburgerIcon size={20} weight="bold" />
              Produtos
            </NavLink>
          </div>
        </nav>

        {/* RODAPÉ — SAIR */}
        <div className="order-2 lg:order-none lg:mt-auto">
          <div className="mx-6 hidden border-t border-white/10 lg:block" />
          <button
            onClick={handleLogout}
            className="flex min-h-11 cursor-pointer items-center gap-2 px-2 font-body text-[16px] font-semibold text-sand transition-colors hover:text-parchment lg:w-full lg:gap-3 lg:px-7 lg:py-6"
          >
            <SignOutIcon size={20} weight="bold" />
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1200px]">
          <Outlet />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
