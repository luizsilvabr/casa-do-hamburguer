import { HttpError } from "./http";

const API_URL = import.meta.env.VITE_API_URL;

// Envia a imagem para o back e devolve o caminho salvo (ex: "/uploads/<hash>.jpg").
// Usa FormData direto no fetch (o http.ts força Content-Type JSON, o que
// quebraria o multipart/form-data — aqui deixamos o browser definir o boundary).
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new HttpError(
      data?.error ?? "Falha no upload da imagem",
      res.status,
      data?.issues,
    );
  }

  return data.url as string;
}

// Resolve o caminho da imagem para uma URL exibível:
// - URL absoluta (http/https): usa como está
// - "/uploads/...": servido pelo back, prefixa a API
// - qualquer outro (ex: "/images/..."): servido pelo próprio front, usa como está
export function resolveImageUrl(
  path: string | null | undefined,
): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/uploads/")) return `${API_URL}${path}`;
  return path;
}
