"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Search, TrendingUp, 
  Trash2, Edit, MoreHorizontal,
  Activity, Loader2, AlertCircle, X,
  Upload, CheckSquare, Square
} from "lucide-react";
import { deleteProduct, addProduct, updateProduct, uploadImage, updateProductsBulk } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import CSVImport from "./csv-import";

export default function ProductsAdmin({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const [bulkFormData, setBulkFormData] = useState({
    niche: "",
    category: "",
    demand: "",
    is_trending: undefined as boolean | undefined,
    ai_score: undefined as number | undefined
  });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.niche?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsDeleting(id);
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts(products.filter(p => p.id !== id));
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      alert("Error: " + res.error);
    }
    setIsDeleting(null);
  };

  const handleOpenForm = (product: any = null) => {
    setImageFile(null);
    setImagePreview(product?.image_url || null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let finalImageUrl = formData.image_url;
    if (imageFile) {
      const uploadRes = await uploadImage(imageFile, 'products');
      if (uploadRes.success) {
        finalImageUrl = uploadRes.url!;
      } else {
        alert("Upload error: " + uploadRes.error);
        setIsSubmitting(false);
        return;
      }
    }

    const submissionData = { ...formData, image_url: finalImageUrl };

    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, submissionData);
    } else {
      res = await addProduct(submissionData);
    }

    if (res.success) {
      setIsFormOpen(false);
      router.refresh();
      
      if (editingProduct) {
         setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...submissionData } : p));
      }
    } else {
      alert("Error: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);

    const cleanData: any = {};
    if (bulkFormData.niche) cleanData.niche = bulkFormData.niche;
    if (bulkFormData.category) cleanData.category = bulkFormData.category;
    if (bulkFormData.demand) cleanData.demand = bulkFormData.demand;
    if (bulkFormData.is_trending !== undefined) cleanData.is_trending = bulkFormData.is_trending;
    if (bulkFormData.ai_score !== undefined) cleanData.ai_score = bulkFormData.ai_score;

    const res = await updateProductsBulk(selectedIds, cleanData);
    if (res.success) {
      setIsBulkEditOpen(false);
      setSelectedIds([]);
      router.refresh();
      setProducts(products.map(p => selectedIds.includes(p.id) ? { ...p, ...cleanData } : p));
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
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setIsBulkEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
            >
              <Edit size={16} /> Bulk Edit ({selectedIds.length})
            </button>
          )}
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
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-500 hover:text-white transition-colors">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare size={16} className="text-red-500" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Product</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Margin</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Score</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.includes(p.id) ? 'bg-red-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(p.id)} className="text-gray-500 hover:text-white transition-colors">
                      {selectedIds.includes(p.id) ? <CheckSquare size={16} className="text-red-500" /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden border border-white/5">
                        <img 
                          src={p.image_url || `https://via.placeholder.com/150`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Error";
                          }}
                        />
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
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Product Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 transition-all overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-500 mb-2" />
                      <p className="text-xs text-gray-500">Click to upload image</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

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
                    value={isNaN(formData.buy_price) ? "" : String(formData.buy_price)}
                    onChange={e => setFormData({...formData, buy_price: e.target.value === "" ? 0 : parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Sell Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={isNaN(formData.sell_price) ? "" : String(formData.sell_price)}
                    onChange={e => setFormData({...formData, sell_price: e.target.value === "" ? 0 : parseFloat(e.target.value)})}
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
                    value={isNaN(formData.ai_score) ? "" : String(formData.ai_score)}
                    onChange={e => setFormData({...formData, ai_score: e.target.value === "" ? 0 : parseInt(e.target.value)})}
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

      {/* BULK EDIT MODAL */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold">Bulk Edit Products ({selectedIds.length})</h3>
              <button onClick={() => setIsBulkEditOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Niche</label>
                <input 
                  type="text" 
                  value={bulkFormData.niche}
                  onChange={e => setBulkFormData({...bulkFormData, niche: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="Leave empty to keep current"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Category</label>
                <input 
                  type="text" 
                  value={bulkFormData.category}
                  onChange={e => setBulkFormData({...bulkFormData, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="Leave empty to keep current"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Demand</label>
                <select 
                  value={bulkFormData.demand}
                  onChange={e => setBulkFormData({...bulkFormData, demand: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                >
                  <option value="">Keep current</option>
                  <option value="High" className="bg-black">High</option>
                  <option value="Medium" className="bg-black">Medium</option>
                  <option value="Low" className="bg-black">Low</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">AI Score (0-100)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={bulkFormData.ai_score === undefined || isNaN(bulkFormData.ai_score) ? '' : String(bulkFormData.ai_score)}
                    onChange={e => setBulkFormData({...bulkFormData, ai_score: e.target.value === '' ? undefined : parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Trending Status</label>
                  <select 
                    value={bulkFormData.is_trending === undefined ? '' : bulkFormData.is_trending.toString()}
                    onChange={e => setBulkFormData({...bulkFormData, is_trending: e.target.value === '' ? undefined : e.target.value === 'true'})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">Keep current</option>
                    <option value="true" className="bg-black">Trending</option>
                    <option value="false" className="bg-black">Not Trending</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-red-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Update Selected Products'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
