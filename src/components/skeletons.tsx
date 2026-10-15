export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-latte bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-latte" />
          <div className="flex flex-col gap-3 p-5">
            <div className="h-4 w-20 animate-pulse rounded bg-latte" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-latte" />
            <div className="h-3 w-full animate-pulse rounded bg-latte" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-latte" />
            <div className="mt-2 flex items-center justify-between">
              <div className="h-5 w-16 animate-pulse rounded bg-latte" />
              <div className="h-8 w-24 animate-pulse rounded-full bg-latte" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const bar = "animate-pulse rounded bg-latte";

export function PageHeaderSkeleton() {
  return (
    <div>
      <div className={`${bar} h-8 w-56`} />
      <div className={`${bar} mt-3 h-4 w-72`} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-latte bg-white">
      <div className="h-10 border-b border-latte bg-foam" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-latte px-4 py-3.5 last:border-b-0">
          <div className={`${bar} h-4 w-28`} />
          <div className={`${bar} h-4 flex-1`} />
          <div className={`${bar} h-5 w-20 rounded-full`} />
          <div className={`${bar} h-4 w-16`} />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="rounded-2xl border border-latte bg-foam/60 p-3">
          <div className={`${bar} mb-3 h-6 w-32`} />
          <div className="grid gap-3">
            {Array.from({ length: col === 0 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-latte bg-white p-4">
                <div className={`${bar} h-4 w-32`} />
                <div className={`${bar} mt-3 h-3 w-24`} />
                <div className={`${bar} mt-3 h-3 w-40`} />
                <div className={`${bar} mt-4 h-8 w-28 rounded-full`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
