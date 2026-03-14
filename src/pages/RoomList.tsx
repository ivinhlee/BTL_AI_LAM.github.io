import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, BedDouble, Bath, AlertCircle, Search, Filter, SlidersHorizontal, Heart, X, CheckSquare, ShieldCheck, Globe, Wifi, Waves, ChefHat, Wind, WashingMachine, Tv, Car, Flame, Bath as BathIcon, Sun, TreePine, UtensilsCrossed, Monitor, Scissors, Shirt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RoomSkeleton } from '../components/RoomSkeleton.tsx';
import { PriceHistogram } from '../components/PriceHistogram.tsx';
import 'rc-slider/assets/index.css';

const AMENITIES_LIST = [
  { key: 'wifi', name: 'Wifi', icon: Wifi },
  { key: 'pool', name: 'Bể bơi', icon: Waves },
  { key: 'kitchen', name: 'Bếp', icon: ChefHat },
  { key: 'air_conditioning', name: 'Điều hòa', icon: Wind },
  { key: 'washer', name: 'Máy giặt', icon: WashingMachine },
  { key: 'tv', name: 'TV', icon: Tv },
  { key: 'parking', name: 'Chỗ đỗ xe', icon: Car },
  { key: 'fireplace', name: 'Lò sưởi', icon: Flame },
  { key: 'hot_tub', name: 'Bồn tắm nước nóng', icon: BathIcon },
  { key: 'balcony', name: 'Sân trong hoặc ban công', icon: Sun },
  { key: 'backyard', name: 'Sân sau', icon: TreePine },
  { key: 'bbq', name: 'Lò nướng BBQ', icon: UtensilsCrossed },
  { key: 'workspace', name: 'Bàn làm việc', icon: Monitor },
  { key: 'hair_dryer', name: 'Máy sấy tóc', icon: Scissors },
  { key: 'iron', name: 'Bàn ủi', icon: Shirt }
];

const AMENITY_ALIASES: Record<string, string> = {
  wifi: 'wifi',
  Wifi: 'wifi',
  pool: 'pool',
  'Bể bơi': 'pool',
  kitchen: 'kitchen',
  'Bếp': 'kitchen',
  air_conditioning: 'air_conditioning',
  'Điều hòa': 'air_conditioning',
  washer: 'washer',
  'Máy giặt': 'washer',
  tv: 'tv',
  TV: 'tv',
  parking: 'parking',
  'Chỗ đỗ xe': 'parking',
  fireplace: 'fireplace',
  'Lò sưởi': 'fireplace',
  hot_tub: 'hot_tub',
  'Bồn tắm nước nóng': 'hot_tub',
  balcony: 'balcony',
  'Sân trong hoặc ban công': 'balcony',
  backyard: 'backyard',
  'Sân sau': 'backyard',
  bbq: 'bbq',
  'Lò nướng BBQ': 'bbq',
  workspace: 'workspace',
  'Bàn làm việc': 'workspace',
  hair_dryer: 'hair_dryer',
  'Máy sấy tóc': 'hair_dryer',
  iron: 'iron',
  'Bàn ủi': 'iron',
};

const BOOKING_OPTIONS_LIST = [
  'Tự nhận phòng', 'Hủy miễn phí', 'Cho phép mang theo thú cưng'
];

const HOST_LANGUAGES_LIST = [
  'Tiếng Anh', 'Tiếng Việt', 'Tiếng Pháp', 'Tiếng Tây Ban Nha', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'
];

// Hàm format tiền tệ VNĐ
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const parseListField = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const input = value.trim();
  if (!input) return [];

  if (input.startsWith('[')) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to CSV parser
    }
  }

  return input.split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeAmenityKey = (value: string): string => {
  const trimmed = value.trim();
  return AMENITY_ALIASES[trimmed] || trimmed.toLowerCase();
};

const parseAmenityField = (value: unknown): string[] => {
  return parseListField(value).map(normalizeAmenityKey);
};

