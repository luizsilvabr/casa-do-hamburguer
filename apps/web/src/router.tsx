import { createBrowserRouter, Navigate } from "react-router";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./routes/home/Home";
import Cardapio from "./routes/cardapio/Cardapio";
import Login from "./routes/admin/Login";
import Categorias from "./routes/admin/Categorias";
import Produtos from "./routes/admin/Produtos";
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";

export const router = createBrowserRouter([
  // Layout público: início (hero) e cardápio compartilham header, rodapé e carrinho
  {
    element: <SiteLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/cardapio", element: <Cardapio /> },
    ],
  },

  // Login do admin
  { path: "/admin/login", element: <Login /> },

  // Área protegida do admin
  {
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: "/admin",
            element: <Navigate to="/admin/categorias" replace />,
          },
          { path: "/admin/categorias", element: <Categorias /> },
          { path: "/admin/produtos", element: <Produtos /> },
        ],
      },
    ],
  },
]);
