import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, MessageSquare, Search, ShieldCheck, Star, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';

const RATING_FIELDS = [
  { key: 'cleanliness', label: 'Sạch sẽ' },
  { key: 'accuracy', label: 'Độ chính xác' },
  { key: 'check_in', label: 'Check-in' },
  { key: 'communication', label: 'Giao tiếp' },
  { key: 'location', label: 'Vị trí' },
  { key: 'value', label: 'Giá trị' },
] as const;

type RatingKey = (typeof RATING_FIELDS)[number]['key'];

export default function AdminManageReviews() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roomQuery, setRoomQuery] = useState('');
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const roomPickerRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    room_id: '',
    user_name: '',
    avatar_url: '',
    comment: '',
    cleanliness: 4.8,
    accuracy: 4.8,
    check_in: 4.8,
    communication: 4.8,
    location: 4.8,
    value: 4.8,
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await fetch('/api/rooms');
        const data = await res.json();
        setRooms(data || []);
      } catch {
        toast.error('Không tải được danh sách phòng');
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!roomPickerRef.current) return;
      if (!roomPickerRef.current.contains(event.target as Node)) {
        setShowRoomPicker(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === Number(formData.room_id)) || null,
    [rooms, formData.room_id],
  );

  const filteredRooms = useMemo(() => {
    const keyword = roomQuery.trim().toLowerCase();
    if (!keyword) return rooms;

    return rooms.filter((room) => {
      return (
        room.title.toLowerCase().includes(keyword)
        || room.location.toLowerCase().includes(keyword)
        || String(room.id).includes(keyword)
      );
    });
  }, [rooms, roomQuery]);

  const selectRoom = (roomId: number) => {
    setFormData((prev) => ({ ...prev, room_id: String(roomId) }));
    setRoomQuery('');
    setShowRoomPicker(false);
  };

  const clearRoomSelection = () => {
    setFormData((prev) => ({ ...prev, room_id: '' }));
    setRoomQuery('');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleScoreChange = (key: RatingKey, value: number) => {
    const safe = Math.max(0, Math.min(5, value));
    setFormData((prev) => ({ ...prev, [key]: safe }));
  };

  const resetForm = () => {
    setFormData({
      room_id: '',
      user_name: '',
      avatar_url: '',
      comment: '',
      cleanliness: 4.8,
      accuracy: 4.8,
      check_in: 4.8,
      communication: 4.8,
      location: 4.8,
      value: 4.8,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!token || !user?.is_admin) {
      toast.error('Bạn cần quyền admin để thêm review');
      return;
    }

    if (!formData.room_id || !formData.user_name.trim()) {
      toast.error('Vui lòng chọn phòng và nhập tên người đánh giá');
      return;
    }

    if (rooms.length === 0) {
      toast.error('Chưa có phòng nào để gắn review. Hãy thêm phòng trước.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        room_id: Number(formData.room_id),
      };

      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};

      if (contentType.includes('application/json')) {
        data = await response.json().catch(() => ({}));
      } else {
        const raw = await response.text().catch(() => '');
        if (raw.trim().startsWith('<!doctype') || raw.trim().startsWith('<html')) {
          throw new Error('API backend không phản hồi đúng. Hãy chạy đúng server bằng npm run dev và mở đúng cổng vừa in ra.');
        }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Không thể lưu review');
      }

      toast.success('Đã thêm review mẫu');
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Đã có lỗi xảy ra', { id: 'admin-save-review-error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-lg font-semibold text-slate-900">Chỉ dành cho Admin</p>
          <p className="text-slate-500">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wide">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản Lý Review</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{user.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin đánh giá</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Chọn phòng *</label>
                <div ref={roomPickerRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={roomQuery}
                      onChange={(e) => {
                        setRoomQuery(e.target.value);
                        setShowRoomPicker(true);
                      }}
                      onFocus={() => setShowRoomPicker(true)}
                      placeholder={selectedRoom ? `Đã chọn: ${selectedRoom.title} - ${selectedRoom.location}` : 'Tìm theo tên phòng, thành phố, hoặc ID...'}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {showRoomPicker && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-auto">
                      {filteredRooms.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">Không tìm thấy phòng phù hợp.</p>
                      ) : (
                        filteredRooms.map((room) => {
                          const active = formData.room_id === String(room.id);
                          return (
                            <button
                              type="button"
                              key={room.id}
                              onClick={() => selectRoom(room.id)}
                              className={`w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-slate-50 ${
                                active ? 'bg-emerald-50' : ''
                              }`}
                            >
                              <span>
                                <span className="block font-semibold text-slate-900">#{room.id} {room.title}</span>
                                <span className="block text-sm text-slate-500">{room.location}</span>
                              </span>
                              {active ? <Check className="w-4 h-4 text-emerald-600 mt-0.5" /> : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedRoom ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Đang chọn phòng #{selectedRoom.id}</p>
                      <p className="text-sm text-emerald-700">{selectedRoom.title} - {selectedRoom.location}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearRoomSelection}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                ) : null}

                <input type="hidden" name="room_id" value={formData.room_id} required />
                {loadingRooms ? <p className="text-xs text-slate-500 mt-2">Đang tải danh sách phòng...</p> : null}
                {!loadingRooms ? <p className="text-xs text-slate-500 mt-2">Tổng số phòng: {rooms.length}</p> : null}
                {!loadingRooms && rooms.length === 0 ? (
                  <p className="text-xs text-amber-600 mt-1">Hiện chưa có phòng nào. Bạn cần thêm phòng trước khi tạo review.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên người đánh giá *</label>
                  <input
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleTextChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="VD: Nguyễn Minh An"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Avatar URL</label>
                  <input
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleTextChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung bình luận</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                  <textarea
                    name="comment"
                    rows={4}
                    value={formData.comment}
                    onChange={handleTextChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Chỗ ở sạch sẽ, chủ nhà hỗ trợ nhiệt tình..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Điểm 6 tiêu chí</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RATING_FIELDS.map((field) => (
                <div key={field.key} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-800">{field.label}</span>
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-sm">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {(formData[field.key] as number).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={formData[field.key] as number}
                    onChange={(e) => handleScoreChange(field.key, Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Quay lại Admin
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
