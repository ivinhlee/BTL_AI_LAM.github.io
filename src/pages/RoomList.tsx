import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, BedDouble, Bath, AlertCircle, Search, Filter, SlidersHorizontal, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'rc-slider';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RoomSkeleton } from '../components/RoomSkeleton.tsx';
import 'rc-slider/assets/index.css';

const Range = (Slider as any).Range || (() => null);

// Hàm format tiền tệ VNĐ
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function RoomList() {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const initialGuests = searchParams.get('guests') || '';
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  // Filter states
  const [searchTerm, setSearchTerm] = useState(initialLocation);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000000]);
  const [minGuests, setMinGuests] = useState<number | ''>(initialGuests ? Number(initialGuests) : '');
  const [minBeds, setMinBeds] = useState<number | ''>('');
  const [minBaths, setMinBaths] = useState<number | ''>('');
  const [category, setCategory] = useState<string>('all');
  
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 20000000]);
    setMinGuests('');
    setMinBeds('');
    setMinBaths('');
    setCategory('all');
    navigate('/rooms');
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Luôn lấy toàn bộ phòng, để frontend tự lọc
        const response = await fetch(`/api/rooms`);

        if (!response.ok) {
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }

        const data = await response.json();
        setRooms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) params.set('location', trimmedSearch);
    if (minGuests !== '') params.set('guests', String(minGuests));

    navigate({ search: params.toString() }, { replace: true });
  }, [searchTerm, minGuests, navigate]);

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

  // Lọc danh sách phòng dựa trên các tiêu chí
  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    return rooms.filter((room) => {
      // 1. Tìm kiếm theo tên hoặc địa điểm
      const matchSearch = !hasSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.location.toLowerCase().includes(normalizedSearch) ||
        room.address.toLowerCase().includes(normalizedSearch);
      
      // 2. Lọc theo giá theo slider
      const matchMinPrice = room.price_per_night >= priceRange[0];
      const matchMaxPrice = room.price_per_night <= priceRange[1];
      
      // 3. Lọc theo số lượng khách, giường, phòng tắm
      const matchGuests = minGuests === '' || room.max_guests >= Number(minGuests);
      const matchBeds = minBeds === '' || room.bed_count >= Number(minBeds);
      const matchBaths = minBaths === '' || room.bath_count >= Number(minBaths);
      
      // 4. Lọc theo loại phòng
      const matchCategory = category === 'all' || room.category === category;

      return matchSearch && matchMinPrice && matchMaxPrice && matchGuests && matchBeds && matchBaths && matchCategory;
    });
  }, [rooms, searchTerm, priceRange, minGuests, minBeds, minBaths, category]);

  // Lấy danh sách các loại phòng duy nhất để làm filter
  const categories = useMemo(() => {
    const cats = new Set(rooms.map(room => room.category));
    return ['all', ...Array.from(cats)];
  }, [rooms]);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Danh sách Phòng</h1>
            <p className="text-slate-500 text-lg">Khám phá {filteredRooms.length} chỗ ở tuyệt vời</p>
          </div>
          
          {/* Nút bật tắt filter trên mobile */}
          <button 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {showFiltersMobile ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Bộ lọc */}
          <div className={`w-full md:w-72 shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Bộ lọc tìm kiếm</h2>
            </div>

            <div className="space-y-6">
              {/* Tìm kiếm */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Tên phòng, địa điểm..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Loại chỗ ở */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Loại chỗ ở</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                >
                  <option value="all">Tất cả các loại</option>
                  {categories.filter(c => c !== 'all').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Khoảng giá */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Khoảng giá (VNĐ/đêm)</label>
                <div className="relative px-1 pt-6 pb-4">
                  <div className="absolute inset-x-0 top-4 h-12 flex items-end gap-1 pointer-events-none opacity-40">
                    {[12, 8, 14, 6, 10, 16, 9, 7, 12, 5, 11, 15].map((h, idx) => (
                      <div key={idx} className="flex-1 bg-emerald-200/60 rounded-sm" style={{ height: `${h * 4}px` }} />
                    ))}
                  </div>
                  <Range
                    min={0}
                    max={20000000}
                    step={100000}
                    value={priceRange}
                    allowCross={false}
                    onChange={(val) => setPriceRange(val as [number, number])}
                    railStyle={{ backgroundColor: '#e5e7eb', height: 8, borderRadius: 999 }}
                    trackStyle={[
                      { backgroundColor: '#10b981', height: 8 },
                      { backgroundColor: '#10b981', height: 8 }
                    ]}
                    handleStyle={[
                      { borderColor: '#10b981', backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)', width: 20, height: 20, marginTop: -6 },
                      { borderColor: '#10b981', backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)', width: 20, height: 20, marginTop: -6 }
                    ]}
                  />
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mt-4">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Tiện ích */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-900">Tiện ích tối thiểu</p>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-600 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Số khách
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Bất kỳ"
                    value={minGuests}
                    onChange={(e) => setMinGuests(e.target.value ? Number(e.target.value) : '')}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-600 flex items-center gap-2">
                    <BedDouble className="w-4 h-4" /> Số giường
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Bất kỳ"
                    value={minBeds}
                    onChange={(e) => setMinBeds(e.target.value ? Number(e.target.value) : '')}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-600 flex items-center gap-2">
                    <Bath className="w-4 h-4" /> Phòng tắm
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Bất kỳ"
                    value={minBaths}
                    onChange={(e) => setMinBaths(e.target.value ? Number(e.target.value) : '')}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Nút xóa bộ lọc */}
              <button 
                onClick={clearFilters}
                className="w-full py-2.5 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors mt-4"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>

          {/* Danh sách phòng */}
          <div className="flex-1">
            {/* 1. Trạng thái Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <RoomSkeleton key={i} />
                ))}
              </div>
            )}

            {/* 2. Trạng thái Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-2xl border border-red-100">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-700 font-medium text-center px-4 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* 3. Trạng thái Empty (Không có dữ liệu) */}
            {!loading && !error && filteredRooms.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Search className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy phòng phù hợp</h3>
                <p className="text-slate-500 text-sm mb-4">Hãy thử thay đổi bộ lọc tìm kiếm của bạn.</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            {/* 4. Trạng thái Success (Hiển thị Grid) */}
            {!loading && !error && filteredRooms.length > 0 && (
              <motion.div 
                layout 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {filteredRooms.map((room) => (
                    <motion.div
                      key={room.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Link 
                        to={`/rooms/${room.id}`} 
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100 flex flex-col relative"
                      >
                        {/* Ảnh Thumbnail & Badge Category */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 rounded-xl">
                          <img 
                            src={room.image_url} 
                            alt={room.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-800 shadow-sm z-10">
                            {room.category}
                          </div>
                          {/* Heart Button */}
                          <button
                            onClick={(e) => toggleWishlist(e, room.id)}
                            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors z-10"
                          >
                            <Heart className={`w-5 h-5 ${wishlistIds.includes(room.id) ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
                          </button>
                        </div>

                        {/* Nội dung Card */}
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-2.5">
                            <MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span className="truncate">{room.location}</span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
                            {room.title}
                          </h3>

                          {/* Tiện ích cơ bản */}
                          <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{room.max_guests}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BedDouble className="w-4 h-4" />
                              <span>{room.bed_count}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4" />
                              <span>{room.bath_count}</span>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                            <div className="text-slate-500 text-sm">
                              Giá mỗi đêm
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-emerald-600">
                                {formatPrice(room.price_per_night)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
