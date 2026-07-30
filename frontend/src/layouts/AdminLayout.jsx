import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "../components/layout/admin/AdminHeader.jsx";
import AdminSidebar from "../components/layout/admin/AdminSidebar.jsx";
import { AdminOrderQueueProvider } from "../context/AdminOrderQueueContext.jsx";

export default function AdminLayout() {
  useEffect(() => {
    document.title = "OrderHub | Quản trị hệ thống";
  }, []);

  return (
    <AdminOrderQueueProvider>
      <div className="app-soft-background flex h-screen w-screen overflow-hidden font-sans">
        <AdminSidebar />
        <div className="flex flex-col min-w-0 flex-1 h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6 flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminOrderQueueProvider>
  );
}
