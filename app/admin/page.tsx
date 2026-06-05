import React from "react";
import AdminDashboardClient from "@/components/admin/admin-dashboard-client";
import { getSuppliers, getProducts, getUsers, getUserProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const profile = await getUserProfile();

  // Protect the route
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard');
  }

  const [suppliers, products, users] = await Promise.all([
    getSuppliers(),
    getProducts(),
    getUsers()
  ]);

  return (
    <AdminDashboardClient 
      initialSuppliers={suppliers} 
      initialProducts={products} 
      initialUsers={users}
      currentUser={profile}
    />
  );
}
