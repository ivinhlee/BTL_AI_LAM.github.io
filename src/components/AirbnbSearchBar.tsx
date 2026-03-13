import React, { useMemo, useState } from 'react';
import { MapPin, Search, Users, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface SearchBarProps {
  onSearch?: (data: any) => void;
}

export default function AirbnbSearchBar({ onSearch }: SearchBarProps) {
  const [activeTab, setActiveTab] = useState<'location' | 'dates' | 'guests' | null>(null);
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      key: 'selection',
    },
  ]);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });

  const totalGuests = useMemo(() => guests.adults + guests.children, [guests]);
  const selection = dateRange[0];

  const handleGuestChange = (key: keyof typeof guests, delta: number) => {
    setGuests(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  };

  const triggerSearch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onSearch) {
      onSearch({
        location,
        dates: {
          startDate: selection.startDate,
          endDate: selection.endDate,
        },
        guests,
      });
    }
    setActiveTab(null);
  };

  return (
    <div className="relative w-full flex justify-center py-4">
      {/* Overlay để đóng popup khi click ra ngoài */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setActiveTab(null)}
          />
        )}
      </AnimatePresence>

      {/* THANH SEARCH CHÍNH */}
      <div className="relative z-50 flex items-center bg-white rounded-full shadow-lg border border-gray-200 p-2 max-w-4xl w-full">
        
        {/* 1. Địa điểm */}
        <div 
          onClick={() => setActiveTab('location')}
          className={`flex-1 flex flex-col px-6 py-2 rounded-full cursor-pointer transition-all ${activeTab === 'location' ? 'bg-white shadow-md' : 'hover:bg-gray-100'}`}
        >
          <span className="text-xs font-bold text-gray-900">Địa điểm</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm điểm đến" 
            className="bg-transparent outline-none text-sm text-gray-500 placeholder-gray-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* 2. Nhận phòng & Trả phòng (Gộp chung thành 1 vùng click cho gọn) */}
        <div 
          onClick={() => setActiveTab('dates')}
          className={`flex-[1.5] flex items-center rounded-full cursor-pointer transition-all ${activeTab === 'dates' ? 'bg-white shadow-md' : 'hover:bg-gray-100'}`}
        >
          <div className="flex-1 flex flex-col px-6 py-2">
            <span className="text-xs font-bold text-gray-900">Nhận phòng</span>
            <span className="text-sm text-gray-500">{format(selection.startDate, "d 'thg' M", {locale: vi})}</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex-1 flex flex-col px-6 py-2">
            <span className="text-xs font-bold text-gray-900">Trả phòng</span>
            <span className="text-sm text-gray-500">{format(selection.endDate, "d 'thg' M", {locale: vi})}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        {/* 3. Khách */}
        <div 
          onClick={() => setActiveTab('guests')}
          className={`flex-1 flex items-center pl-6 pr-2 py-2 rounded-full cursor-pointer transition-all ${activeTab === 'guests' ? 'bg-white shadow-md' : 'hover:bg-gray-100'}`}
        >
          <div className="flex flex-col flex-1">
            <span className="text-xs font-bold text-gray-900">Khách</span>
            <span className="text-sm text-gray-500">{totalGuests > 0 ? `${totalGuests} khách` : 'Thêm khách'}</span>
          </div>
          <button
            className="relative z-[60] bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-full transition-colors shadow-md"
            onClick={triggerSearch}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* ================= CÁC POPUP DROPDOWN ================= */}

        {/* POPUP LỊCH */}
        <AnimatePresence>
          {activeTab === 'dates' && (
            <motion.div
              key="dates-popup"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50"
            >
              <DateRange
                ranges={dateRange}
                onChange={(item: RangeKeyDict) => setDateRange([item.selection as any])}
                months={2}
                direction="horizontal"
                rangeColors={['#f43f5e']}
                minDate={new Date()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* POPUP KHÁCH */}
        <AnimatePresence>
          {activeTab === 'guests' && (
            <motion.div
              key="guests-popup"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 top-20 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 space-y-4"
            >
              {['adults', 'children', 'infants'].map((type) => (
                <div key={type} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-sm capitalize">{type === 'adults' ? 'Người lớn' : type === 'children' ? 'Trẻ em' : 'Em bé'}</p>
                    <p className="text-xs text-gray-400">{type === 'adults' ? 'Trên 13 tuổi' : 'Dưới 13 tuổi'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => {e.stopPropagation(); handleGuestChange(type as any, -1)}} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900">-</button>
                    <span className="text-sm font-bold">{(guests as any)[type]}</span>
                    <button onClick={(e) => {e.stopPropagation(); handleGuestChange(type as any, 1)}} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900">+</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}