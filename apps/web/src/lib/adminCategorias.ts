import { http } from "./http";
import type { AdminCategory, CategoryInput } from "../types/admin";

interface RawAdminCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  _count?: { products: number };
}

function normalize(raw: RawAdminCategory): AdminCategory {
  return {
    id: raw.id,
    name: raw.name,
    order: raw.order,
    isActive: raw.isActive,
    productCount: raw._count?.products ?? 0,
  };
}

export const adminCategorias = {
  listAll: async (): Promise<AdminCategory[]> => {
    const data = await http.get<RawAdminCategory[]>("/categorias/todas");
    return data.map(normalize);
  },

  create: (data: CategoryInput) =>
    http.post<RawAdminCategory>("/categorias", data),

  update: (id: string, data: CategoryInput) =>
    http.put<RawAdminCategory>(`/categorias/${id}`, data),

  deactivate: (id: string) =>
    http.delete<RawAdminCategory>(`/categorias/${id}`),

  reactivate: (id: string) =>
    http.patch<RawAdminCategory>(`/categorias/${id}/reativar`),
};
