import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';
import toast from 'react-hot-toast';

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
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="group block bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <img 
                  src={room.image_url.split(',')[0]} // Lấy ảnh đầu tiên nếu có nhiều ảnh
                  alt={room.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button
                  onClick={(e) => toggleWishlist(e, room.id)}
                  className="absolute top-3 right-3 z-10"
                  aria-label="Toggle wishlist"
                >
                  <Heart
                    className={`w-5 h-5 drop-shadow ${
                      wishlistIds.includes(room.id)
                        ? 'text-white fill-white'
                        : 'text-white'
                    }`}
                  />
                </button>
              </div>
              <div className="px-1 pt-4 pb-5">
                <h3 className="text-base font-semibold text-black mb-1 leading-tight">{room.title}</h3>
                <p className="text-sm text-gray-500">{room.bed_count} giường • ★ 4.9</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}