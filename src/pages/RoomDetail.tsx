import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Calendar, Users, CheckCircle, User, Mail, BedDouble, Bath, Home, Lock, Heart, ChevronDown, X } from 'lucide-react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import toast from 'react-hot-toast';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // States cho Room
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States cho Form Đặt Phòng
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      key: 'selection'
    }
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });
  
  const { user, token } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || '');
  
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // Cập nhật thông tin khi user thay đổi
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Tính số đêm
  const selection = dateRange[0];

  const checkInDate = selection.startDate ? format(selection.startDate, 'yyyy-MM-dd') : '';
  const checkOutDate = selection.endDate ? format(selection.endDate, 'yyyy-MM-dd') : '';
  const totalGuests = guests.adults + guests.children + guests.infants;

  const calculateNights = () => {
    if (!selection.startDate || !selection.endDate) return 0;
    const diffTime = Math.abs(selection.endDate.getTime() - selection.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const totalPrice = room ? room.price_per_night * nights : 0;

  const images = room?.image_url
    ? room.image_url
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
    : [];

  const galleryImages = (() => {
    const baseList = images.length ? images : [room?.image_url].filter(Boolean) as string[];
    const fallback = baseList[0] || 'https://placehold.co/1200x800?text=seabnb';
    const padded = [...baseList];
    while (padded.length < 5) padded.push(fallback);
    return padded.slice(0, 5);
  })();

  // Lấy dữ liệu Room
  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/rooms/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) throw new Error('Không tìm thấy phòng này.');
          throw new Error('Không thể kết nối đến máy chủ.');
        }
        
        const data = await response.json();
        setRoom(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRoomDetail();
  }, [id]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!token || !id) return;
      try {
        const response = await fetch('/api/wishlist', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const isListed = data.some((r: Room) => r.id === Number(id));
          setIsWishlisted(isListed);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra danh sách yêu thích:', error);
      }
    };

    checkWishlistStatus();
  }, [token, id]);

  // Reset availability when date or guest counts change
  useEffect(() => {
    setIsAvailable(null);
  }, [checkInDate, checkOutDate, guests.adults, guests.children, guests.infants]);

  const checkAvailability = async () => {
    if (!room) return false;
    if (!selection.startDate || !selection.endDate || nights <= 0) {
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
        total_guests: totalGuests.toString(),
      });
      const response = await fetch(`/api/rooms/${room.id}/check-availability?${params.toString()}`);
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message = isJson ? (payload.error || 'Không kiểm tra được tình trạng phòng') : 'Máy chủ không phản hồi JSON (có đang chạy API?)';
        throw new Error(message);
      }

      const available = isJson ? payload.available : false;
      setIsAvailable(available);
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
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ room_id: Number(id) })
        });
        if (response.ok) {
          setIsWishlisted(true);
          toast.success('Đã lưu vào danh sách yêu thích');
        }
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    }
  };

  // Xử lý Đặt Phòng
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    const available = await checkAvailability();
    if (!available) return;

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đặt phòng thất bại. Vui lòng thử lại.');
      }

      // Hiển thị Toast thành công
      setShowToast(true);
      toast.success('Đặt phòng thành công, chuyển tới thanh toán');

      // Chuyển tới trang thanh toán giả lập
      navigate(`/checkout?bookingId=${data.bookingId}`);

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsBooking(false);
    }
  };

  // 1. Trạng thái Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin phòng...</p>
      </div>
    );
  }

  // 2. Trạng thái Error
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

  // 3. Trạng thái Success
  return (
    <div className="bg-slate-50 min-h-screen pt-40 md:pt-48 pb-12 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-4 md:right-8 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white border-l-4 border-emerald-500 shadow-xl rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Đặt phòng thành công!</h4>
              <p className="text-xs text-slate-500">Đang chuyển tới Hành trình của bạn...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bộ sưu tập ảnh tổ ong */}
        <div className="relative">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[500px] bg-slate-200">
            <div className="col-span-2 row-span-2 relative">
              <img src={galleryImages[0]} className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-bold text-slate-800 shadow-sm">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {room.location}
              </div>
            </div>
            {[1,2,3,4].map((idx) => (
              <div key={idx} className="relative">
                <img src={galleryImages[idx]} className="w-full h-full object-cover cursor-pointer hover:brightness-90" />
              </div>
            ))}
          </div>
          <button
            onClick={toggleWishlist}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/90 backdrop-blur shadow-md hover:shadow-lg transition"
            aria-label="Thêm vào yêu thích"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Nội dung & Form đặt phòng sticky */}
        <div className="flex flex-col md:flex-row gap-12 mt-8">
          <div className="flex-[2] space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{room.title}</h1>
              <p className="text-slate-500 flex items-center gap-2"><MapPin className="w-5 h-5" />{room.address}</p>
              <div className="flex flex-wrap items-center gap-6 text-slate-700 pt-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-900">{room.max_guests}</span>
                  <span className="text-sm">khách</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-900">{room.bed_count}</span>
                  <span className="text-sm">giường</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-900">{room.bath_count}</span>
                  <span className="text-sm">phòng tắm</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-slate-900">{room.category}</span>
                  <span className="text-sm">loại phòng</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900">Giới thiệu</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">{room.description}</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="sticky top-28 p-6 border rounded-2xl shadow-2xl bg-white">
              <div className="flex justify-between items-end mb-4">
                <span className="text-2xl font-bold text-slate-900">{formatPrice(room.price_per_night)}</span>
                <span className="text-gray-500">/ đêm</span>
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Đăng nhập để đặt phòng</h3>
                  <p className="text-slate-500 mb-6">Bạn cần đăng nhập để đặt phòng này.</p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Đăng nhập / Đăng ký
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-5">
                  <div className="relative border rounded-2xl">
                    <div
                      className="grid grid-cols-2 border-b cursor-pointer"
                      onClick={() => {
                        setShowDatePicker(true);
                        setShowGuestPicker(false);
                      }}
                    >
                      <div className="p-4 border-r">
                        <p className="text-xs font-bold text-slate-700 uppercase">Nhận phòng</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                          {selection.startDate ? format(selection.startDate, 'd/M/yyyy') : 'Thêm ngày'}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-bold text-slate-700 uppercase">Trả phòng</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">
                          {selection.endDate ? format(selection.endDate, 'd/M/yyyy') : 'Thêm ngày'}
                        </p>
                      </div>
                    </div>

                    <div className="relative p-4 flex items-center justify-between cursor-pointer" onClick={() => setShowGuestPicker((v) => !v)}>
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase">Khách</p>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{totalGuests + guests.pets} khách</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-600" />

                      {showGuestPicker && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                          {[
                            { key: 'adults', label: 'Người lớn', desc: 'Từ 13 tuổi trở lên' },
                            { key: 'children', label: 'Trẻ em', desc: 'Độ tuổi 2 – 12' },
                            { key: 'infants', label: 'Em bé', desc: 'Dưới 2 tuổi' },
                            { key: 'pets', label: 'Thú cưng', desc: 'Thú cưng đi cùng' },
                          ].map((item) => {
                            const current = (guests as any)[item.key] as number;
                            const isAdult = item.key === 'adults';
                            const handleChange = (delta: number) => {
                              setGuests((prev) => {
                                const nextVal = Math.max(isAdult ? 1 : 0, current + delta);
                                const tentative = { ...prev, [item.key]: nextVal } as typeof prev;
                                const peopleTotal = tentative.adults + tentative.children + tentative.infants;
                                if (peopleTotal > room.max_guests) return prev; // do not exceed capacity
                                return tentative;
                              });
                            };
                            return (
                              <div key={item.key} className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{item.label}</p>
                                  <p className="text-sm text-slate-500">{item.desc}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-lg disabled:opacity-40"
                                    onClick={() => handleChange(-1)}
                                    disabled={isAdult ? current <= 1 : current <= 0}
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-semibold text-slate-900">{current}</span>
                                  <button
                                    type="button"
                                    className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-lg disabled:opacity-40"
                                    onClick={() => handleChange(1)}
                                    disabled={item.key !== 'pets' && totalGuests >= room.max_guests}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-xs text-slate-500">Chỗ ở này cho phép tối đa {room.max_guests} khách (không tính thú cưng).</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-900">Thông tin liên hệ</p>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Họ và tên"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="pt-2 space-y-2 text-sm text-slate-700">
                      <div className="flex justify-between">
                        <span>{formatPrice(room.price_per_night)} x {nights} đêm</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-bold text-slate-900 text-lg">
                        <span>Tổng cộng</span>
                        <span className="text-emerald-600">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`w-full mt-2 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold rounded-2xl active:scale-95 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                      (isBooking || checkingAvailability) ? 'opacity-70 cursor-wait' : ''
                    }`}
                    disabled={isBooking || checkingAvailability}
                    onClick={() => {
                      if (!selection.startDate || !selection.endDate) {
                        setShowDatePicker(true);
                      }
                      setShowGuestPicker(false);
                    }}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang đặt phòng...
                      </>
                    ) : checkingAvailability ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : isAvailable ? (
                      'Đặt phòng'
                    ) : (
                      'Kiểm tra tình trạng còn phòng'
                    )}
                  </button>
                  <div className="text-center text-sm text-gray-500 mt-2 space-y-1">
                    <p>Bạn chưa bị trừ tiền ngay</p>
                    {isAvailable === true && <p className="text-emerald-600 font-semibold">Phòng còn trống, bạn có thể đặt ngay</p>}
                    {isAvailable === false && <p className="text-rose-500 font-semibold">Ngày đã được đặt, hãy chọn ngày khác</p>}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date picker overlay */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-2" onClick={() => setShowDatePicker(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Chọn ngày</h3>
                <p className="text-sm text-slate-500">Thời gian ở tối thiểu: 1 đêm</p>
              </div>
              <button onClick={() => setShowDatePicker(false)} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-700 uppercase">Nhận phòng</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{format(selection.startDate, 'dd/MM/yyyy')}</p>
                </div>
                <div className="border rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-700 uppercase">Trả phòng</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{format(selection.endDate, 'dd/MM/yyyy')}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <DateRange
                  ranges={dateRange}
                  onChange={(item: RangeKeyDict) => {
                    const sel = item.selection as any;
                    setDateRange([sel]);
                  }}
                  months={2}
                  direction="horizontal"
                  rangeColors={[ '#e11d48' ]}
                  locale={vi}
                  minDate={new Date()}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button className="text-sm font-semibold text-slate-700 underline" onClick={() => {
                  const today = new Date();
                  setDateRange([{ startDate: today, endDate: new Date(today.getTime() + 86400000), key: 'selection' }]);
                }}>
                  Xóa ngày
                </button>
                <button
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
                  onClick={() => setShowDatePicker(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
