import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { HttpError } from "../../lib/http";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="admin-ui flex min-h-dvh items-center justify-center bg-ink px-4 py-6 font-body">
      <section className="w-full max-w-[460px] rounded-card border border-white/10 bg-ink-soft px-6 py-8 shadow-2xl shadow-black/50 sm:px-12 sm:py-12">
        {/* LOGO */}
        <header className="text-center">
          <img
            src="/images/logo.svg"
            alt=""
            width={72}
            height={72}
            className="mx-auto mb-3 h-[72px] w-[72px]"
          />
          <p className="font-body text-[13px] font-bold uppercase tracking-[0.3em] text-gold">
            Casa do
          </p>
          <h1 className="mt-1.5 font-alfa text-[26px] min-[400px]:text-[34px] uppercase leading-none tracking-wide text-parchment">
            Hambúrguer
          </h1>

          <p className="mt-5 mb-8 border-y border-white/10 py-2.5 font-body text-[13px] font-bold uppercase tracking-[0.22em] text-sand">
            Painel do administrador
          </p>
        </header>

        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="email" className="mb-1.5 block font-body text-[13px] font-bold uppercase tracking-[0.12em] text-sand">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-brand border border-white/15 bg-ink-deep px-3.5 py-3 font-body text-[16px] text-parchment outline-none transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="mb-1.5 block font-body text-[13px] font-bold uppercase tracking-[0.12em] text-sand">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-brand border border-white/15 bg-ink-deep px-3.5 py-3 font-body text-[16px] text-parchment outline-none transition-colors placeholder:text-sand hover:border-white/30 focus:border-gold focus:ring-2 focus:ring-gold/30 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center text-sand transition-colors hover:text-parchment"
              >
                {showPassword ? (
                  <EyeSlashIcon size={20} />
                ) : (
                  <EyeIcon size={20} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 font-body text-[15px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 min-h-12 w-full cursor-pointer rounded-brand bg-brand-red px-5 py-2.5 font-body text-[16px] font-bold text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-7 text-center font-body text-[14px] text-sand">
          Acesso restrito — sessão por cookie seguro.
        </p>
      </section>
    </main>
  );
}
