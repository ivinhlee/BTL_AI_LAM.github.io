import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Calendar, Users, CheckCircle, User, Mail, BedDouble, Bath, Home, Lock, Heart } from 'lucide-react';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import toast from 'react-hot-toast';

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
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  
  const { user, token } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || '');
  
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // Cập nhật thông tin khi user thay đổi
  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
    }
  }, [user]);

  // Tính số đêm
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const totalPrice = room ? room.price_per_night * nights : 0;

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
    if (!room || !checkInDate || !checkOutDate) {
      alert('Vui lòng chọn ngày nhận và trả phòng');
      return;
    }

    if (nights <= 0) {
      alert('Ngày trả phòng phải sau ngày nhận phòng');
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
        num_guests: guests,
        total_price: totalPrice
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
      
      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        navigate('/');
      }, 2000);

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
    <div className="bg-slate-50 min-h-screen py-8 md:py-12 relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-4 md:right-8 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white border-l-4 border-emerald-500 shadow-xl rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Đặt phòng thành công!</h4>
              <p className="text-xs text-slate-500">Đang chuyển hướng về trang chủ...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Cột Trái: Thông tin chi tiết (70% trên Desktop) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ảnh Bìa */}
            <div className="rounded-3xl overflow-hidden aspect-video relative shadow-sm">
              <img 
                src={room.image_url} 
                alt={room.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-bold text-slate-800 shadow-sm">
                <MapPin className="w-4 h-4 text-emerald-500" />
                {room.location}
              </div>
            </div>

            {/* Tiêu đề & Thông số cơ bản */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                  {room.title}
                </h1>
                <button
                  onClick={toggleWishlist}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                </button>
              </div>
              <p className="text-slate-500 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {room.address}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tối đa</p>
                    <p className="font-bold text-slate-900">{room.max_guests} khách</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <BedDouble className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Giường</p>
                    <p className="font-bold text-slate-900">{room.bed_count} giường</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Bath className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Phòng tắm</p>
                    <p className="font-bold text-slate-900">{room.bath_count} phòng</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Home className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Loại</p>
                    <p className="font-bold text-slate-900">{room.category}</p>
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Giới thiệu về chỗ ở này</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                  {room.description}
                </p>
              </div>
            </div>
          </div>

          {/* Cột Phải: Form Đặt Phòng (Sticky - 30% trên Desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 sticky top-28">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="text-3xl font-bold text-emerald-600 mt-1">
                  {formatPrice(room.price_per_night)}
                  <span className="text-base font-normal text-slate-500"> / đêm</span>
                </div>
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Đăng nhập để đặt phòng</h3>
                  <p className="text-slate-500 mb-6">Bạn cần đăng nhập để có thể xem giá và đặt phòng này.</p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Đăng nhập / Đăng ký
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-5">
                  {/* Ngày nhận & trả phòng */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nhận phòng *</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full pl-10 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Trả phòng *</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          required
                          min={checkInDate ? new Date(new Date(checkInDate).getTime() + 86400000).toISOString().split('T')[0] : undefined}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full pl-10 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Số khách */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số khách *</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1"
                        max={room.max_guests}
                        required
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      <Users className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Tối đa {room.max_guests} khách</p>
                  </div>

                  {/* Thông tin liên hệ */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Thông tin liên hệ</p>
                    <div className="relative">
                      <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Họ và tên" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                    <div className="relative">
                      <input type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  {/* Tổng tiền */}
                  {nights > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>{formatPrice(room.price_per_night)} x {nights} đêm</span>
                        <span>{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 font-bold text-slate-900 text-lg">
                        <span>Tổng cộng:</span>
                        <span className="text-emerald-600">{formatPrice(totalPrice)}</span>
                      </div>
                    </div>
                  )}

                  {/* Nút Đặt Ngay */}
                  <button 
                    type="submit" 
                    disabled={isBooking || nights <= 0}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg
                      ${isBooking || nights <= 0 ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'}
                    `}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Đặt Phòng'
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Bạn sẽ không bị trừ tiền ngay lúc này
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
