export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl px-4 py-16 sm:px-6">
      <div className="w-full">
        <div className="h-9 w-48 animate-pulse rounded bg-latte" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-latte" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-latte bg-white">
              <div className="aspect-[4/3] animate-pulse bg-latte" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-latte" />
                <div className="h-3 w-full animate-pulse rounded bg-latte" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-latte" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
