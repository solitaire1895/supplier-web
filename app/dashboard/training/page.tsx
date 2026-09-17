import TrainingClient from "@/components/dashboard/training-client";
import { getTrainings, getUserProfile } from "@/lib/supabase/queries";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const [trainings, profile] = await Promise.all([
    getTrainings(),
    getUserProfile()
  ]);

  return (
    <Suspense>
      <TrainingClient
        trainings={trainings}
        profile={profile}
      />
    </Suspense>
  );
}
