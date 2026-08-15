import type { Request, Response } from "express";
import {
  getProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  reactivateProduct,
} from "../services/produtos.service.js";
import { createProductSchema } from "../schemas/produtos.schema.js";
import { getIdParam } from "../utils/getIdParam.js";

export async function getProductsController(req: Request, res: Response) {
  const products = await getProducts();
  return res.status(200).json(products);
}

export async function getAllProductsController(req: Request, res: Response) {
  const products = await getAllProducts();
  return res.status(200).json(products);
}

export async function getProductByIdController(req: Request, res: Response) {
  const id = getIdParam(req.params.id, "Id do produto é obrigatório");
  const product = await getProductById(id);
  return res.status(200).json(product);
}

export async function createProductController(req: Request, res: Response) {
  const data = createProductSchema.parse(req.body);
  const product = await createProduct(data);
  return res.status(201).json(product);
}

export async function updateProductController(req: Request, res: Response) {
  const id = getIdParam(req.params.id, "Id do produto é obrigatório");
  const data = createProductSchema.parse(req.body);
  const product = await updateProduct(id, data);
  return res.status(200).json(product);
}

export async function deactivateProductController(req: Request, res: Response) {
  const id = getIdParam(req.params.id, "Id do produto é obrigatório");
  const product = await deactivateProduct(id);
  return res.status(200).json(product);
}

export async function reactivateProductController(req: Request, res: Response) {
  const id = getIdParam(req.params.id, "Id do produto é obrigatório");
  const product = await reactivateProduct(id);
  return res.status(200).json(product);
}
