export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-3xl bg-latte" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-latte" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-latte" />
          <div className="h-7 w-28 animate-pulse rounded bg-latte" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-latte" />
          <div className="h-3 w-full animate-pulse rounded bg-latte" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-latte" />
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-latte">
            <div className="h-16 bg-white" />
            <div className="h-16 bg-white" />
            <div className="h-16 bg-white" />
            <div className="h-16 bg-white" />
          </div>
          <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-latte" />
        </div>
      </div>
    </div>
  );
}
