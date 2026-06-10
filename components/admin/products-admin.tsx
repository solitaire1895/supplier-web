"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Search, TrendingUp, 
  Trash2, Edit, MoreHorizontal,
  Activity, Loader2, AlertCircle, X
} from "lucide-react";
import { deleteProduct, addProduct, updateProduct } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import CSVImport from "./csv-import";

export default function ProductsAdmin({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    category: "",
    margin: "",
    demand: "High",
    buy_price: 0,
    sell_price: 0,
    ai_score: 50,
    is_trending: false,
    image_url: ""
  });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.niche?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsDeleting(id);
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert("Error: " + res.error);
    }
    setIsDeleting(null);
  };

  const handleOpenForm = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        niche: product.niche || "",
        category: product.category || "",
        margin: product.margin || "",
        demand: product.demand || "High",
        buy_price: product.buy_price || 0,
        sell_price: product.sell_price || 0,
        ai_score: product.ai_score || 50,
        is_trending: product.is_trending || false,
        image_url: product.image_url || ""
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        niche: "",
        category: "",
        margin: "",
        demand: "High",
        buy_price: 0,
        sell_price: 0,
        ai_score: 50,
        is_trending: false,
        image_url: ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, formData);
    } else {
      res = await addProduct(formData);
    }

    if (res.success) {
      setIsFormOpen(false);
      router.refresh();
      if (editingProduct) {
         setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p));
      }
    } else {
      alert("Error: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleImportComplete = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Winning Products Database</h3>
          <p className="text-xs text-gray-500">Managing {products.length} analyzed market opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-all w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all"
          >
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-fit">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Product</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Margin</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Score</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden border border-white/5">
                        <img src={p.image_url || `https://via.placeholder.com/150`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">{p.niche}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-400 font-medium">{p.margin}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{p.ai_score}</span>
                      {p.is_trending && <TrendingUp size={12} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(p.id)}
                        disabled={isDeleting === p.id}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        {isDeleting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                      <button 
                        onClick={() => handleOpenForm(p)}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No products found matching your search.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <CSVImport type="Winning Products" onComplete={handleImportComplete} />
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" /> Import Guidelines
            </h4>
            <ul className="text-xs text-gray-400 space-y-3 list-disc pl-4">
              <li>Header row required: <code className="text-red-400">name, niche, category, margin, demand, buy_price, sell_price, image_url, ai_score, is_trending</code></li>
              <li><code className="text-red-400">is_trending</code> should be <code className="text-gray-300">true</code> or <code className="text-gray-300">false</code>.</li>
              <li>Margins should be strings like <code className="text-gray-300">45%</code> or <code className="text-gray-300">High</code>.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-black border border-white/10 rounded-2xl w-full max-w-lg my-8 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Product Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="e.g. Ergonomic Office Chair"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Niche</label>
                  <input 
                    type="text" 
                    value={formData.niche}
                    onChange={e => setFormData({...formData, niche: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                    placeholder="e.g. Home Office"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Category</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                    placeholder="e.g. Furniture"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Margin (%)</label>
                  <input 
                    type="text" 
                    value={formData.margin}
                    onChange={e => setFormData({...formData, margin: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                    placeholder="e.g. 45%"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Demand</label>
                  <select 
                    value={formData.demand}
                    onChange={e => setFormData({...formData, demand: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="High" className="bg-black">High</option>
                    <option value="Medium" className="bg-black">Medium</option>
                    <option value="Low" className="bg-black">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Buy Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.buy_price}
                    onChange={e => setFormData({...formData, buy_price: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Sell Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.sell_price}
                    onChange={e => setFormData({...formData, sell_price: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">AI Score (0-100)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.ai_score}
                    onChange={e => setFormData({...formData, ai_score: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox" 
                    id="is_trending"
                    checked={formData.is_trending}
                    onChange={e => setFormData({...formData, is_trending: e.target.checked})}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="is_trending" className="text-sm font-medium">Is Trending?</label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Image URL</label>
                <input 
                  type="text" 
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="https://..."
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
