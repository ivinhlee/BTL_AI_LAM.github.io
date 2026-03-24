import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  MapPin,
  Map,
  DollarSign,
  Users,
  BedDouble,
  Bath,
  Image as ImageIcon,
  FileText,
  Loader2,
  Plus,
  Trash2,
  ShieldCheck,
  XCircle,
  Wifi,
  ChefHat,
  Tv,
  Waves,
  WashingMachine,
  Car,
  Wind,
  Flame,
  Bath as BathIcon,
  Sun,
  TreePine,
  UtensilsCrossed,
  Scissors,
  Shirt,
  Monitor,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const AMENITIES_LIST = [
  { key: "wifi", label: "Wifi", icon: Wifi },
  { key: "kitchen", label: "Bếp", icon: ChefHat },
  { key: "tv", label: "TV", icon: Tv },
  { key: "pool", label: "Bể bơi", icon: Waves },
  { key: "washer", label: "Máy giặt", icon: WashingMachine },
  { key: "parking", label: "Chỗ đỗ xe", icon: Car },
  { key: "air_conditioning", label: "Điều hòa", icon: Wind },
  { key: "fireplace", label: "Lò sưởi", icon: Flame },
  { key: "hot_tub", label: "Bồn tắm nước nóng", icon: BathIcon },
  { key: "balcony", label: "Sân trong hoặc ban công", icon: Sun },
  { key: "backyard", label: "Sân sau", icon: TreePine },
  { key: "bbq", label: "Lò nướng BBQ", icon: UtensilsCrossed },
  { key: "workspace", label: "Bàn làm việc", icon: Monitor },
  { key: "hair_dryer", label: "Máy sấy tóc", icon: Scissors },
  { key: "iron", label: "Bàn ủi", icon: Shirt },
];

const BOOKING_OPTIONS_LIST = [
  "Tự nhận phòng",
  "Hủy miễn phí",
  "Cho phép mang theo thú cưng",
];

export default function AdminAddRoom() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    location: "",
    category: "Căn hộ",
    room_type: "Toàn bộ nhà",
    price_per_night: "",
    max_guests: "",
    bed_count: "",
    bath_count: "",
    description: "",
  });

  const [imageUrls, setImageUrls] = useState([""]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedBookingOptions, setSelectedBookingOptions] = useState([]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name],
    );
  };

  const toggleBookingOption = (option) => {
    setSelectedBookingOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  };

  const updateImageUrl = (index, value) => {
    setImageUrls((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addImageField = () => {
    setImageUrls((prev) => [...prev, ""]);
  };

  const removeImageField = (index) => {
    setImageUrls((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const resetForm = () => {
    setFormData({
      title: "",
      address: "",
      location: "",
      category: "Căn hộ",
      room_type: "Toàn bộ nhà",
      price_per_night: "",
      max_guests: "",
      bed_count: "",
      bath_count: "",
      description: "",
    });
    setImageUrls([""]);
    setSelectedAmenities([]);
    setSelectedBookingOptions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !user?.is_admin) {
      toast.error("Bạn cần tài khoản admin để thêm phòng");
      return;
    }

    const cleanedImageUrls = imageUrls.map((url) => url.trim()).filter(Boolean);
    if (cleanedImageUrls.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 URL ảnh");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price_per_night: Number(formData.price_per_night),
          max_guests: Number(formData.max_guests),
          bed_count: Number(formData.bed_count),
          bath_count: Number(formData.bath_count),
          image_url: cleanedImageUrls.join(","),
          amenities: JSON.stringify(selectedAmenities),
          booking_options: JSON.stringify(selectedBookingOptions),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Không thể lưu phòng mới");
      }

      toast.success("Thêm phòng thành công");
      resetForm();
      navigate("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-lg font-semibold text-slate-900">
            Chỉ dành cho Admin
          </p>
          <p className="text-slate-500">
            Bạn không có quyền truy cập trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide">
              Admin
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Thêm Phòng Mới
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{user.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Thông tin cơ bản
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Tên phòng *
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="VD: Villa View Biển Mỹ Khê"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Địa chỉ *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="VD: 10 Võ Nguyên Giáp"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Thành phố *
                  </label>
                  <div className="relative">
                    <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="VD: Đà Nẵng"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Loại hình *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Căn hộ">Căn hộ</option>
                    <option value="Villa">Villa</option>
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Khách sạn">Khách sạn</option>
                    <option value="Resort">Resort</option>
                    <option value="Homestay">Homestay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Kiểu chỗ ở *
                  </label>
                  <select
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Toàn bộ nhà">Toàn bộ nhà</option>
                    <option value="Phòng">Phòng</option>
                    <option value="Bất kỳ">Bất kỳ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Giá/đêm *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      name="price_per_night"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="1500000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Khách tối đa *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      required
                      name="max_guests"
                      value={formData.max_guests}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Mô tả và cấu hình phòng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Số giường *
                </label>
                <div className="relative">
                  <BedDouble className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    name="bed_count"
                    value={formData.bed_count}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Số phòng tắm *
                </label>
                <div className="relative">
                  <Bath className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    required
                    name="bath_count"
                    value={formData.bath_count}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Mô tả chi tiết
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Mô tả trải nghiệm lưu trú, khu vực xung quanh, ưu điểm..."
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Tiện nghi (Amenities)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES_LIST.map((item) => {
                const Icon = item.icon;
                const selected = selectedAmenities.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      selected
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAmenity(item.key)}
                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                    />

                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Tùy chọn đặt phòng
            </h2>
            <div className="space-y-3 max-w-2xl">
              {BOOKING_OPTIONS_LIST.map((option) => {
                const selected = selectedBookingOptions.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                      selected
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {option}
                    </span>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleBookingOption(option)}
                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Ảnh phòng (nhiều URL)
              </h2>
              <button
                type="button"
                onClick={addImageField}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" /> Thêm URL ảnh
              </button>
            </div>

            <div className="space-y-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      placeholder={`https://... (Ảnh ${index + 1})`}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    className="w-10 h-10 rounded-lg border border-slate-200 grid place-items-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200"
                    aria-label={`Xóa ảnh ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Bạn có thể thêm hơn 5 ảnh. Hệ thống hỗ trợ tối đa 20 URL để đảm
              bảo hiệu năng.
            </p>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
