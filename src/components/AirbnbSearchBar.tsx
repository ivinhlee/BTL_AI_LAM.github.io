import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DateRange, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useLocation as useRouterLocation } from 'react-router-dom';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export interface SearchPayload {
  location: string;
  dates: {
    startDate: Date;
    endDate: Date;
  };
  guests: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
}

interface SearchBarProps {
  onSearch?: (data: SearchPayload) => void;
  variant?: 'hero' | 'compact';
}

type SearchPanel = 'where' | 'when' | 'who' | null;

const RECENT_SEARCHES = [
  { title: 'Hương Thủy', subtitle: '17-19 thg 7 · 6 khách' },
  { title: 'Huế', subtitle: '17-19 thg 7 · 6 khách' },
  { title: 'Đà Nẵng', subtitle: '17-19 thg 7 · 6 khách' },
];

const SUGGESTED_DESTINATIONS = [
  { title: 'Lân cận', subtitle: 'Tìm xung quanh bạn' },
  { title: 'Hà Nội', subtitle: 'Có các thắng cảnh như Nhà hát lớn Hà Nội' },
  { title: 'Đà Lạt, Lâm Đồng', subtitle: 'Khách quan tâm đến Huế cũng tìm kiếm khu vực này' },
];

export default function AirbnbSearchBar({ onSearch, variant = 'compact' }: SearchBarProps) {
  const [activePanel, setActivePanel] = useState<SearchPanel>(null);
  const [location, setLocation] = useState('');
  const routerLocation = useRouterLocation();
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      key: 'selection',
    },
  ]);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const selection = dateRange[0];
  const totalGuests = useMemo(() => guests.adults + guests.children, [guests]);
  const formattedDate = `${format(selection.startDate, "d 'thg' M", { locale: vi })} - ${format(selection.endDate, "d 'thg' M", { locale: vi })}`;
  const guestSummary = totalGuests > 0 ? `${totalGuests} khách` : 'Thêm khách';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activePanel === 'where') {
      locationInputRef.current?.focus();
    }
  }, [activePanel]);

  useEffect(() => {
    const queryLocation = new URLSearchParams(routerLocation.search).get('location') || '';
    if (activePanel !== 'where') {
      setLocation(queryLocation);
    }
  }, [routerLocation.search, activePanel]);

  const handleGuestChange = (key: keyof typeof guests, delta: number) => {
    setGuests((prev) => ({
      ...prev,
      [key]: Math.max(key === 'adults' ? 1 : 0, prev[key] + delta),
    }));
  };

  const triggerSearch = (nextLocation?: string) => {
    const finalLocation = (nextLocation ?? location).trim();
    setLocation(finalLocation);
    onSearch?.({
      location: finalLocation,
      dates: {
        startDate: selection.startDate,
        endDate: selection.endDate,
      },
      guests,
    });
    setActivePanel(null);
  };

  const isHero = variant === 'hero';
  const isExpanded = activePanel !== null;
  const whereSummary = location.trim() || 'Địa điểm bất kỳ';
  const whenSummary = isHero ? 'Thời gian bất kỳ' : formattedDate;
  const whoSummary = isHero ? 'Thêm khách' : guestSummary;

  const segmentClass = (panel: Exclude<SearchPanel, null>) => {
    const selected = activePanel === panel;
    const base = isHero
      ? 'rounded-full px-6 py-3 md:py-3.5 text-left transition-all border'
      : 'rounded-full px-4 py-2.5 text-left transition-all border min-h-[52px] flex items-center';

    if (selected) {
      return `${base} bg-white/85 backdrop-blur-xl border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_24px_rgba(15,23,42,0.12)]`;
    }

    if (isExpanded) {
      return `${base} bg-black/[0.07] border-transparent opacity-60`;
    }

    return `${base} bg-transparent border-transparent hover:bg-black/[0.05]`;
  };

  const datePopoverClass = isHero
    ? 'absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(50rem,94vw)] rounded-3xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 z-50'
    : 'absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[min(44rem,94vw)] rounded-3xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 z-50';

  const Counter = ({
    label,
    subLabel,
    field,
  }: {
    label: string;
    subLabel: string;
    field: keyof typeof guests;
  }) => {
    const isMin = guests[field] <= (field === 'adults' ? 1 : 0);
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
        <div>
          <p className="font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{subLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleGuestChange(field, -1)}
            disabled={isMin}
            aria-label={`Giảm số lượng ${label.toLowerCase()}`}
            className="w-8 h-8 rounded-full border border-slate-300 hover:border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            -
          </button>
          <span aria-live="polite" className="w-6 text-center font-semibold text-slate-900">{guests[field]}</span>
          <button
            type="button"
            onClick={() => handleGuestChange(field, 1)}
            aria-label={`Tăng số lượng ${label.toLowerCase()}`}
            className="w-8 h-8 rounded-full border border-slate-300 hover:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const renderPopover = () => {
    if (!activePanel) return null;

    if (activePanel === 'where') {
      return (
        <motion.div
          key="where"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 top-full mt-3 w-[min(44rem,92vw)] rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 z-50"
        >
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">Những tìm kiếm gần đây</p>
            <div className="space-y-2">
              {RECENT_SEARCHES.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    triggerSearch(item.title);
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Điểm đến được đề xuất</p>
            <div className="space-y-2">
              {SUGGESTED_DESTINATIONS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    triggerSearch(item.title);
                  }}
                  className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activePanel === 'when') {
      return (
        <motion.div
          key="when"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={datePopoverClass}
        >
          <div className="overflow-x-hidden flex justify-center">
            <DateRange
              ranges={dateRange}
              onChange={(item: RangeKeyDict) => setDateRange([item.selection as typeof dateRange[number]])}
              months={2}
              direction="horizontal"
              rangeColors={['#34C759']}
              minDate={new Date()}
              showMonthAndYearPickers={false}
            />
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="who"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-full mt-3 w-[min(26rem,92vw)] rounded-3xl bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 z-50"
      >
        <Counter label="Người lớn" subLabel="Trên 13 tuổi" field="adults" />
        <Counter label="Trẻ em" subLabel="Dưới 13 tuổi" field="children" />
        <Counter label="Em bé" subLabel="Dưới 2 tuổi" field="infants" />
        <Counter label="Thú cưng" subLabel="Bạn mang theo thú cưng?" field="pets" />
      </motion.div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className={`w-full rounded-full border border-white/40 bg-white/30 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.7)] ${
          isHero ? 'p-1.5' : 'p-1'
        }`}
      >
        <div className={`grid items-center gap-1 ${isHero ? 'grid-cols-[1.2fr_1fr_1fr_auto]' : 'grid-cols-[1.1fr_1fr_1fr_auto]'}`}>
          <button type="button" onClick={() => setActivePanel('where')} className={segmentClass('where')}>
            {isHero ? (
              <>
                <p className="text-xs font-semibold text-slate-900">Địa điểm</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setActivePanel('where')}
                    placeholder="Tìm kiếm điểm đến"
                    className="w-full bg-transparent outline-none text-slate-600 placeholder:text-slate-500 text-[15px]"
                  />
                </div>
              </>
            ) : (
              activePanel === 'where' ? (
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setActivePanel('where')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        triggerSearch();
                      }
                    }}
                    placeholder="Tìm kiếm điểm đến"
                    className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-sm md:text-base"
                  />
                </div>
              ) : (
                <p className="text-sm md:text-base font-semibold text-slate-800 truncate">{whereSummary}</p>
              )
            )}
          </button>

          <button type="button" onClick={() => setActivePanel('when')} className={segmentClass('when')}>
            {isHero ? (
              <>
                <p className="text-xs font-semibold text-slate-900">Thời gian</p>
                <p className="text-slate-600 mt-0.5 text-[15px]">{whenSummary}</p>
              </>
            ) : (
              <p className="text-sm md:text-base font-semibold text-slate-800 truncate">{whenSummary}</p>
            )}
          </button>

          <button type="button" onClick={() => setActivePanel('who')} className={segmentClass('who')}>
            {isHero ? (
              <>
                <p className="text-xs font-semibold text-slate-900">Khách</p>
                <p className="text-slate-600 mt-0.5 text-[15px]">{whoSummary}</p>
              </>
            ) : (
              <p className="text-sm md:text-base font-semibold text-slate-800 truncate">{whoSummary}</p>
            )}
          </button>

          <button
            type="button"
            onClick={() => triggerSearch()}
            className="h-[48px] rounded-full bg-[#34C759] hover:bg-[#2eaa4e] hover:shadow-[0_0_20px_rgba(52,199,89,0.4)] px-4 text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <AnimatePresence>
              {(isHero || isExpanded) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Tìm kiếm
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>{renderPopover()}</AnimatePresence>
    </div>
  );
}
