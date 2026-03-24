import React from "react";

export const RoomSkeleton = () => (
  <div className="animate-pulse bg-white rounded-2xl overflow-hidden border border-slate-100 p-4">
    <div className="bg-slate-200 aspect-[4/3] rounded-xl mb-4" />
    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-slate-200 rounded w-1/2" />
  </div>
);
