import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { HttpError } from "../../lib/http";

interface LocationState {
  from?: { pathname: string };
}

export default function Login() {
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);

  const navigate = useNavigate();
  const location = useLocation();
  // Pra onde voltar depois de logar: a rota que o AdminGuard bloqueou,
  // ou o painel por padrão.
  const from =
    (location.state as LocationState | null)?.from?.pathname ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Já está logado? Não faz sentido mostrar o login.
  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof HttpError) {
        // O back devolve mensagem genérica ("E-mail ou senha inválidos")
        // tanto pra e-mail inexistente quanto pra senha errada.
        setError(err.message);
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#171210] flex items-center justify-center px-4">
      <section className="w-full max-w-[460px] bg-[#F3E9D2] px-15 py-12 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        {/* LOGO */}
        <header className="text-center">
          <p className="font-pacifico text-[#C81D25] text-[34px] leading-none -mb-1 transform -rotate-z-[-6deg] mb-[3px]">
            Cordeiro's
          </p>
          <h1 className="font-alfa text-[#171210] text-[46px] leading-none tracking-tight">
            BURGUER
          </h1>

          <div className="mt-5 mb-8">
            <div className="border-t-2 border-dashed border-[#6B3B1F]" />
            <p className="font-oswald font-bold tracking-[0.22em] text-[#6B3B1F] text-[13px] py-2.5">
              PAINEL DO ADMINISTRADOR
            </p>
            <div className="border-t-2 border-dashed border-[#6B3B1F]" />
          </div>
        </header>

        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block font-oswald font-bold text-[#3A2317] text-[13px] tracking-[0.15em] mb-1.5"
            >
              E-MAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white rounded-[5px] border border-[#D8C9A6] px-3.5 py-1.5 font-inter text-[15px] text-[#171210] outline-none transition-colors focus:border-[#6B3B1F] focus:ring-2 focus:ring-[#6B3B1F]/30"
            />
          </div>

          <div className="mb-2">
            <label
              htmlFor="password"
              className="block font-oswald font-bold text-[#3A2317] text-[13px] tracking-[0.15em] mb-1.5"
            >
              SENHA
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white rounded-[5px] border border-[#D8C9A6] px-3.5 py-1.5 font-inter text-[15px] text-[#171210] outline-none transition-colors focus:border-[#6B3B1F] focus:ring-2 focus:ring-[#6B3B1F]/30"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="font-inter text-[14px] text-[#C81D25] mt-3"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-[#4A7C2F] hover:bg-[#3F6A28] text-[#F3E9D2] font-oswald font-bold tracking-[0.15em] text-[17px] rounded-[5px] py-3 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>

        <p className="text-center font-inter text-[13px] text-[#5C5A52] mt-7">
          Acesso restrito — sessão por cookie seguro.
        </p>
      </section>
    </main>
  );
}
