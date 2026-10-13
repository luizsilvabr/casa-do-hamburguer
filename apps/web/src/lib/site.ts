import { formatPhoneNumber } from "./masks";

// Respiro lateral e largura máxima do conteúdo, iguais em todas as páginas
// públicas (header, miolo e footer). Ficam em constantes pra não sair do lugar
// quando um mudar.
export const PAGE_X = "px-4 sm:px-8 lg:px-16 xl:px-22";
export const PAGE_MAX = "max-w-[1440px] mx-auto";

// Alvo mínimo de toque de 44px (WCAG 2.5.5)
export const TOUCH_TARGET = "min-h-11 min-w-11";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep";

// Altura do header fixo — as barras que grudam logo abaixo dele (categorias)
// precisam do mesmo valor no `top`.
export const HEADER_H = "h-[68px] sm:h-[76px]";
export const BELOW_HEADER_TOP = "top-[68px] sm:top-[76px]";

// Contatos. O telefone sai do mesmo número que recebe os pedidos
// (VITE_WHATSAPP_NUMBER, com DDI 55); o Instagram só vira link se a URL estiver
// configurada em VITE_INSTAGRAM_URL.
export const WHATSAPP_NUMBER = String(
  import.meta.env.VITE_WHATSAPP_NUMBER ?? "",
);
export const INSTAGRAM_URL = String(import.meta.env.VITE_INSTAGRAM_URL ?? "");
export const CONTACT_PHONE = formatPhoneNumber(
  WHATSAPP_NUMBER.replace(/^55/, ""),
);
export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : "";

// Informações da loja mostradas na página inicial. Só aparecem as que estiverem
// configuradas no .env (ver .env.example) — nada é inventado aqui.
export interface StoreInfo {
  key: "hours" | "delivery" | "payment";
  label: string;
  text: string;
}

export const STORE_INFO: StoreInfo[] = (
  [
    {
      key: "hours",
      label: "Horário",
      text: String(import.meta.env.VITE_OPENING_HOURS ?? ""),
    },
    {
      key: "delivery",
      label: "Entrega",
      text: String(import.meta.env.VITE_DELIVERY_INFO ?? ""),
    },
    {
      key: "payment",
      label: "Pagamento",
      text: String(import.meta.env.VITE_PAYMENT_INFO ?? ""),
    },
  ] satisfies StoreInfo[]
).filter((info) => info.text.trim() !== "");
