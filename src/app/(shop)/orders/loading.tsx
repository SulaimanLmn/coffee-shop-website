import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function OrdersLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6" aria-busy="true">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
