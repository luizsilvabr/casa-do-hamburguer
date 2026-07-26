import { useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";

export default function Painel() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#171210] flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-alfa text-[#F3E9D2] text-3xl text-center">
        PAINEL DO ADMINISTRADOR
      </h1>
      <p className="font-inter text-[#C4B49A] text-center">
        Sessão ativa{user?.name ? ` — ${user.name}` : ""}. Em breve: gerenciar
        categorias e produtos.
      </p>
      <button
        onClick={handleLogout}
        className="bg-[#C81D25] hover:bg-[#a8171e] text-[#F3E9D2] font-oswald font-bold tracking-[0.15em] text-[15px] rounded-[5px] px-6 py-2.5 cursor-pointer transition-colors"
      >
        SAIR
      </button>
    </main>
  );
}
