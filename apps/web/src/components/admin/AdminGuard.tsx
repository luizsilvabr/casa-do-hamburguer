import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../stores/authStore";

export default function AdminGuard() {
  const status = useAuthStore((s) => s.status);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const location = useLocation();

  useEffect(() => {
    if (status === "idle") {
      fetchMe();
    }
  }, [status, fetchMe]);

  if (status === "idle" || status === "checking") {
    return (
      <div className="min-h-screen bg-[#171210] flex items-center justify-center">
        <p className="text-[#C4B49A] font-inter">Verificando acesso...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
