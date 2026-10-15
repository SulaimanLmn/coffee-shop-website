import { ProductGridSkeleton } from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <div className="h-9 w-64 animate-pulse rounded bg-latte" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-latte" />
      </div>
      <ProductGridSkeleton count={9} />
    </div>
  );
}
