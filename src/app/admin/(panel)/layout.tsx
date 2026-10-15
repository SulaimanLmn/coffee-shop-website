import { requireAdmin } from "@/lib/auth";
import { countOrdersNeedingAction } from "@/lib/admin-stats";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = await countOrdersNeedingAction();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-start md:gap-8">
      <AdminSidebar pendingCount={pending} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
