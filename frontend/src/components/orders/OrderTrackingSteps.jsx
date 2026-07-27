const STEPS = [
  {
    status: "PENDING",
    label: "Chờ xử lý",
    description: "Đơn hàng đã được tiếp nhận",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    status: "CONFIRMED",
    label: "Đã xác nhận",
    description: "Cửa hàng đang chuẩn bị hàng",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75m6 2.25a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    status: "SHIPPING",
    label: "Đang giao hàng",
    description: "Đơn hàng đang trên đường giao",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7.5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM3.75 6.75h9v9h-9v-9zm9 3h3l2.25 2.25v3.75h-5.25v-6z" />
    ),
  },
  {
    status: "COMPLETED",
    label: "Đã hoàn thành",
    description: "Giao hàng thành công",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375l-9.75 9.75-4.75-4.75" />
    ),
  },
];

const STATUS_INDEX = Object.fromEntries(
  STEPS.map((step, index) => [step.status, index]),
);

function StepIcon({ icon, active, completed }) {
  return (
    <div
      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        active
          ? "border-[#ee4d2d] bg-[#ee4d2d] text-white shadow-lg shadow-orange-200 ring-4 ring-orange-100"
          : completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-200 bg-white text-slate-300"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
        {icon}
      </svg>
    </div>
  );
}

export default function OrderTrackingSteps({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();
  const cancelled = normalizedStatus === "CANCELLED";
  const currentIndex = cancelled ? -1 : (STATUS_INDEX[normalizedStatus] ?? 0);

  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800">Theo dõi đơn hàng</h2>
          <p className="mt-1 text-[11px] text-slate-400">Trạng thái xử lý và vận chuyển hiện tại</p>
        </div>
        {!cancelled && (
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-[#ee4d2d]">
            Bước {currentIndex + 1}/{STEPS.length}
          </span>
        )}
      </div>

      <div className={`hidden sm:grid sm:grid-cols-4 ${cancelled ? "opacity-40 grayscale" : ""}`}>
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const completed = index < currentIndex;
          return (
            <div key={step.status} className="relative flex flex-col items-center px-2 text-center">
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-[21px] h-0.5 w-full ${
                    index <= currentIndex ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
              <StepIcon icon={step.icon} active={active} completed={completed} />
              <p className={`mt-3 text-xs font-black ${active ? "text-[#ee4d2d]" : completed ? "text-emerald-700" : "text-slate-400"}`}>
                {step.label}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{step.description}</p>
            </div>
          );
        })}
      </div>

      <div className={`space-y-0 sm:hidden ${cancelled ? "opacity-40 grayscale" : ""}`}>
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const completed = index < currentIndex;
          return (
            <div key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
              {index < STEPS.length - 1 && (
                <div className={`absolute left-[21px] top-10 h-full w-0.5 ${index < currentIndex ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
              <StepIcon icon={step.icon} active={active} completed={completed} />
              <div className="pt-1">
                <p className={`text-xs font-black ${active ? "text-[#ee4d2d]" : completed ? "text-emerald-700" : "text-slate-400"}`}>
                  {step.label}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {cancelled && (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-200">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-rose-700">Đơn hàng đã bị hủy</p>
            <p className="mt-1 text-[11px] text-rose-600">Quá trình xử lý và giao hàng của đơn này đã dừng.</p>
          </div>
        </div>
      )}
    </section>
  );
}
