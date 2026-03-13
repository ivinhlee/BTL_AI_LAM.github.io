import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Map, DollarSign, Users, BedDouble, Bath, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminAddRoom() {
  const navigate = useNavigate();
  const { token } = useAuth();
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
    description: '',
    image_url: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Vui lòng đăng nhập với quyền Admin!');
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
          bath_count: Number(formData.bath_count)
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
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">URL Ảnh *</label>
              <div className="relative mb-6">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="url"
                  name="image_url"
                  required
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              {/* Image Preview */}
              {formData.image_url && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-700 mb-2">Xem trước ảnh:</p>
                  <div className="relative aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=L%E1%BB%97i+t%E1%BA%A3i+%E1%BA%A3nh';
                      }}
                      referrerPolicy="no-referrer"
                    />
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
