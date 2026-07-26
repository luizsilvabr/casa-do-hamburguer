import { createBrowserRouter, Outlet } from "react-router";
import Cardapio from "./routes/cardapio/Cardapio";
import Login from "./routes/admin/Login";
import Painel from "./routes/admin/Painel";
import AdminGuard from "./components/admin/AdminGuard";

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

  { path: "/admin/login", element: <Login /> },

  {
    element: <AdminGuard />,
    children: [{ path: "/admin", element: <Painel /> }],
  },
]);