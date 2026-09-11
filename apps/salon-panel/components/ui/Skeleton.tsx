export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200/70 rounded-lg ${className}`} />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-4 flex gap-4 border-b border-slate-100/60">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 flex-1 ${c === 0 ? "w-1/4" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <Skeleton className="w-8 h-8 rounded-xl mb-3" />
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Greeting + Clock Pill Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 w-48 h-12 shadow-xs">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl p-5 shadow-xs space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-[#e9d5ff]/80" />
          <Skeleton className="h-3 w-28 bg-[#e9d5ff]/60" />
          <Skeleton className="h-8 w-20 bg-[#e9d5ff]/80" />
          <Skeleton className="h-3 w-32 bg-[#e9d5ff]/60 mt-2" />
        </div>

        {/* Card 2: Today's Bookings */}
        <div className="bg-[#f0f7ff] border border-[#e0f2fe] rounded-2xl p-5 shadow-xs space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-[#bae6fd]/80" />
          <Skeleton className="h-3 w-28 bg-[#bae6fd]/60" />
          <Skeleton className="h-8 w-16 bg-[#bae6fd]/80" />
          <Skeleton className="h-3 w-36 bg-[#bae6fd]/60 mt-2" />
        </div>

        {/* Card 3: Completed Today */}
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-5 shadow-xs space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-[#bbf7d0]/80" />
          <Skeleton className="h-3 w-28 bg-[#bbf7d0]/60" />
          <Skeleton className="h-8 w-16 bg-[#bbf7d0]/80" />
          <Skeleton className="h-3 w-32 bg-[#bbf7d0]/60 mt-2" />
        </div>

        {/* Card 4: This Month Revenue */}
        <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-5 shadow-xs space-y-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-[#fed7aa]/80" />
          <Skeleton className="h-3 w-32 bg-[#fed7aa]/60" />
          <Skeleton className="h-8 w-20 bg-[#fed7aa]/80" />
          <Skeleton className="h-3 w-24 bg-[#fed7aa]/60 mt-2" />
        </div>
      </div>

      {/* Main 2-Column Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Upcoming Appointments Table) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100/60">
                <Skeleton className="h-4 w-14" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
                <Skeleton className="h-3.5 w-8" />
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (Quick Actions + Recent Bookings) */}
        <div className="space-y-6">

          {/* Quick Actions Skeleton */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-xl p-3.5 h-12 flex items-center justify-between">
                <Skeleton className="h-4 w-28 bg-[#e9d5ff]/80" />
                <Skeleton className="h-4 w-4 bg-[#e9d5ff]/80 rounded-full" />
              </div>
              <div className="bg-[#f0f7ff] border border-[#e0f2fe] rounded-xl p-3.5 h-12 flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-[#bae6fd]/80" />
                <Skeleton className="h-4 w-4 bg-[#bae6fd]/80 rounded-full" />
              </div>
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-xl p-3.5 h-12 flex items-center justify-between">
                <Skeleton className="h-4 w-28 bg-[#bbf7d0]/80" />
                <Skeleton className="h-4 w-4 bg-[#bbf7d0]/80 rounded-full" />
              </div>
              <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-xl p-3.5 h-12 flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-[#fed7aa]/80" />
                <Skeleton className="h-4 w-4 bg-[#fed7aa]/80 rounded-full" />
              </div>
            </div>
          </div>

          {/* Recent Bookings Skeleton */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100/60">
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}