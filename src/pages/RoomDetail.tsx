import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Tag,
  Tv,
  User,
  Utensils,
  Waves,
  Wifi,
  Wind,
  WashingMachine,
  X,
} from 'lucide-react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import toast from 'react-hot-toast';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface Review {
  id: number;
  room_id: number;
  user_name: string;
  avatar_url?: string | null;
  comment?: string | null;
  cleanliness: number;
  accuracy: number;
  check_in: number;
  communication: number;
  location: number;
  value: number;
  created_at: string;
}

interface ReviewStats {
  review_count: number;
  cleanliness: number | null;
  accuracy: number | null;
  check_in: number | null;
  communication: number | null;
  location: number | null;
  value: number | null;
}

interface RoomDetailData extends Room {
  review_stats?: ReviewStats;
  rating_average?: number | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatReviewDate = (value: string) => {
  try {
    return format(new Date(value), "'tháng' M 'năm' yyyy", { locale: vi });
  } catch {
    return value;
  }
};

const AMENITY_ICON_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  wifi: { label: 'Wifi', icon: Wifi },
  kitchen: { label: 'Bếp', icon: Utensils },
  tv: { label: 'TV', icon: Tv },
  pool: { label: 'Bể bơi', icon: Waves },
  washer: { label: 'Máy giặt', icon: WashingMachine },
  parking: { label: 'Chỗ đỗ xe', icon: Car },
  air_conditioning: { label: 'Điều hòa', icon: Wind },
  fireplace: { label: 'Lò sưởi', icon: Sparkles },
  garden: { label: 'Sân vườn', icon: CheckCircle },
  workspace: { label: 'Bàn làm việc', icon: CheckCircle },
};

const AMENITY_ALIASES: Record<string, string> = {
  Wifi: 'wifi',
  wifi: 'wifi',
  'Bếp': 'kitchen',
  kitchen: 'kitchen',
  TV: 'tv',
  tv: 'tv',
  'Bể bơi': 'pool',
  pool: 'pool',
  'Máy giặt': 'washer',
  washer: 'washer',
  'Chỗ đỗ xe': 'parking',
  parking: 'parking',
  'Điều hòa': 'air_conditioning',
  air_conditioning: 'air_conditioning',
  'Lò sưởi': 'fireplace',
  fireplace: 'fireplace',
  'Sân vườn': 'garden',
  garden: 'garden',
  'Bàn làm việc': 'workspace',
  workspace: 'workspace',
};

const parseAmenityKeys = (value: string[] | string | null | undefined): string[] => {
  let rawItems: string[] = [];

  if (Array.isArray(value)) {
    rawItems = value.map((item) => String(item));
  } else if (typeof value === 'string') {
    const input = value.trim();
    if (!input) return [];

    if (input.startsWith('[')) {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) {
          rawItems = parsed.map((item) => String(item));
        }
      } catch {
        rawItems = input.split(',');
      }
    } else {
      rawItems = input.split(',');
    }
  }

  const normalized = rawItems
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => AMENITY_ALIASES[item] || item.toLowerCase());

  return Array.from(new Set(normalized));
};

