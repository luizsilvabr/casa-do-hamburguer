import { createBrowserRouter, Navigate, Outlet } from "react-router";
import Cardapio from "./routes/cardapio/Cardapio";
import Login from "./routes/admin/Login";
import Categorias from "./routes/admin/Categorias";
import Produtos from "./routes/admin/Produtos";
import AdminGuard from "./components/admin/AdminGuard";
import AdminLayout from "./components/admin/AdminLayout";

// Layout público (cardápio)
const SiteLayout = () => {
  return (
    <div className="min-h-screen bg-[#171210]">
      <Outlet />
    </div>
  );
};

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [{ path: "/", element: <Cardapio /> }],
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
