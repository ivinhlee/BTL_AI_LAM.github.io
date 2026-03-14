import React, { useMemo } from 'react';
import Slider from 'rc-slider';
import { Room } from '../types';
import 'rc-slider/assets/index.css';

const Range = (Slider as any).Range || (() => null);

interface PriceHistogramProps {
  rooms: Room[];
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
}

export const PriceHistogram: React.FC<PriceHistogramProps> = ({
  rooms,
  priceRange,
  setPriceRange
}) => {
  // Calculate histogram data from actual room prices
  const { buckets, maxPrice, bucketWidth, minPrice } = useMemo(() => {
    if (rooms.length === 0) {
      return { buckets: Array(20).fill(0), maxPrice: 20000000, minPrice: 0, bucketWidth: 1000000 };
    }

    // Find actual min/max price from rooms
    const actualMinPrice = Math.min(...rooms.map(r => r.price_per_night));
    const actualMaxPrice = Math.max(...rooms.map(r => r.price_per_night));

    // Add 20% padding on both sides for better visualization
    const padding = (actualMaxPrice - actualMinPrice) * 0.2;
    const displayMinPrice = Math.max(0, actualMinPrice - padding);
    const displayMaxPrice = actualMaxPrice + padding;

    // Dynamically determine bucket count for better granularity
    const priceRange = displayMaxPrice - displayMinPrice;
    let bucketCount = 20;
    if (priceRange < 2000000) bucketCount = 10;      // < 2M: 10 buckets
    else if (priceRange < 5000000) bucketCount = 15; // < 5M: 15 buckets
    else if (priceRange > 15000000) bucketCount = 30; // > 15M: 30 buckets

    const width = priceRange / bucketCount;

    // Initialize bucket counts
    const newBuckets = Array(bucketCount).fill(0);

    // Count rooms in each bucket
    rooms.forEach(room => {
      const bucketIndex = Math.min(
        Math.floor((room.price_per_night - displayMinPrice) / width),
        bucketCount - 1
      );
      if (bucketIndex >= 0) newBuckets[bucketIndex]++;
    });

    return { buckets: newBuckets, maxPrice: displayMaxPrice, minPrice: displayMinPrice, bucketWidth: width };
  }, [rooms]);

  // Find max count for scaling
  const maxCount = useMemo(() => Math.max(...buckets, 1), [buckets]);

  // Calculate which buckets are in the active price range
  const activeRange = useMemo(() => {
    const minBucketIndex = Math.max(0, Math.floor((priceRange[0] - minPrice) / bucketWidth));
    const maxBucketIndex = Math.min(buckets.length - 1, Math.ceil((priceRange[1] - minPrice) / bucketWidth));
    return { minBucketIndex, maxBucketIndex };
  }, [priceRange, bucketWidth, minPrice, buckets.length]);

  return (
    <div className="px-4">
      {/* Bar Chart */}
      <div className="relative h-20 flex items-end gap-1 mb-6">
        {buckets.map((count, idx) => {
          const isActive = idx >= activeRange.minBucketIndex && idx <= activeRange.maxBucketIndex;
          const heightPercent = (count / maxCount) * 100;

          return (
            <div
              key={idx}
              className={`flex-1 rounded-t-sm transition-all duration-200 ${
                isActive ? 'bg-slate-900' : 'bg-slate-300'
              }`}
              style={{ height: `${Math.max(heightPercent, 2)}%` }}
              title={`${(bucketWidth * idx / 1000000).toFixed(1)}M - ${(bucketWidth * (idx + 1) / 1000000).toFixed(1)}M: ${count} phòng`}
            />
          );
        })}
      </div>

      {/* Range Slider */}
      <Range
        min={minPrice}
        max={maxPrice}
        step={50000}
        value={priceRange}
        allowCross={false}
        onChange={(val) => setPriceRange(val as [number, number])}
        railStyle={{ backgroundColor: '#e5e7eb', height: 4, borderRadius: 999 }}
        trackStyle={[
          { backgroundColor: '#000000', height: 4 },
          { backgroundColor: '#000000', height: 4 }
        ]}
        handleStyle={[
          {
            borderColor: '#000000',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            width: 32,
            height: 32,
            marginTop: -14,
            opacity: 1
          },
          {
            borderColor: '#000000',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            width: 32,
            height: 32,
            marginTop: -14,
            opacity: 1
          }
        ]}
      />

      {/* Min/Max Price Inputs */}
      <div className="flex items-center justify-between mt-8 gap-4">
        <div className="flex-1 border border-slate-400 rounded-xl px-3 py-2 focus-within:border-black focus-within:border-2 focus-within:p-[7px]">
          <div className="text-xs text-slate-500 mb-1">Tối thiểu</div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">₫</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={15}
              value={priceRange[0].toLocaleString('vi-VN')}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/[^\d]/g, '')) || 0;
                const clamped = Math.min(Math.max(val, 0), priceRange[1]);
                setPriceRange([clamped, priceRange[1]]);
              }}
              className="w-full text-sm font-medium outline-none text-right bg-transparent"
            />
          </div>
        </div>
        <div className="text-slate-400 text-center">-</div>
        <div className="flex-1 border border-slate-400 rounded-xl px-3 py-2 focus-within:border-black focus-within:border-2 focus-within:p-[7px]">
          <div className="text-xs text-slate-500 mb-1">Tối đa</div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-1">₫</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={15}
              value={priceRange[1].toLocaleString('vi-VN')}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/[^\d]/g, '')) || maxPrice;
                const clamped = Math.max(Math.min(val, maxPrice), priceRange[0]);
                setPriceRange([priceRange[0], clamped]);
              }}
              className="w-full text-sm font-medium outline-none text-right bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
