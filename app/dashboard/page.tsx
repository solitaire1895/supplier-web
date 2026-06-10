import DashboardClient from "@/components/dashboard/dashboard-client";
import { getSuppliers, getStats, getUserProfile } from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const [suppliers, stats, profile] = await Promise.all([
    getSuppliers(),
    getStats(),
    getUserProfile()
  ]);

  return (
    <DashboardClient 
      suppliers={suppliers} 
      stats={stats} 
      profile={profile} 
    />
  );
}
