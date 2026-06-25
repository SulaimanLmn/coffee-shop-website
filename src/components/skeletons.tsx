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
