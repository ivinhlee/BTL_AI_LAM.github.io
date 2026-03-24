import { useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId");

  const handlePay = () => {
    // Fake payment success
    navigate("/trips", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Thanh toán</p>
            <h1 className="text-2xl font-bold text-slate-900">
              Xác nhận đặt phòng
            </h1>
          </div>
        </div>

        {bookingId && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Mã đặt chỗ: #{bookingId}</span>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600">
          <p>
            Đây là bước xác nhận thanh toán giả lập. Nhấn "Thanh toán" để hoàn
            tất và về trang Hành trình.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <button
            onClick={handlePay}
            className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
