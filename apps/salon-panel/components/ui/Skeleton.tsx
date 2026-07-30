export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-border/50 rounded-lg ${className}`} />
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
    <div className={`bg-white border border-border rounded-xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="border-b border-border bg-subtle px-5 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-4 flex gap-4 border-b border-border/50">
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
        <div key={i} className="bg-white border border-border rounded-xl p-5">
          <Skeleton className="w-8 h-8 rounded-lg mb-3" />
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-primary rounded-xl p-6 h-[150px]">
          <Skeleton className="h-3 w-32 bg-white/10" />
          <Skeleton className="h-10 w-24 bg-white/10 mt-3" />
        </div>
        <div className="lg:col-span-3 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-4">
              <Skeleton className="w-6 h-6 rounded mb-3" />
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SkeletonTable rows={4} cols={4} />
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}