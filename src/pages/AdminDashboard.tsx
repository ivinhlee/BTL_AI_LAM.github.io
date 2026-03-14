import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Map, DollarSign, Users, BedDouble, Bath, Image as ImageIcon, FileText, Loader2, Plus, Trash2, ShieldCheck, XCircle, RefreshCw, ListChecks, Search, CheckSquare, Globe, Star, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';

const AMENITIES_LIST = [
  'Wifi', 'Bể bơi', 'Bếp', 'Điều hòa', 'Máy giặt', 'TV', 'Chỗ đỗ xe', 'Lò sưởi', 'Bồn tắm nước nóng', 'Sân trong hoặc ban công', 'Sân sau', 'Lò nướng BBQ', 'Bàn làm việc', 'Máy sấy tóc', 'Bàn ủi'
];

const BOOKING_OPTIONS_LIST = [
  'Tự nhận phòng', 'Hủy miễn phí', 'Cho phép mang theo thú cưng'
];

const HOST_LANGUAGES_LIST = [
  'Tiếng Anh', 'Tiếng Việt', 'Tiếng Pháp', 'Tiếng Tây Ban Nha', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn'
];

interface BookingRow {
  booking_id: number;
  customer_name: string;
  customer_email: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  num_adults?: number;
  num_children?: number;
  num_infants?: number;
  total_price: number;
  status?: string;
  room_name: string;
  room_id: number;
  room_location?: string;
}

