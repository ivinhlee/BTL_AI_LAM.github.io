import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Search, Star, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';
import toast from 'react-hot-toast';

// Hàm format tiền tệ VNĐ
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Search states
  const [searchLocation, setSearchLocation] = useState('');
  const [searchGuests, setSearchGuests] = useState('1');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data.slice(0, 8)); // Lấy 8 phòng nổi bật
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách phòng:', error);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!token) {
        setWishlistIds([]);
        return;
      }
      try {
        const response = await fetch('/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
    e.preventDefault(); // Prevent navigating to room detail
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu vào danh sách yêu thích');
      return;
    }

    const isWishlisted = wishlistIds.includes(roomId);
    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist/${roomId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setWishlistIds(wishlistIds.filter(id => id !== roomId));
          toast.success('Đã xóa khỏi danh sách yêu thích');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ room_id: roomId })
        });
        if (response.ok) {
          setWishlistIds([...wishlistIds, roomId]);
          toast.success('Đã lưu vào danh sách yêu thích');
        }
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (searchGuests) params.append('guests', searchGuests);
    
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" 
            alt="Travel Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-900/40"></div>
        </div>

        {/* Hero Content & Search Bar */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            Tìm chỗ ở hoàn hảo cho chuyến đi của bạn
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Khám phá hàng ngàn căn hộ, biệt thự và phòng riêng với giá tốt nhất. Trải nghiệm không gian tuyệt vời ngay hôm nay.
          </p>

          {/* Floating Search Bar */}
          <div className="bg-white p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 max-w-5xl mx-auto">
            
            {/* Location Input */}
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-full cursor-text transition-colors">
              <MapPin className="text-emerald-500 w-6 h-6 shrink-0" />
              <div className="flex flex-col text-left w-full">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Địa điểm</span>
                <input 
                  type="text" 
                  placeholder="Bạn muốn đi đâu?" 
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-600 text-sm w-full truncate placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200"></div>

            {/* Start Date */}
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-full cursor-text transition-colors">
              <Calendar className="text-emerald-500 w-6 h-6 shrink-0" />
              <div className="flex flex-col text-left w-full">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Nhận phòng</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none outline-none text-slate-600 text-sm w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200"></div>

            {/* End Date */}
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-full cursor-text transition-colors">
              <Calendar className="text-emerald-500 w-6 h-6 shrink-0" />
              <div className="flex flex-col text-left w-full">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trả phòng</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none outline-none text-slate-600 text-sm w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-200"></div>

            {/* Guests */}
            <div className="flex-1 w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-full cursor-text transition-colors">
              <Users className="text-emerald-500 w-6 h-6 shrink-0" />
              <div className="flex flex-col text-left w-full">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Số khách</span>
                <select 
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  className="bg-transparent border-none outline-none text-slate-600 text-sm w-full cursor-pointer appearance-none"
                >
                  <option value="1">1 người</option>
                  <option value="2">2 người</option>
                  <option value="3">3 người</option>
                  <option value="4">4+ người</option>
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button 
              onClick={handleSearch}
              className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white p-4 md:px-8 md:py-4 rounded-xl md:rounded-full flex items-center justify-center gap-2 transition-colors font-bold shadow-md hover:shadow-lg shrink-0"
            >
              <Search className="w-5 h-5" />
              <span className="md:hidden lg:inline">Tìm kiếm</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Chỗ ở Nổi Bật</h2>
              <p className="text-slate-500">Những địa điểm được yêu thích nhất trong tháng</p>
            </div>
            <Link to="/rooms" className="hidden sm:inline-flex text-emerald-600 font-medium hover:text-emerald-700 transition-colors items-center gap-1">
              Xem tất cả <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <Link key={room.id} to={`/rooms/${room.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col relative">
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={room.image_url} 
                    alt={room.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-slate-800 shadow-sm z-10">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    4.9
                  </div>
                  {/* Heart Button */}
                  <button
                    onClick={(e) => toggleWishlist(e, room.id)}
                    className="absolute top-3 left-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors z-10"
                  >
                    <Heart className={`w-5 h-5 ${wishlistIds.includes(room.id) ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{room.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {room.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      <span className="font-medium text-slate-900">124</span> đánh giá
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-600">{formatPrice(room.price_per_night)}</span>
                      <span className="text-xs text-slate-500 block">/ đêm</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-10 text-center sm:hidden">
            <Link to="/rooms" className="inline-flex bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors items-center gap-2 px-6 py-3 rounded-xl shadow-sm">
              Xem tất cả phòng
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
