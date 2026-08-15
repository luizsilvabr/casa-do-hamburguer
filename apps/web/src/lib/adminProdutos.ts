import { http } from "./http";
import type { AdminProduct, ProductInput } from "../types/admin";

interface RawAdminProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  isActive: boolean;
  optionGroups?: unknown[];
}

function normalize(raw: RawAdminProduct): AdminProduct {
  return {
    id: raw.id,
    categoryId: raw.categoryId,
    name: raw.name,
    description: raw.description ?? "",
    price: Number(raw.price),
    imageUrl: raw.imageUrl ?? null,
    isActive: raw.isActive,
    optionGroupCount: raw.optionGroups?.length ?? 0,
  };
}

export const adminProdutos = {
  listAll: async (): Promise<AdminProduct[]> => {
    const data = await http.get<RawAdminProduct[]>("/produtos/todos");
    return data.map(normalize);
  },

  create: (data: ProductInput) => http.post<RawAdminProduct>("/produtos", data),

  update: (id: string, data: ProductInput) =>
    http.put<RawAdminProduct>(`/produtos/${id}`, data),

  deactivate: (id: string) => http.delete<RawAdminProduct>(`/produtos/${id}`),

  reactivate: (id: string) =>
    http.patch<RawAdminProduct>(`/produtos/${id}/reativar`),
};
