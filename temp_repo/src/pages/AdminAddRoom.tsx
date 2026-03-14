import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Map, DollarSign, Users, BedDouble, Bath, Image as ImageIcon, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminAddRoom() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Legacy route: redirect to new dashboard
  React.useEffect(() => {
    navigate('/admin', { replace: true });
  }, [navigate]);

  const [loading, setLoading] = useState(false);

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

  const normalizeImageInput = (value: string) => {
    return value
      .split(/\s|,/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 20);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Vui lòng đăng nhập với quyền Admin!');
      return;
    }

    // Basic client validation
    const cleanedImageUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
    if (cleanedImageUrls.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 ảnh');
      return;
    }

    setLoading(true);

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
          image_url: cleanedImageUrls.join(',')
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Lỗi khi thêm phòng');
      }

      toast.success('Thêm phòng thành công!');
      navigate('/rooms');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Thêm phòng mới</h1>
          <p className="text-slate-500 mt-2">Điền thông tin chi tiết để đăng phòng lên hệ thống seabnb.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin cơ bản */}
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

          {/* Chi tiết phòng */}
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

          {/* Hình ảnh */}
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
                          // If user pastes a list (newline/comma), split it and replace list
                          if (/[\n,\s]{2,}/.test(raw)) {
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
                              (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh';
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

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
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
      </div>
    </div>
  );
}