const REVIEW_CRITERIA = [
  { key: 'cleanliness', label: 'Mức độ sạch sẽ', icon: Sparkles },
  { key: 'accuracy', label: 'Độ chính xác', icon: BadgeCheck },
  { key: 'check_in', label: 'Nhận phòng', icon: KeyRound },
  { key: 'communication', label: 'Giao tiếp', icon: MessageCircle },
  { key: 'location', label: 'Vị trí', icon: MapPin },
  { key: 'value', label: 'Giá trị', icon: Tag },
] as const;

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [room, setRoom] = useState<RoomDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      key: 'selection',
    },
  ]);
  const [hasSelectedDates, setHasSelectedDates] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });

  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || '');

  const [isBooking, setIsBooking] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const bookingPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const roomResponse = await fetch(`/api/rooms/${id}`);
        if (!roomResponse.ok) {
          if (roomResponse.status === 404) throw new Error('Không tìm thấy phòng này.');
          throw new Error('Không thể tải thông tin phòng.');
        }

        const roomContentType = roomResponse.headers.get('content-type') || '';
        if (!roomContentType.includes('application/json')) {
          throw new Error('API phòng không trả về JSON. Vui lòng kiểm tra server backend đang chạy đúng cổng.');
        }

        const roomData = await roomResponse.json();
        setRoom(roomData);

        const reviewsResponse = await fetch(`/api/rooms/${id}/reviews`);
        if (!reviewsResponse.ok) {
          setReviews([]);
          return;
        }

        const reviewsContentType = reviewsResponse.headers.get('content-type') || '';
        if (!reviewsContentType.includes('application/json')) {
          setReviews([]);
          return;
        }

        const reviewData = await reviewsResponse.json();
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!token || !id) return;
      try {
        const response = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const listed = data.some((r: Room) => r.id === Number(id));
          setIsWishlisted(listed);
        }
      } catch {
        // ignore wishlist check failures
      }
    };

    checkWishlistStatus();
  }, [token, id]);

  useEffect(() => {
    setIsAvailable(null);
    setAvailabilityChecked(false);
  }, [dateRange, guests.adults, guests.children, guests.infants]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!bookingPanelRef.current) return;
      if (!bookingPanelRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        setShowGuestPicker(false);
      }
    };

    window.addEventListener('mousedown', onOutsideClick);
    return () => window.removeEventListener('mousedown', onOutsideClick);
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowRight') setLightboxIndex((prev) => prev + 1);
      if (event.key === 'ArrowLeft') setLightboxIndex((prev) => prev - 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen]);

  const selection = dateRange[0];
  const checkInDate = hasSelectedDates && selection.startDate ? format(selection.startDate, 'yyyy-MM-dd') : '';
  const checkOutDate = hasSelectedDates && selection.endDate ? format(selection.endDate, 'yyyy-MM-dd') : '';
  const totalGuests = guests.adults + guests.children + guests.infants;

  const nights = useMemo(() => {
    if (!hasSelectedDates || !selection.startDate || !selection.endDate) return 0;
    const diff = Math.ceil((selection.endDate.getTime() - selection.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [hasSelectedDates, selection.startDate, selection.endDate]);

  const totalPrice = room ? room.price_per_night * nights : 0;

  const allImages = useMemo(() => {
    const parsed = room?.image_url
      ? room.image_url
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url.length > 0)
      : [];

    if (parsed.length > 0) return parsed;

    return ['https://placehold.co/1200x800?text=spotbnb'];
  }, [room?.image_url]);

  const galleryImages = useMemo(() => {
    const padded = [...allImages];
    while (padded.length < 5) padded.push(allImages[0]);
    return padded.slice(0, 5);
  }, [allImages]);

  const normalizedLightboxIndex = ((lightboxIndex % allImages.length) + allImages.length) % allImages.length;

  const reviewStats = room?.review_stats;
  const criteriaValues = REVIEW_CRITERIA.map((item) => {
    const value = reviewStats?.[item.key] ?? null;
    return {
      ...item,
      value: typeof value === 'number' ? value : 0,
    };
  });

  const overallRating = typeof room?.rating_average === 'number'
    ? room.rating_average
    : criteriaValues.reduce((sum, item) => sum + item.value, 0) / REVIEW_CRITERIA.length;

  const amenities = useMemo(() => parseAmenityKeys((room as any)?.amenities), [room]);

  const checkAvailability = async () => {
    if (!room) return false;

    if (!hasSelectedDates || !selection.startDate || !selection.endDate || nights <= 0) {
      toast.error('Vui lòng chọn ngày nhận và trả phòng');
      setShowDatePicker(true);
      return false;
    }

    if (totalGuests < 1 || guests.adults < 1) {
      toast.error('Cần ít nhất 1 người lớn');
      setShowGuestPicker(true);
      return false;
    }

    if (totalGuests > room.max_guests) {
      toast.error(`Tối đa ${room.max_guests} khách (không tính thú cưng)`);
      setShowGuestPicker(true);
      return false;
    }

    try {
      setCheckingAvailability(true);
      const params = new URLSearchParams({
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_guests: String(totalGuests),
      });

      const response = await fetch(`/api/rooms/${room.id}/check-availability?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Không kiểm tra được tình trạng phòng');
      }

      const available = Boolean(payload.available);
      setIsAvailable(available);
      setAvailabilityChecked(true);

      if (available) {
        toast.success('Phòng còn trống cho ngày bạn chọn');
        return true;
      }

      toast.error('Rất tiếc, phòng đã có người đặt trong ngày này');
      return false;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hệ thống');
      setIsAvailable(null);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu vào danh sách yêu thích');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (isWishlisted) {
        const response = await fetch(`/api/wishlist/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setIsWishlisted(false);
          toast.success('Đã xóa khỏi danh sách yêu thích');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ room_id: Number(id) }),
        });
        if (response.ok) {
          setIsWishlisted(true);
          toast.success('Đã lưu vào danh sách yêu thích');
        }
      }
    } catch {
      toast.error('Đã có lỗi xảy ra');
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    if (!availabilityChecked) {
      toast.error('Vui lòng kiểm tra tình trạng còn phòng trước khi đặt');
      return;
    }

    if (isAvailable !== true) {
      toast.error('Phòng đang không khả dụng cho lịch đã chọn');
      return;
    }

    try {
      setIsBooking(true);

      const bookingData = {
        room_id: room.id,
        customer_name: customerName,
        customer_email: customerEmail,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        num_adults: guests.adults,
        num_children: guests.children,
        num_infants: guests.infants,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Đặt phòng thất bại. Vui lòng thử lại.');
      }

      toast.success('Đặt phòng thành công, chuyển tới thanh toán');
      navigate(`/checkout?bookingId=${data.bookingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin phòng...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ôi hỏng!</h2>
        <p className="text-slate-500 mb-6 text-center">{error || 'Không tìm thấy dữ liệu.'}</p>
        <button
          onClick={() => navigate('/rooms')}
          className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section id="anh" className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{room.title}</h1>
            <button
              onClick={toggleWishlist}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-emerald-500 text-emerald-500' : ''}`} />
              Lưu
            </button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-2xl overflow-hidden">
            <button
              type="button"
              className="md:col-span-2 md:row-span-2 h-[420px] md:h-[520px]"
              onClick={() => {
                setLightboxIndex(0);
                setIsLightboxOpen(true);
              }}
            >
              <img src={galleryImages[0]} alt={room.title} className="w-full h-full object-cover hover:brightness-95 transition" />
            </button>

            {galleryImages.slice(1).map((image, index) => {
              const realIndex = index + 1;
              return (
                <button
                  key={`${image}-${realIndex}`}
                  type="button"
                  className="h-[258px]"
                  onClick={() => {
                    setLightboxIndex(realIndex);
                    setIsLightboxOpen(true);
                  }}
                >
                  <div className="relative w-full h-full">
                    <img src={image} alt={`${room.title}-${realIndex + 1}`} className="w-full h-full object-cover hover:brightness-95 transition" />
                  </div>
                </button>
              );
            })}
            </div>

            <button
              type="button"
              onClick={() => {
                setLightboxIndex(0);
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 bg-white/95 text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm hover:bg-white"
            >
              Hiển thị tất cả ảnh
            </button>
          </div>
        </section>

        <div className="bg-white/95 border-y border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-8 h-14 text-sm font-semibold text-slate-700">
              <a href="#anh" className="hover:text-slate-900">Ảnh</a>
              <a href="#tien-nghi" className="hover:text-slate-900">Tiện nghi</a>
              <a href="#danh-gia" className="hover:text-slate-900">Đánh giá</a>
              <a href="#vi-tri" className="hover:text-slate-900">Vị trí</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_26rem] gap-12">
          <div className="space-y-12">
            <section className="border-b border-slate-200 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Toàn bộ {room.category.toLowerCase()} cho thuê tại {room.location}
              </h2>
              <p className="text-lg text-slate-700">
                {room.max_guests} khách · {room.bed_count} giường · {room.bath_count} phòng tắm
              </p>

              <div className="mt-8 p-6 rounded-2xl border border-slate-200 bg-slate-50">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{room.description}</p>
              </div>
            </section>

            <section id="tien-nghi" className="border-b border-slate-200 pb-10">
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Nơi này có những gì cho bạn</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                {amenities.length === 0 ? (
                  <p className="text-slate-500">Chủ nhà chưa cập nhật tiện nghi cho chỗ ở này.</p>
                ) : amenities.map((amenity) => {
                  const amenityMeta = AMENITY_ICON_MAP[amenity];
                  const Icon = amenityMeta?.icon || CheckCircle;
                  const label = amenityMeta?.label || amenity;
                  return (
                    <div key={amenity} className="flex items-center gap-4">
                      <Icon className="w-6 h-6 text-slate-800" />
                      <span className="text-2xl text-slate-800">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="danh-gia" className="border-b border-slate-200 pb-10 space-y-8">
              <div className="text-center py-4">
                <div className="text-6xl font-black text-slate-900 mb-2">{overallRating.toFixed(1)}</div>
                <div className="inline-flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  Được khách yêu thích
                </div>
                <p className="mt-2 text-slate-500 text-lg">
                  Dựa trên {reviewStats?.review_count || reviews.length || 0} lượt đánh giá xác thực.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {criteriaValues.map((criterion) => {
                  const Icon = criterion.icon;
                  return (
                    <div key={criterion.key} className="p-5 rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-slate-900">{criterion.label}</span>
                        <span className="text-xl font-bold text-slate-900">{criterion.value.toFixed(1)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-4">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, (criterion.value / 5) * 100))}%` }}
                        />
                      </div>
                      <Icon className="w-6 h-6 text-slate-700" />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {reviews.length === 0 ? (
                  <p className="text-slate-500 text-lg col-span-full">Chưa có đánh giá nào cho chỗ ở này.</p>
                ) : (
                  reviews.map((review) => (
                    <article key={review.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 grid place-items-center text-slate-600 font-bold">
                          {review.avatar_url ? (
                            <img src={review.avatar_url} alt={review.user_name} className="w-full h-full object-cover" />
                          ) : (
                            review.user_name.slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-slate-900">{review.user_name}</p>
                          <p className="text-slate-500">{formatReviewDate(review.created_at)}</p>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-lg line-clamp-4">{review.comment || 'Không có nội dung bình luận.'}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section id="vi-tri" className="border-b border-slate-200 pb-10">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Vị trí</h3>
              <p className="text-slate-700 text-lg">{room.address}, {room.location}</p>
            </section>
          </div>

          <aside className="relative">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <p className="font-semibold text-slate-800">Hiếm khi còn phòng! Chỗ ở này thường kín phòng</p>
              </div>

              <div className="p-6 border border-slate-200 rounded-3xl shadow-xl bg-white">
                <div className="mb-5">
                  <p className="text-3xl font-bold text-slate-900 inline">{formatPrice(room.price_per_night)}</p>
                  <span className="text-slate-500 text-lg"> / đêm</span>
                </div>

                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-slate-600 mb-4">Đăng nhập để đặt phòng nhanh hơn.</p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                    >
                      Đăng nhập / Đăng ký
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div ref={bookingPanelRef} className="relative">
                      <div className="rounded-2xl border border-slate-300 overflow-visible bg-white">
                        <div
                          className="grid grid-cols-2 border-b cursor-pointer"
                          onClick={() => {
                            setShowDatePicker((prev) => !prev);
                            setShowGuestPicker(false);
                          }}
                        >
                          <div className="p-3 border-r">
                            <p className="text-xs font-bold uppercase text-slate-700">Nhận phòng</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">
                              {hasSelectedDates && selection.startDate ? format(selection.startDate, 'd/M/yyyy') : 'Thêm ngày'}
                            </p>
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-bold uppercase text-slate-700">Trả phòng</p>
                            <p className="text-lg font-semibold text-slate-900 mt-1">
                              {hasSelectedDates && selection.endDate ? format(selection.endDate, 'd/M/yyyy') : 'Thêm ngày'}
                            </p>
                          </div>
                        </div>

                        <div
                          className="relative p-3 cursor-pointer"
                          onClick={() => {
                            setShowGuestPicker((v) => !v);
                            setShowDatePicker(false);
                          }}
                        >
                          <p className="text-xs font-bold uppercase text-slate-700">Khách</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-lg font-semibold text-slate-900">{totalGuests} khách</p>
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          </div>

                          {showGuestPicker && (
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                              {[
                                { key: 'adults', label: 'Người lớn', desc: 'Từ 13 tuổi trở lên' },
                                { key: 'children', label: 'Trẻ em', desc: 'Độ tuổi 2-12' },
                                { key: 'infants', label: 'Em bé', desc: 'Dưới 2 tuổi' },
                              ].map((item) => {
                                const current = (guests as any)[item.key] as number;
                                const isAdult = item.key === 'adults';
                                return (
                                  <div key={item.key} className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-slate-900">{item.label}</p>
                                      <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        className="w-8 h-8 rounded-full border border-slate-300"
                                        onClick={() => {
                                          setGuests((prev) => {
                                            const existing = (prev as any)[item.key] as number;
                                            return {
                                              ...prev,
                                              [item.key]: Math.max(isAdult ? 1 : 0, existing - 1),
                                            };
                                          });
                                        }}
                                        disabled={isAdult ? current <= 1 : current <= 0}
                                      >
                                        -
                                      </button>
                                      <span className="w-6 text-center font-semibold">{current}</span>
                                      <button
                                        type="button"
                                        className="w-8 h-8 rounded-full border border-slate-300"
                                        onClick={() => {
                                          setGuests((prev) => {
                                            const existing = (prev as any)[item.key] as number;
                                            const next = { ...prev, [item.key]: existing + 1 };
                                            const people = next.adults + next.children + next.infants;
                                            if (people > room.max_guests) return prev;
                                            return next;
                                          });
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {showDatePicker && (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.99 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="compact-date-popover absolute right-0 top-full mt-3 z-30 w-[min(92vw,46rem)] max-h-[78vh] overflow-auto bg-white border border-slate-200 rounded-3xl shadow-[0_22px_70px_rgba(15,23,42,0.22)]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-6 pt-6 pb-4">
                              <h3 className="text-3xl font-bold text-slate-900">Chọn ngày</h3>
                              <p className="text-slate-500 mt-1">Thêm ngày đi để biết giá chính xác</p>
                            </div>

                            <div className="px-5 pb-3">
                              <DateRange
                                className="compact-date-picker"
                                ranges={dateRange}
                                onChange={(item: RangeKeyDict) => {
                                  const selected = item.selection as typeof dateRange[number];
                                  setDateRange([selected]);
                                  setHasSelectedDates(true);
                                }}
                                showDateDisplay={false}
                                months={2}
                                direction="horizontal"
                                rangeColors={['#10b981']}
                                locale={vi}
                                minDate={new Date()}
                              />
                            </div>

                            <div className="flex items-center justify-end gap-4 px-6 pb-6 pt-1">
                              <button
                                type="button"
                                className="text-sm font-semibold text-slate-700 underline"
                                onClick={() => setHasSelectedDates(false)}
                              >
                                Xóa ngày
                              </button>
                              <button
                                type="button"
                                className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black"
                                onClick={() => setShowDatePicker(false)}
                              >
                                Đóng
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                          placeholder="Họ và tên"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                          placeholder="Email"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>{formatPrice(room.price_per_night)} x {nights} đêm</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-slate-900 border-t pt-2">
                        <span>Tổng cộng</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={checkAvailability}
                      disabled={checkingAvailability}
                      className="w-full py-3 rounded-xl border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 disabled:opacity-70"
                    >
                      {checkingAvailability ? 'Đang kiểm tra...' : 'Kiểm tra tình trạng còn phòng'}
                    </button>

                    <button
                      type="submit"
                      disabled={isBooking || checkingAvailability || !availabilityChecked || isAvailable !== true}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition disabled:opacity-60"
                    >
                      {isBooking ? 'Đang đặt phòng...' : checkingAvailability ? 'Đang kiểm tra...' : 'Đặt phòng'}
                    </button>

                    {isAvailable === true && <p className="text-sm text-emerald-600 text-center">Phòng còn trống cho lịch bạn chọn.</p>}
                    {isAvailable === false && <p className="text-sm text-emerald-600 text-center">Phòng đã kín trong khoảng thời gian này.</p>}
                  </form>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90">
          <div className="absolute top-4 right-4 flex items-center gap-4 text-white">
            <span className="text-sm font-semibold">{normalizedLightboxIndex + 1}/{allImages.length}</span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setLightboxIndex((prev) => prev - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => setLightboxIndex((prev) => prev + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="h-full w-full flex items-center justify-center px-16">
            <img
              src={allImages[normalizedLightboxIndex]}
              alt={`${room.title}-${normalizedLightboxIndex + 1}`}
              className="max-h-[88vh] max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
