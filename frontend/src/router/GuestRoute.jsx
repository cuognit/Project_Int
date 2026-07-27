import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function GuestRoute() {
  const { isAuthenticated, isAuthInitializing, isAdmin } = useAuth();

  if (isAuthInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center text-sm font-semibold text-slate-500">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
           Vui lòng chờ trong giây lát...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  return <Outlet />;
}
