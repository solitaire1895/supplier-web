import React, { Suspense } from "react";
import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import { getUserProfile } from "@/lib/supabase/queries";
import { getAdminData } from "@/lib/supabase/admin-queries";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default async function AdminDashboard() {
  const profile = await getUserProfile();

  // Protect the route
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  // Unlimited, real data (service role) — only after the role check above.
  const { suppliers, products, users, stats } = await getAdminData();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-red-500 animate-spin" size={48} />
      </div>
    }>
      <AdminDashboardClient 
        initialSuppliers={suppliers} 
        initialProducts={products} 
        initialUsers={users}
        stats={stats}
        currentUser={profile}
      />
    </Suspense>
  );
}
