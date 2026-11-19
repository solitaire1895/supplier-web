import { SuspendedGate } from "@/components/dashboard/suspended-gate";
import { getUserProfile } from "@/lib/supabase/queries";

// getUserProfile() is cached per request, so the pages below reuse this lookup.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile();
  return <SuspendedGate suspended={profile?.status === "suspended"}>{children}</SuspendedGate>;
}
