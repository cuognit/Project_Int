export default function EmptyState({ message = "Chưa có dữ liệu" }) {
  return (
    <p className="rounded-xl bg-white p-8 text-center text-slate-500">
      {message}
    </p>
  );
}
