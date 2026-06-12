import WinningProductsClient from "@/components/dashboard/winning-products-client";
import { getProducts, getUserProfile } from "@/lib/supabase/queries";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

export default async function WinningProductsPage() {
  const [products, profile] = await Promise.all([
    getProducts(),
    getUserProfile()
  ]);

  return (
    <Suspense>
      <WinningProductsClient 
        products={products} 
        profile={profile} 
      />
    </Suspense>
  );
}
