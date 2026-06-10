"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { addProduct, addSupplier } from "@/lib/supabase/actions";

interface CSVImportProps {
  type: "Suppliers" | "Winning Products";
  onComplete: () => void;
}

export default function CSVImport({ type, onComplete }: CSVImportProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          console.log(`Parsing ${type} CSV:`, data);

          let successCount = 0;
          let failCount = 0;

          for (const item of data) {
            let res;
            if (type === "Suppliers") {
              // Ensure fields match DB schema
              const supplierData = {
                name: item.name,
                platform: item.platform,
                category: item.category,
                moq: parseInt(item.moq) || 1,
                status: item.status || 'active',
                image_url: item.image_url,
                contact_url: item.contact_url,
                supplied_products: item.supplied_products,
                contact_info: item.contact_info ? JSON.parse(item.contact_info) : null
              };
              res = await addSupplier(supplierData);
            } else {
              // Winning Products
              const productData = {
                name: item.name,
                niche: item.niche,
                category: item.category,
                margin: item.margin,
                demand: item.demand,
                buy_price: parseFloat(item.buy_price) || 0,
                sell_price: parseFloat(item.sell_price) || 0,
                image_url: item.image_url,
                ai_score: parseInt(item.ai_score) || 50,
                is_trending: item.is_trending === 'true' || item.is_trending === '1'
              };
              res = await addProduct(productData);
            }

            if (res.success) {
              successCount++;
            } else {
              failCount++;
            }
          }

          setSuccess(`Successfully imported ${successCount} ${type}. ${failCount > 0 ? `${failCount} failed.` : ''}`);
          onComplete();
        } catch (err: any) {
          setError(`Import failed: ${err.message}`);
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        setError(`CSV Parsing error: ${err.message}`);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center transition-all hover:border-red-500/50 group">
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      
      {!isUploading ? (
        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500/20 transition-all">
            <Upload className="text-red-500" size={24} />
          </div>
          <h3 className="text-sm font-bold mb-1">Import {type} via CSV</h3>
          <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Upload your bulk data to instantly update the Nexusply engine.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-4">
          <Loader2 className="text-red-500 animate-spin mb-3" size={32} />
          <p className="text-sm font-medium">Processing batch import...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 size={14} />
          {success}
        </div>
      )}
    </div>
  );
}