const formatDate = (date: string) => new Intl.DateTimeFormat('vi-VN').format(new Date(date));
const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'add' | 'bookings'>('bookings');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    location: '',
    category: 'Căn hộ',
    price_per_night: '',
    max_guests: '',
    bed_count: '',
    bath_count: '',
    description: ''
  });
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedBookingOptions, setSelectedBookingOptions] = useState<string[]>([]);
  const [selectedHostLanguages, setSelectedHostLanguages] = useState<string[]>([]);

  const normalizeImageInput = (value: string) => {
    return value
      .split(/\s|,/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 20);
  };

  useEffect(() => {
    if (!token || !user?.is_admin) return;
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await fetch('/api/rooms');
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        toast.error('Không tải được danh sách phòng');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [token, user?.is_admin]);

  const fetchAllBookings = async () => {
    if (!token) return;
    try {
      setLoadingBookings(true);
      const res = await fetch(`/api/admin/all-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = isJson ? (payload.error || 'Tải booking thất bại') : 'Máy chủ không phản hồi JSON (API có đang chạy?)';
        throw new Error(msg);
      }
      if (!isJson) {
        throw new Error('Máy chủ trả về HTML, kiểm tra server backend');
      }
      setBookings(payload);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải booking');
    } finally {
      setLoadingBookings(false);
    }
  };

  const approveBooking = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi duyệt đặt phòng');
      toast.success('Duyệt đặt phòng thành công');
      // Update local state to remove the approved booking from view (status changes to 'confirmed')
      setBookings(bookings.map(b => b.booking_id === id ? { ...b, status: 'confirmed' } : b));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    }
  };

  useEffect(() => {
    if (token) fetchAllBookings();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Vui lòng đăng nhập với quyền Admin!');
      return;
    }

    const cleanedImageUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
    if (cleanedImageUrls.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 ảnh');
      return;
    }

    setFormLoading(true);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price_per_night: Number(formData.price_per_night),
          max_guests: Number(formData.max_guests),
          bed_count: Number(formData.bed_count),
          bath_count: Number(formData.bath_count),
          image_url: cleanedImageUrls.join(','),
          amenities: selectedAmenities,
          booking_options: selectedBookingOptions,
          host_languages: selectedHostLanguages
        })
      });

      const errData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(errData.error || 'Lỗi khi thêm phòng');
      }

      toast.success('Thêm phòng thành công!');
      setFormData({ title: '', address: '', location: '', category: 'Căn hộ', price_per_night: '', max_guests: '', bed_count: '', bath_count: '', description: '' });
      setImageUrls(['']);
      setSelectedAmenities([]);
      setSelectedBookingOptions([]);
      setSelectedHostLanguages([]);
      // refresh rooms list to include new room
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setFormLoading(false);
    }
  };

  const clearAllBookings = async () => {
    if (!token) return;
    try {
      setClearing(true);
      const res = await fetch(`/api/admin/bookings`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa booking thất bại');
      toast.success(`Đã xóa ${data.deleted || 0} booking trên toàn hệ thống`);
      setBookings([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa booking');
    } finally {
      setClearing(false);
    }
  };

  const guestLabel = (b: BookingRow) => {
    const a = b.num_adults ?? b.num_guests;
    const c = b.num_children ?? 0;
    const i = b.num_infants ?? 0;
    const parts = [
      a ? `${a} NL` : null,
      c ? `${c} TE` : null,
      i ? `${i} EB` : null,
    ].filter(Boolean);
    const total = b.num_guests ?? a + c + i;
    return `${total} khách${parts.length ? ' (' + parts.join(', ') + ')' : ''}`;
  };

  const isAdmin = !!user?.is_admin;

  // ⚡ Bolt Optimization: Memoize filtered bookings to prevent expensive re-calculations on every render
  // Impact: Reduces CPU work when typing in the search bar or when the component re-renders for other reasons
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Only show pending bookings as requested
      if ((b.status || 'pending') !== 'pending') return false;

      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        (b.customer_name || '').toLowerCase().includes(term) ||
        (b.customer_email || '').toLowerCase().includes(term) ||
        (b.room_name || '').toLowerCase().includes(term)
      );
    });
  }, [bookings, searchTerm]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-slate-600">Bạn cần đăng nhập bằng tài khoản admin.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-emerald-500 text-white rounded-lg">Đi tới đăng nhập</button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-lg font-semibold text-slate-900">Chỉ dành cho Admin</p>
          <p className="text-slate-500">Tài khoản của bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide">Bảng điều khiển</p>
            <h1 className="text-3xl font-bold text-slate-900">Admin / Spotbnb</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/add-room')}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            <Plus className="w-4 h-4" /> Đi tới thêm phòng
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
              activeTab === 'bookings' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <ListChecks className="w-4 h-4" /> Tất cả đặt phòng
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/reviews')}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            <Star className="w-4 h-4" /> Thêm đánh giá
          </button>
        </div>

        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin cơ bản</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên phòng *</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="VD: Villa View Biển Mỹ Khê"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Địa chỉ cụ thể *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="VD: 123 Đường Võ Nguyên Giáp"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Thành phố *</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="VD: Đà Nẵng"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Loại phòng *</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none"
                      >
                        <option value="Căn hộ">Căn hộ</option>
                        <option value="Villa">Villa</option>
                        <option value="Nhà riêng">Nhà riêng</option>
                        <option value="Khách sạn">Khách sạn</option>
                        <option value="Resort">Resort</option>
                        <option value="Homestay">Homestay</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Giá / đêm (VNĐ) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="number"
                        name="price_per_night"
                        required
                        min="0"
                        value={formData.price_per_night}
                        onChange={handleChange}
                        placeholder="VD: 1500000"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Chi tiết chỗ ở</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số khách tối đa *</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="max_guests"
                      required
                      min="1"
                      value={formData.max_guests}
                      onChange={handleChange}
                      placeholder="VD: 4"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số giường *</label>
                  <div className="relative">
                    <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="bed_count"
                      required
                      min="1"
                      value={formData.bed_count}
                      onChange={handleChange}
                      placeholder="VD: 2"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số phòng tắm *</label>
                  <div className="relative">
                    <Bath className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="bath_count"
                      required
                      min="1"
                      value={formData.bath_count}
                      onChange={handleChange}
                      placeholder="VD: 1"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả chi tiết</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả về không gian, tiện ích, khu vực xung quanh..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Tiện ích & Tùy chọn</h2>

              {/* Tiện nghi */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-slate-700" />
                  <h3 className="text-md font-bold text-slate-800">Tiện nghi nổi bật</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AMENITIES_LIST.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleSelection(amenity, selectedAmenities, setSelectedAmenities)}
                      />
                      <span className="text-sm text-slate-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tùy chọn đặt phòng */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-slate-700" />
                  <h3 className="text-md font-bold text-slate-800">Tùy chọn đặt phòng</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {BOOKING_OPTIONS_LIST.map((option) => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        checked={selectedBookingOptions.includes(option)}
                        onChange={() => toggleSelection(option, selectedBookingOptions, setSelectedBookingOptions)}
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ngôn ngữ chủ nhà */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-slate-700" />
                  <h3 className="text-md font-bold text-slate-800">Ngôn ngữ chủ nhà</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {HOST_LANGUAGES_LIST.map((lang) => (
                    <label key={lang} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        checked={selectedHostLanguages.includes(lang)}
                        onChange={() => toggleSelection(lang, selectedHostLanguages, setSelectedHostLanguages)}
                      />
                      <span className="text-sm text-slate-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Hình ảnh</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-sm font-bold text-slate-700">Danh sách URL ảnh (tối đa 20)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrls.length >= 20) return;
                      setImageUrls((prev) => [...prev, '']);
                    }}
                    disabled={imageUrls.length >= 20}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm ảnh
                  </button>
                </div>

                <div className="space-y-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (/[\n,\s]{2,}|,/g.test(raw)) {
                              const parsed = normalizeImageInput(raw);
                              setImageUrls(parsed.length ? parsed : ['']);
                            } else {
                              const next = [...imageUrls];
                              next[index] = raw;
                              setImageUrls(next);
                            }
                          }}
                          placeholder={`https://example.com/image-${index + 1}.jpg`}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (imageUrls.length === 1) {
                            setImageUrls(['']);
                            return;
                          }
                          setImageUrls((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {imageUrls.some((url) => url.trim() !== '') && (
                  <div className="pt-2">
                    <p className="text-sm font-bold text-slate-700 mb-3">Xem trước ảnh:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {imageUrls
                        .filter((url) => url.trim() !== '')
                        .map((url, idx) => (
                          <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Khong+tai+duoc+anh';
                              }}
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute top-2 right-2 bg-white/80 text-xs font-semibold text-slate-700 px-2 py-1 rounded-lg shadow-sm">#{idx + 1}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={formLoading}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng phòng lên hệ thống'
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <ListChecks className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-lg font-bold text-slate-900">Tất cả đặt phòng</p>
                    <p className="text-sm text-slate-500">Tìm theo khách hoặc tên phòng</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm khách hoặc phòng..."
                      className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm w-64"
                    />
                  </div>
                  <button
                    onClick={fetchAllBookings}
                    disabled={loadingBookings}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Tải lại
                  </button>
                  <button
                    onClick={clearAllBookings}
                    disabled={clearing}
                    className="px-3 py-2 text-sm rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa tất cả booking
                  </button>
                </div>
              </div>

              {loadingBookings ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải booking...
                </div>
              ) : filteredBookings.length === 0 ? (
                <p className="text-slate-500 text-sm">Không tìm thấy đơn đặt phòng nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="text-left px-3 py-2">Khách</th>
                        <th className="text-left px-3 py-2">Phòng</th>
                        <th className="text-left px-3 py-2">Nhận</th>
                        <th className="text-left px-3 py-2">Trả</th>
                        <th className="text-left px-3 py-2">Khách</th>
                        <th className="text-left px-3 py-2">Tổng</th>
                        <th className="text-left px-3 py-2">Trạng thái</th>
                        <th className="text-center px-3 py-2">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map((b) => (
                        <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-medium text-slate-900">
                            <div>{b.customer_name}</div>
                            <div className="text-xs text-slate-500">{b.customer_email}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            <div className="font-semibold" title={b.room_name}>{b.room_name}</div>
                            {b.room_location && <div className="text-xs text-slate-500">{b.room_location}</div>}
                          </td>
                          <td className="px-3 py-2">{formatDate(b.check_in_date)}</td>
                          <td className="px-3 py-2">{formatDate(b.check_out_date)}</td>
                          <td className="px-3 py-2">{guestLabel(b)}</td>
                          <td className="px-3 py-2 text-emerald-600 font-semibold">{formatPrice(b.total_price)}</td>
                          <td className="px-3 py-2">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              Chờ duyệt
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => approveBooking(b.booking_id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Duyệt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