export default function RoomList() {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get('location') || '';
  const initialGuests = searchParams.get('guests') || '';
  const initialBeds = searchParams.get('beds') || '';
  const initialBaths = searchParams.get('baths') || '';
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const searchTerm = searchParams.get('location') || '';
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active filters applied to the list
  const [activeFilters, setActiveFilters] = useState({
    priceRange: [0, 20000000] as [number, number],
    roomType: 'Bất kỳ loại nào',
    minGuests: initialGuests ? Number(initialGuests) : ('' as number | ''),
    minBeds: initialBeds ? Number(initialBeds) : ('' as number | ''),
    minBaths: initialBaths ? Number(initialBaths) : ('' as number | ''),
    amenities: [] as string[],
    bookingOptions: [] as string[],
    hostLanguages: [] as string[]
  });

  // Temporary filters inside the modal
  const [tempFilters, setTempFilters] = useState(activeFilters);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
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
    const currentLoc = searchParams.get('location');
    if (currentLoc) params.set('location', currentLoc);
    if (activeFilters.minGuests !== '') params.set('guests', String(activeFilters.minGuests));
    if (activeFilters.minBeds !== '') params.set('beds', String(activeFilters.minBeds));
    if (activeFilters.minBaths !== '') params.set('baths', String(activeFilters.minBaths));
    navigate({ search: params.toString() }, { replace: true });
  }, [activeFilters.minGuests, activeFilters.minBeds, activeFilters.minBaths, navigate]);

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
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist/${roomId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
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

  // Live count logic for the modal
  const liveCount = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    return rooms.filter((room) => {
      const matchSearch = !hasSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.location.toLowerCase().includes(normalizedSearch) ||
        room.address.toLowerCase().includes(normalizedSearch);
      
      const matchMinPrice = room.price_per_night >= tempFilters.priceRange[0];
      const matchMaxPrice = room.price_per_night <= tempFilters.priceRange[1];
      
      const matchRoomType = tempFilters.roomType === 'Bất kỳ loại nào' || room.room_type === tempFilters.roomType;
      
      const matchGuests = tempFilters.minGuests === '' || room.max_guests >= Number(tempFilters.minGuests);
      const matchBeds = tempFilters.minBeds === '' || room.bed_count >= Number(tempFilters.minBeds);
      const matchBaths = tempFilters.minBaths === '' || room.bath_count >= Number(tempFilters.minBaths);
      
      const matchAmenities = tempFilters.amenities.every(a => {
        const roomAmenities = parseAmenityField((room as any).amenities);
        return roomAmenities.includes(a);
      });
      const matchBookingOptions = tempFilters.bookingOptions.every(o => {
        const roomOptions = parseListField((room as any).booking_options);
        return roomOptions.includes(o);
      });
      const matchHostLanguages = tempFilters.hostLanguages.every(l => {
        const roomLangs = parseListField((room as any).host_languages);
        return roomLangs.includes(l);
      });

      return matchSearch && matchMinPrice && matchMaxPrice && matchRoomType && matchGuests && matchBeds && matchBaths && matchAmenities && matchBookingOptions && matchHostLanguages;
    }).length;
  }, [rooms, searchTerm, tempFilters]);

  // Filtered rooms for the main list
  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const hasSearch = normalizedSearch.length > 0;

    return rooms.filter((room) => {
      const matchSearch = !hasSearch ||
        room.title.toLowerCase().includes(normalizedSearch) ||
        room.location.toLowerCase().includes(normalizedSearch) ||
        room.address.toLowerCase().includes(normalizedSearch);
      
      const matchMinPrice = room.price_per_night >= activeFilters.priceRange[0];
      const matchMaxPrice = room.price_per_night <= activeFilters.priceRange[1];
      
      const matchRoomType = activeFilters.roomType === 'Bất kỳ loại nào' || room.room_type === activeFilters.roomType;
      
      const matchGuests = activeFilters.minGuests === '' || room.max_guests >= Number(activeFilters.minGuests);
      const matchBeds = activeFilters.minBeds === '' || room.bed_count >= Number(activeFilters.minBeds);
      const matchBaths = activeFilters.minBaths === '' || room.bath_count >= Number(activeFilters.minBaths);
      
      const matchAmenities = activeFilters.amenities.every(a => {
        const roomAmenities = parseAmenityField((room as any).amenities);
        return roomAmenities.includes(a);
      });
      const matchBookingOptions = activeFilters.bookingOptions.every(o => {
        const roomOptions = parseListField((room as any).booking_options);
        return roomOptions.includes(o);
      });
      const matchHostLanguages = activeFilters.hostLanguages.every(l => {
        const roomLangs = parseListField((room as any).host_languages);
        return roomLangs.includes(l);
      });

      return matchSearch && matchMinPrice && matchMaxPrice && matchRoomType && matchGuests && matchBeds && matchBaths && matchAmenities && matchBookingOptions && matchHostLanguages;
    });
  }, [rooms, searchTerm, activeFilters]);

  const openFilterModal = () => {
    setTempFilters(activeFilters);
    setIsFilterModalOpen(true);
  };

  useEffect(() => {
    const handleOpenFilter = () => openFilterModal();
    window.addEventListener('openFilterModal', handleOpenFilter);
    return () => window.removeEventListener('openFilterModal', handleOpenFilter);
  }, [activeFilters]);

  const applyFilters = () => {
    setActiveFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const clearTempFilters = () => {
    setTempFilters({
      priceRange: [0, 20000000],
      roomType: 'Bất kỳ loại nào',
      minGuests: '',
      minBeds: '',
      minBaths: '',
      amenities: [],
      bookingOptions: [],
      hostLanguages: []
    });
  };

  const toggleTempSelection = (item: string, listKey: 'amenities' | 'bookingOptions' | 'hostLanguages') => {
    setTempFilters(prev => {
      const list = prev[listKey];
      if (list.includes(item)) {
        return { ...prev, [listKey]: list.filter(i => i !== item) };
      } else {
        return { ...prev, [listKey]: [...list, item] };
      }
    });
  };

  const updateCounter = (key: 'minGuests' | 'minBeds' | 'minBaths', delta: number) => {
    setTempFilters(prev => {
      const current = prev[key] === '' ? 0 : Number(prev[key]);
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next === 0 ? '' : next };
    });
  };

  return (
    <div className="bg-white min-h-screen pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Danh sách phòng */}
        <div className="w-full">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <RoomSkeleton key={i} />
              ))}
            </div>
          )}

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

          {!loading && !error && filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <Search className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy phòng phù hợp</h3>
              <p className="text-slate-500 text-sm mb-4">Hãy thử thay đổi bộ lọc tìm kiếm của bạn.</p>
              <button
                onClick={() => {
                  navigate('/rooms');
                  setActiveFilters({
                    priceRange: [0, 20000000],
                    roomType: 'Bất kỳ loại nào',
                    minGuests: '',
                    minBeds: '',
                    minBaths: '',
                    amenities: [],
                    bookingOptions: [],
                    hostLanguages: []
                  });
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {!loading && !error && filteredRooms.length > 0 && (
            <motion.div 
              layout 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
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
                      className="group flex flex-col relative"
                    >
                      {/* Ảnh Thumbnail */}
                      <div className="relative aspect-square overflow-hidden bg-slate-200 rounded-2xl mb-3">
                        <img 
                          src={room.image_url.split(',')[0]} 
                          alt={room.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {/* Heart Button */}
                        <button
                          onClick={(e) => toggleWishlist(e, room.id)}
                          className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                        >
                          <Heart className={`w-6 h-6 ${wishlistIds.includes(room.id) ? 'text-emerald-500 fill-emerald-500' : 'text-white fill-black/30'}`} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Nội dung Card */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                            {room.location}
                          </h3>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-1">{room.title}</p>
                        <p className="text-slate-500 text-sm">{room.max_guests} khách · {room.bed_count} giường</p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="font-bold text-slate-900">{formatPrice(room.price_per_night)}</span>
                          <span className="text-slate-900">/ đêm</span>
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

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[780px] md:max-h-[85vh] bg-white md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <button onClick={() => setIsFilterModalOpen(false)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-700" />
                </button>
                <h2 className="text-lg font-bold text-slate-900">Bộ lọc</h2>
                <div className="w-9" /> {/* Spacer for centering */}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Khoảng giá */}
                <div className="pb-8 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Khoảng giá</h3>
                  <p className="text-slate-500 mb-6">Giá chuyến đi, đã bao gồm mọi khoản phí</p>

                  <PriceHistogram
                    rooms={rooms}
                    priceRange={tempFilters.priceRange}
                    setPriceRange={(range) => setTempFilters({...tempFilters, priceRange: range})}
                  />
                </div>

                {/* Loại nơi ở */}
                <div className="pb-8 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Loại nơi ở</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {['Bất kỳ loại nào', 'Phòng', 'Toàn bộ nhà'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setTempFilters({...tempFilters, roomType: type})}
                        className={`flex-1 py-3 px-4 rounded-xl border font-medium transition-colors ${
                          tempFilters.roomType === type 
                            ? 'border-black bg-slate-100 text-black' 
                            : 'border-slate-300 text-slate-700 hover:border-black'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phòng và phòng ngủ */}
                <div className="pb-8 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Phòng và phòng ngủ</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-800 font-medium">Khách</div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateCounter('minGuests', -1)}
                          disabled={tempFilters.minGuests === '' || tempFilters.minGuests === 0}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >-</button>
                        <span className="w-8 text-center">{tempFilters.minGuests === '' ? 'Bất kỳ' : tempFilters.minGuests}</span>
                        <button 
                          onClick={() => updateCounter('minGuests', 1)}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-slate-800 font-medium">Phòng ngủ</div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateCounter('minBeds', -1)}
                          disabled={tempFilters.minBeds === '' || tempFilters.minBeds === 0}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >-</button>
                        <span className="w-8 text-center">{tempFilters.minBeds === '' ? 'Bất kỳ' : tempFilters.minBeds}</span>
                        <button 
                          onClick={() => updateCounter('minBeds', 1)}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-slate-800 font-medium">Phòng tắm</div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateCounter('minBaths', -1)}
                          disabled={tempFilters.minBaths === '' || tempFilters.minBaths === 0}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 disabled:opacity-30 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >-</button>
                        <span className="w-8 text-center">{tempFilters.minBaths === '' ? 'Bất kỳ' : tempFilters.minBaths}</span>
                        <button 
                          onClick={() => updateCounter('minBaths', 1)}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-slate-800 hover:text-slate-800 transition-colors"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiện nghi */}
                <div className="pb-8 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Tiện nghi</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {AMENITIES_LIST.map((amenity) => {
                      const isSelected = tempFilters.amenities.includes(amenity.key);
                      const Icon = amenity.icon;
                      return (
                        <motion.button
                          key={amenity.key}
                          onClick={() => toggleTempSelection(amenity.key, 'amenities')}
                          whileTap={{ scale: 0.95 }}
                          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            isSelected 
                              ? 'border-black bg-slate-50' 
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <Icon className={`w-8 h-8 ${isSelected ? 'text-black' : 'text-slate-600'}`} strokeWidth={isSelected ? 2 : 1.5} />
                          <span className={`text-sm text-center ${isSelected ? 'font-semibold text-black' : 'text-slate-600'}`}>
                            {amenity.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Tùy chọn đặt phòng */}
                <div className="pb-8 border-b border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Tùy chọn đặt phòng</h3>
                  <div className="space-y-4">
                    {BOOKING_OPTIONS_LIST.map((option) => (
                      <label key={option} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-700 text-lg">{option}</span>
                        <div className={`w-12 h-8 rounded-full transition-colors relative ${tempFilters.bookingOptions.includes(option) ? 'bg-black' : 'bg-slate-300'}`}>
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={tempFilters.bookingOptions.includes(option)}
                            onChange={() => toggleTempSelection(option, 'bookingOptions')}
                          />
                          <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${tempFilters.bookingOptions.includes(option) ? 'left-5' : 'left-1'}`} />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white">
                <button 
                  onClick={clearTempFilters}
                  className="font-semibold text-slate-900 underline hover:text-slate-600 transition-colors"
                >
                  Xóa tất cả
                </button>
                <button 
                  onClick={applyFilters}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  Hiển thị {liveCount} địa điểm
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
