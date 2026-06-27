import { createClient } from "@/lib/supabase/server";
import SupplierDetailClient from "./supplier-detail-client";
import { notFound } from "next/navigation";

export default async function SupplierPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  // UUID regex check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    console.warn(`SupplierPage: Invalid UUID format for ID: ${id}`);
    notFound();
  }

  const supabase = await createClient();

  // Fetch supplier server-side (bypasses RLS mismatch between anon client and service role)
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  console.log("Server-side supplier fetch:", { id, supplier, supplierError });

  if (supplierError) {
    console.error("Error fetching supplier:", supplierError);
    // Still render the client with null so it shows the error UI
  }

  // Fetch reviews server-side too
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("*, profiles(email, full_name)")
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    console.error("Error fetching reviews:", reviewsError);
  }

  if (!supplier) {
    console.warn(`Supplier not found for ID: ${id}. Error: ${supplierError?.message ?? "No data returned (check RLS policies)"}`);
    notFound();
  }

  const enrichedSupplier = {
    ...supplier,
    rating: 4.8,
    reviewsCount: reviews?.length || 0,
    description:
      supplier.description ||
      "High-performance analyzed supplier specializing in scalable production and consistent quality.",
  };

  return (
    <SupplierDetailClient
      supplier={enrichedSupplier}
      initialReviews={reviews || []}
      supplierId={id}
    />
  );
}
