import { PageHeaderSkeleton } from "@/components/skeletons";

export default function OrderLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6" aria-busy="true">
      <PageHeaderSkeleton />
    </div>
  );
}
