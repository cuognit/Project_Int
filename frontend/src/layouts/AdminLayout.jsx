import { Outlet } from "react-router-dom";
import AdminHeader from "../components/layout/admin/AdminHeader.jsx";
import AdminSidebar from "../components/layout/admin/AdminSidebar.jsx";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <AdminSidebar />
      <div className="flex flex-col min-w-0 flex-1 h-full overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
