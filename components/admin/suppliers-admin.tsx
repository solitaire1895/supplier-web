"use client";

import React, { useState } from "react";
import { 
  Plus, Search, MoreHorizontal, 
  Trash2, Edit, ExternalLink, 
  CheckCircle2, AlertCircle, Loader2, X
} from "lucide-react";
import { deleteSupplier, addSupplier, updateSupplier } from "@/lib/supabase/actions";
import { useRouter } from "next/navigation";
import CSVImport from "./csv-import";

export default function SuppliersAdmin({ initialSuppliers }: { initialSuppliers: any[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    platform: "Alibaba",
    category: "",
    moq: 1,
    status: "active",
    image_url: ""
  });

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.platform.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    setIsDeleting(id);
    const res = await deleteSupplier(id);
    if (res.success) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    } else {
      alert("Error: " + res.error);
    }
    setIsDeleting(null);
  };

  const handleOpenForm = (supplier: any = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        platform: supplier.platform,
        category: supplier.category || "",
        moq: supplier.moq || 1,
        status: supplier.status || "active",
        image_url: supplier.image_url || ""
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        platform: "Alibaba",
        category: "",
        moq: 1,
        status: "active",
        image_url: ""
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let res;
    if (editingSupplier) {
      res = await updateSupplier(editingSupplier.id, formData);
    } else {
      res = await addSupplier(formData);
    }

    if (res.success) {
      setIsFormOpen(false);
      router.refresh();
      // For immediate UI update if not using server components effectively
      if (!editingSupplier) {
         // This is a bit hacky, normally router.refresh() should handle it but on client side we might need to fetch again or update state
         window.location.reload(); 
      } else {
         setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? { ...s, ...formData } : s));
      }
    } else {
      alert("Error: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleImportComplete = () => {
    router.refresh();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold">Suppliers Directory</h3>
          <p className="text-xs text-gray-500">Manage {suppliers.length} indexed manufacturers and platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-all w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all"
          >
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-fit">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Supplier</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Platform</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 overflow-hidden border border-white/5">
                        <img src={s.image_url || `https://ui-avatars.com/api/?name=${s.name}&background=random`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{s.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(s.id)}
                        disabled={isDeleting === s.id}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        {isDeleting === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                      <button 
                        onClick={() => handleOpenForm(s)}
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
              No suppliers found matching your search.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <CSVImport type="Suppliers" onComplete={handleImportComplete} />
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" /> Import Guidelines
            </h4>
            <ul className="text-xs text-gray-400 space-y-3 list-disc pl-4">
              <li>Header row required: <code className="text-red-400">name, platform, category, moq, status, image_url, contact_info</code></li>
              <li><code className="text-red-400">contact_info</code> should be a JSON string like <code className="text-gray-300">{"{\"whatsapp\": \"...\"}"}</code></li>
              <li>Platform must be one of: Alibaba, 1688, Pinduoduo, Xianyu, AliExpress, or Direct.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Supplier Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  placeholder="e.g. Shenzhen Tech Co."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Platform</label>
                  <select 
                    value={formData.platform}
                    onChange={e => setFormData({...formData, platform: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="Alibaba" className="bg-black">Alibaba</option>
                    <option value="1688" className="bg-black">1688</option>
                    <option value="Pinduoduo" className="bg-black">Pinduoduo</option>
                    <option value="AliExpress" className="bg-black">AliExpress</option>
                    <option value="Direct" className="bg-black">Direct</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="active" className="bg-black">Active</option>
                    <option value="pending" className="bg-black">Pending</option>
                  </select>
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
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : editingSupplier ? 'Update Supplier' : 'Create Supplier'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
