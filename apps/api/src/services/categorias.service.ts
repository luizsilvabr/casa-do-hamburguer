import { AppError, ConflictError, NotFoundError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";
import type { CreateCategoryInput } from "../schemas/categorias.schema.js";

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(data: CreateCategoryInput) {
  const existing = await prisma.category.findFirst({
    where: { name: data.name },
  });

  if (existing) {
    throw new ConflictError("Já existe uma categoria com esse nome");
  }

  return prisma.category.create({ data });
}

export async function updateCategory(id: string, data: CreateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }

  const existing = await prisma.category.findFirst({
    where: { name: data.name, NOT: { id } },
  });

  if (existing) {
    throw new ConflictError("Já existe uma categoria com esse nome");
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      ...(data.order !== undefined && { order: data.order }),
    },
  });
}

export async function deactivateCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }

  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function reactivateCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }

  const last = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: { order: "desc" },
  });
  const nextOrder = last ? last.order + 1 : 0;

  return prisma.category.update({
    where: { id },
    data: { isActive: true, order: nextOrder },
  });
}
