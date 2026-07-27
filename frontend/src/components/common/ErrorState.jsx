export default function ErrorState({ message = "Không thể tải dữ liệu" }) {
  return <p className="rounded-xl bg-red-50 p-4 text-red-700">{message}</p>;
}
