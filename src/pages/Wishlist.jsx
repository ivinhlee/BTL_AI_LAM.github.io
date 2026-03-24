import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }
      const data = await response.json();
      setWishlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWishlist();
    }
  }, [token]);

  const removeFromWishlist = async (roomId) => {
    try {
      const response = await fetch(`/api/wishlist/${roomId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setWishlist(wishlist.filter((room) => room.id !== roomId));
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        toast.error("Không thể xóa khỏi danh sách yêu thích");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    }
  };

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
        Danh sách yêu thích
      </h1>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Tạo danh sách yêu thích đầu tiên của bạn
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Khi bạn tìm kiếm, hãy nhấp vào biểu tượng trái tim để lưu các địa
            điểm bạn thích vào danh sách yêu thích.
          </p>
          <Link
            to="/"
            className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Bắt đầu tìm kiếm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((room) => (
            <div key={room.id} className="group cursor-pointer relative">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden rounded-2xl mb-3">
                <img
                  src={room.image_url.split(",")[0]}
                  alt={room.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />

                {/* Heart Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(room.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors z-10"
                >
                  <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                </button>
              </div>

              {/* Content */}
              <Link to={`/rooms/${room.id}`} className="block">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-900 truncate pr-4">
                    {room.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
                    <span>4.9</span>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-1">{room.location}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="font-semibold text-slate-900">
                    {formatPrice(room.price_per_night)}
                  </span>
                  <span className="text-slate-500 text-sm">/ đêm</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
