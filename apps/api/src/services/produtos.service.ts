import { NotFoundError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";
import type { CreateProductInput } from "../schemas/produtos.schema.js";

export async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    orderBy: { name: "asc" },
    include: {
      optionGroups: {
        orderBy: { name: "asc" },
        include: { items: { orderBy: { name: "asc" } } },
      },
    },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      optionGroups: {
        orderBy: { name: "asc" },
        include: { items: { orderBy: { name: "asc" } } },
      },
    },
  });
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      optionGroups: {
        orderBy: { name: "asc" },
        include: { items: { orderBy: { name: "asc" } } },
      },
    },
  });

  if (!product) {
    throw new NotFoundError("Produto não encontrado");
  }

  return product;
}

export async function createProduct(data: CreateProductInput) {
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }

  return prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  });
}

export async function updateProduct(id: string, data: CreateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundError("Produto não encontrado");
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
  });
}

export async function deactivateProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundError("Produto não encontrado");
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function reactivateProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundError("Produto não encontrado");
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: true },
  });
}
