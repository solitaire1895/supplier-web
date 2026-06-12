import DashboardClient from "@/components/dashboard/dashboard-client";
import { getSuppliers, getStats, getUserProfile } from "@/lib/supabase/queries";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [suppliers, stats, profile] = await Promise.all([
    getSuppliers(),
    getStats(),
    getUserProfile()
  ]);

  return (
    <Suspense>
      <DashboardClient 
        suppliers={suppliers} 
        stats={stats} 
        profile={profile} 
      />
    </Suspense>
  );
}
