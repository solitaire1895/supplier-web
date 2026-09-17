import TrainingDetailClient from "@/components/dashboard/training-detail-client";
import { getTrainingById } from "@/lib/supabase/queries";
import { Suspense } from "react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16: params is a Promise in server components.
  const { id } = await params;

  const training = await getTrainingById(id);

  // Non-Partenaire users, missing rows, or invalid IDs → 404.
  if (!training) {
    notFound();
  }

  return (
    <Suspense>
      <TrainingDetailClient training={training} />
    </Suspense>
  );
}
