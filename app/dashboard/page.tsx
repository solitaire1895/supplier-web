import Navbar from "@/components/navbar/navbar";
import SupplierCard from "@/components/dashboard/supplier-card";
import FilterSidebar from "@/components/dashboard/filter-sidebar";

const suppliers = [
  {
    name: "Shenzhen Tech Co.",
    platform: "Alibaba",
    moq: 100,
    category: "Electronics",
  },
  {
    name: "Guangzhou Mobile Ltd.",
    platform: "Pinduoduo",
    moq: 50,
    category: "Smartphones",
  },
  {
    name: "Beijing Digital Hub",
    platform: "Alibaba",
    moq: 200,
    category: "Computers",
  },

  // ➕ Added suppliers
  {
    name: "Hangzhou Fashion Group",
    platform: "Alibaba",
    moq: 80,
    category: "Clothing",
  },
  {
    name: "Yiwu Accessories Market",
    platform: "Pinduoduo",
    moq: 150,
    category: "Accessories",
  },
  {
    name: "Shanghai Home Supply",
    platform: "Alibaba",
    moq: 60,
    category: "Home",
  },
  {
    name: "Guangdong Beauty Labs",
    platform: "Alibaba",
    moq: 40,
    category: "Beauty",
  },
  {
    name: "Ningbo Kitchen Pro",
    platform: "Pinduoduo",
    moq: 120,
    category: "Kitchen",
  },
  {
    name: "Shenzhen Gadget World",
    platform: "Alibaba",
    moq: 90,
    category: "Electronics",
  },
  {
    name: "Foshan Furniture Hub",
    platform: "Alibaba",
    moq: 30,
    category: "Furniture",
  },
  {
    name: "Qingdao Sportswear Co.",
    platform: "Pinduoduo",
    moq: 70,
    category: "Sportswear",
  },
  {
    name: "Suzhou Decor Studio",
    platform: "Alibaba",
    moq: 55,
    category: "Decor",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* MAIN CONTAINER */}
      <div className="pt-24 pb-24 px-6 max-w-7xl mx-auto">
        
        {/* FLEX LAYOUT */}
        <div className="flex gap-6">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          {/* CONTENT */}
          <div className="flex-1">
            
            {/* HEADER */}
            <div className="mb-10">
              <h1
                className="
                text-3xl font-semibold
                text-white
                drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]
              "
              >
                Supplier Dashboard
              </h1>

              <p className="text-gray-400 mt-2">
                Discover and manage high-performing suppliers
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Suppliers", value: "128" },
                { label: "Favorites", value: "24" },
                { label: "Avg MOQ", value: "75" },
                { label: "Top Category", value: "Electronics" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="
                  bg-white/5 backdrop-blur-xl
                  border border-white/10
                  rounded-xl p-4
                  hover:border-red-500
                  transition
                "
                >
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* SUPPLIERS GRID */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier, i) => (
                <SupplierCard key={i} supplier={supplier} />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}