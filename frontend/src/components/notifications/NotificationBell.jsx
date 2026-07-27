import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../hooks/useNotifications.js";
import { getOrder } from "../../api/orderApi.js";

const iconForType = (type) => {
  if (type === "ORDER_CREATED" || type === "NEW_ORDER") return "📦";
  if (type === "ORDER_CANCELLED" || type === "ORDER_CANCELLED_BY_USER") return "✕";
  return "🔔";
};

const relativeTime = (value) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
};

export default function NotificationBell({ variant = "shop" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const {
    items,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    latestNotification,
    clearLatestNotification,
  } = useNotifications();
  const admin = variant === "admin";

  const toggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    setActionError("");
    if (nextOpen) loadNotifications();
  };

  const handleItemClick = async (item) => {
    try {
      await markAsRead(item);
      setOpen(false);
      if (item.orderId) {
        if (admin) {
          let userId = item.metadata?.userId;
          if (!userId) {
            const order = await getOrder(item.orderId);
            userId = order.userId || order.user?.id;
          }
          navigate(
            userId
              ? `/admin/users/${userId}?orderId=${item.orderId}`
              : "/admin/users",
          );
        } else {
          navigate(`/my-orders/${item.orderId}`);
        }
      }
    } catch (err) {
      setActionError(err?.message || "Không thể đánh dấu thông báo.");
    }
  };

  useEffect(() => {
    if (!latestNotification) return undefined;
    const timer = window.setTimeout(clearLatestNotification, 4000);
    return () => window.clearTimeout(timer);
  }, [latestNotification, clearLatestNotification]);

  return (
    <div className="relative">
      {latestNotification && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleItemClick(latestNotification)}
          className={`fixed right-5 top-20 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] gap-3 rounded-2xl border bg-white p-4 text-left shadow-2xl ${
            admin ? "border-indigo-200" : "border-orange-200"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl">
            {iconForType(latestNotification.type)}
          </span>
          <span className="min-w-0">
            <strong className="block text-xs font-black text-slate-800">{latestNotification.title}</strong>
            <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed text-slate-500">{latestNotification.message}</span>
          </span>
          <button
            type="button"
            aria-label="Đóng thông báo"
            onClick={(event) => {
              event.stopPropagation();
              clearLatestNotification();
            }}
            className="ml-auto text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      )}
      <button
        onClick={toggle}
        className={admin
          ? "relative rounded-xl p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
          : "relative rounded-2xl p-2.5 text-white transition hover:bg-white/15"
        }
        title="Thông báo"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
            admin ? "bg-rose-500 text-white" : "bg-yellow-400 text-orange-950"
          }`}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
          <div className={`flex items-center justify-between border-b border-slate-100 px-4 py-3 ${admin ? "bg-slate-50" : "bg-orange-50/60"}`}>
            <div>
              <h4 className="text-xs font-black">{admin ? "Thông báo quản trị" : "Thông báo của bạn"}</h4>
              <p className="mt-0.5 text-[9px] text-slate-400">{unreadCount} thông báo chưa đọc</p>
            </div>
            <button onClick={loadNotifications} disabled={loading} className="text-[10px] font-bold text-slate-500 hover:text-[#ee4d2d]">
              Làm mới
            </button>
          </div>

          {(error || actionError) && (
            <div className="border-b border-rose-100 bg-rose-50 p-3 text-[10px] font-semibold text-rose-700">
              {actionError || error}
            </div>
          )}

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {loading && !items.length ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : !items.length ? (
              <div className="p-8 text-center">
                <div className="text-3xl">🔔</div>
                <p className="mt-2 text-xs font-bold text-slate-600">Chưa có thông báo</p>
              </div>
            ) : items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex w-full gap-3 p-3.5 text-left transition hover:bg-slate-50 ${
                  item.readAt ? "bg-white" : admin ? "bg-indigo-50/50" : "bg-orange-50/50"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">{iconForType(item.type)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <strong className="line-clamp-1 text-xs text-slate-800">{item.title}</strong>
                    {!item.readAt && <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${admin ? "bg-indigo-500" : "bg-[#ee4d2d]"}`} />}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[10px] leading-relaxed text-slate-500">{item.message}</span>
                  <span className="mt-1 block text-[9px] text-slate-400">{relativeTime(item.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
