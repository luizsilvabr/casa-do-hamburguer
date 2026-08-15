import { NavLink, Outlet, useNavigate } from "react-router";
import { HamburgerIcon, ListIcon, SignOutIcon } from "@phosphor-icons/react";
import { useAuthStore } from "../../stores/authStore";
import Toaster from "./Toaster";

function navItemClass({ isActive }: { isActive: boolean }) {
  const base =
    "flex items-center gap-3 rounded-[6px] px-3 py-2.5 font-oswald text-[15px] transition-colors";
  return isActive
    ? `${base} bg-[#3A2317] text-[#F0C264]`
    : `${base} text-[#C4B49A] hover:bg-[#3A2317]/50 hover:text-[#F3E9D2]`;
}

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-[#171210]">
      <aside className="w-[255px] shrink-0 bg-[#221A16] border-r border-[#3A2317] flex flex-col">
        {/* LOGO */}
        <div className="px-6 pt-8 pb-5 text-center">
          <p className="font-pacifico text-[#C81D25] text-[22px] leading-none -mb-1">
            Cordeiro's
          </p>
          <p className="font-alfa text-[#F3E9D2] text-[26px] leading-none tracking-tight">
            BURGUER
          </p>
          <p className="font-oswald font-bold text-[#E8A93D] text-[12px] tracking-[0.32em] mt-1.5">
            ADMIN
          </p>
        </div>

        <div className="mx-6 border-t border-dotted border-[#6B3B1F]" />

        {/* NAV */}
        <nav className="px-4 mt-6">
          <p className="px-3 mb-3 font-oswald font-bold text-[11px] tracking-[0.2em] text-[#8E8169]">
            CARDÁPIO
          </p>
          <div className="flex flex-col gap-1.5">
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
        <div className="mt-auto">
          <div className="mx-6 border-t border-dotted border-[#6B3B1F]" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-7 py-6 font-oswald text-[15px] text-[#8E8169] hover:text-[#F3E9D2] cursor-pointer transition-colors"
          >
            <SignOutIcon size={20} weight="bold" />
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 min-w-0 px-10 py-9">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}
