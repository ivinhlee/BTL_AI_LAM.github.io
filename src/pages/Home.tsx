import React, { useState, useEffect } from 'react';
import { MapPin, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';
import toast from 'react-hot-toast';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const { token, user } = useAuth();

  // 1. Tải danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data.slice(0, 8));
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách phòng:', error);
      }
    };
    fetchRooms();
  }, []);

  // 2. Tải danh sách yêu thích
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!token) {
        setWishlistIds([]);
        return;
      }
      try {
        const response = await fetch('/api/wishlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWishlistIds(data.map((room: Room) => room.id));
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
      }
    };
    fetchWishlist();
  }, [token]);

  const toggleWishlist = async (e: React.MouseEvent, roomId: number) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu vào danh sách yêu thích');
      return;
    }
    const isWishlisted = wishlistIds.includes(roomId);
    try {
      const method = isWishlisted ? 'DELETE' : 'POST';
      const url = isWishlisted ? `/api/wishlist/${roomId}` : '/api/wishlist';
      const body = isWishlisted ? undefined : JSON.stringify({ room_id: roomId });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });

      if (response.ok) {
        setWishlistIds(prev => isWishlisted ? prev.filter(id => id !== roomId) : [...prev, roomId]);
        toast.success(isWishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã lưu vào yêu thích');
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="h-52 md:h-56 w-full" aria-hidden />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Chỗ ở Nổi Bật</h2>
            <p className="text-slate-500">Những địa điểm được yêu thích nhất trong tháng</p>
          </div>
          <Link to="/rooms" className="text-emerald-600 font-bold hover:underline transition-all flex items-center gap-1">
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {rooms.map((room) => (
            <Link key={room.id} to={`/rooms/${room.id}`} className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={room.image_url.split(',')[0]} // Lấy ảnh đầu tiên nếu có nhiều ảnh
                  alt={room.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold shadow-sm z-10">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9
                </div>
                <button onClick={(e) => toggleWishlist(e, room.id)} className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-all z-10">
                  <Heart className={`w-5 h-5 ${wishlistIds.includes(room.id) ? 'text-emerald-500 fill-emerald-500' : 'text-white'}`} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1 text-slate-400 text-sm mb-2"><MapPin className="w-4 h-4" />{room.location}</div>
                <h3 className="font-bold text-slate-900 mb-4 line-clamp-1 group-hover:text-emerald-600 transition-colors">{room.title}</h3>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-lg font-black text-emerald-600">{formatPrice(room.price_per_night)}<span className="text-xs font-normal text-slate-400"> /đêm</span></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}