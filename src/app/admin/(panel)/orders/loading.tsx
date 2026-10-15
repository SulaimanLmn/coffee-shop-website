import { BoardSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function AdminOrdersLoading() {
  return (
    <div className="grid gap-5" aria-busy="true">
      <PageHeaderSkeleton />
      <BoardSkeleton />
    </div>
  );
}
