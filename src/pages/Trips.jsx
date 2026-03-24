import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plane, Calendar, Users, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatGuests = (booking) => {
  const adults = booking.num_adults ?? booking.num_guests ?? 0;
  const children = booking.num_children ?? 0;
  const infants = booking.num_infants ?? 0;
  const total = booking.num_guests ?? adults + children + infants;
  const detailParts = [
    adults ? `${adults} người lớn` : null,
    children ? `${children} trẻ em` : null,
    infants ? `${infants} em bé` : null,
  ].filter(Boolean);
  const detail = detailParts.length ? ` • ${detailParts.join(", ")}` : "";
  return `${total} khách${detail}`;
};

export default function Trips() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/my-bookings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBookings();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Chuyến đi của bạn
      </h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Chưa có chuyến đi nào được đặt... chưa!
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Đã đến lúc phủi bụi hành lý và bắt đầu chuẩn bị cho chuyến phiêu lưu
            tiếp theo của bạn.
          </p>
          <Link
            to="/"
            className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Bắt đầu tìm kiếm
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow"
            >
              <div className="md:w-1/3 h-48 md:h-auto relative">
                <img
                  src={booking.image_url.split(",")[0]}
                  alt={booking.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {booking.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : booking.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {booking.status === "pending"
                        ? "Chờ xác nhận"
                        : booking.status === "confirmed"
                          ? "Đã xác nhận"
                          : booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.location}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Nhận phòng</p>
                        <p>{formatDate(booking.check_in_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Trả phòng</p>
                        <p>{formatDate(booking.check_out_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{formatGuests(booking)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Tổng tiền</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatPrice(booking.total_price)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
