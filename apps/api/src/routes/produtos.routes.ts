import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authGuard } from "../middlewares/authGuard.js";
import {
  getProductsController,
  getAllProductsController,
  getProductByIdController,
  createProductController,
  updateProductController,
  deactivateProductController,
  reactivateProductController,
} from "../controllers/produtos.controller.js";
import {
  createGroupController,
  updateGroupController,
  deleteGroupController,
} from "../controllers/grupos.controller.js";
import {
  createItemController,
  updateItemController,
  deleteItemController,
} from "../controllers/itens.controller.js";

export const produtosRoutes = Router();

produtosRoutes.get("/", asyncHandler(getProductsController));
produtosRoutes.get("/todos", authGuard, asyncHandler(getAllProductsController));
produtosRoutes.get("/:id", asyncHandler(getProductByIdController));
produtosRoutes.post("/", authGuard, asyncHandler(createProductController));
produtosRoutes.put("/:id", authGuard, asyncHandler(updateProductController));
produtosRoutes.delete(
  "/:id",
  authGuard,
  asyncHandler(deactivateProductController),
);
produtosRoutes.patch(
  "/:id/reativar",
  authGuard,
  asyncHandler(reactivateProductController),
);

produtosRoutes.post(
  "/:produtoId/grupos",
  authGuard,
  asyncHandler(createGroupController),
);
produtosRoutes.put(
  "/:produtoId/grupos/:grupoId",
  authGuard,
  asyncHandler(updateGroupController),
);
produtosRoutes.delete(
  "/:produtoId/grupos/:grupoId",
  authGuard,
  asyncHandler(deleteGroupController),
);

produtosRoutes.post(
  "/:produtoId/grupos/:grupoId/itens",
  authGuard,
  asyncHandler(createItemController),
);
produtosRoutes.put(
  "/:produtoId/grupos/:grupoId/itens/:itemId",
  authGuard,
  asyncHandler(updateItemController),
);
produtosRoutes.delete(
  "/:produtoId/grupos/:grupoId/itens/:itemId",
  authGuard,
  asyncHandler(deleteItemController),
);
