import WinningProductsClient from "@/components/dashboard/winning-products-client";
import { getProducts, getUserProfile } from "@/lib/supabase/queries";

export default async function WinningProductsPage() {
  const [products, profile] = await Promise.all([
    getProducts(),
    getUserProfile()
  ]);

  return (
    <WinningProductsClient 
      products={products} 
      profile={profile} 
    />
  );
}
