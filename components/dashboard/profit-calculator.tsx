"use client";

import { useState, useEffect } from "react";
import { DollarSign, Truck, Scale, Box, Target, Lock, Coins } from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import { getCurrentPlan } from "@/lib/settings";
import { useI18n } from "@/lib/i18n";

interface ProfitCalculatorProps {
  buyPrice: number;
  sellPrice: number;
}

export default function ProfitCalculator({ buyPrice, sellPrice }: ProfitCalculatorProps) {
  const { lang } = useI18n();
  const [plan, setPlan] = useState("Free");
  const features = getPlanFeatures(plan);

  const [shipping, setShipping] = useState(0);
  const [weight, setWeight] = useState(0);
  const [cbm, setCbm] = useState(0);
  const [adSpend, setAdSpend] = useState(0);

  useEffect(() => {
    setPlan(getCurrentPlan());
  }, []);

  const isBasic = features.calculator === 'basic';
  const isComplete = features.calculator === 'complete';
  const isFull = features.calculator === 'full';

  const totalCost = buyPrice + (isBasic ? 0 : shipping + adSpend);
  const profit = sellPrice - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : "0";

  const formatCurrency = (val: number) => {
    return val.toLocaleString() + " FCFA";
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Coins className="text-green-400" size={20} />
          <h2 className="text-lg font-semibold">Profit Simulator</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-wider">
          Plan: {features.name[lang] || features.name.EN}
        </span>
      </div>

      <div className="space-y-6">
        {/* INPUTS GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1 block">Buy Price</label>
            <p className="text-lg font-bold text-white">{formatCurrency(buyPrice)}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1 block">Sell Price</label>
            <p className="text-lg font-bold text-white">{formatCurrency(sellPrice)}</p>
          </div>
        </div>

        {/* PREMIUM INPUTS */}
        <div className="space-y-4">
          {/* Shipping */}
          <div className={`relative p-4 rounded-2xl border transition-all ${isBasic ? 'bg-black/20 border-white/5 opacity-50' : 'bg-black/40 border-white/10'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <Truck size={12} /> Shipping Cost (Total)
              </label>
              {isBasic && <Lock size={12} className="text-gray-600" />}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={shipping} 
                onChange={(e) => setShipping(Number(e.target.value))}
                disabled={isBasic}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold"
                placeholder="0"
              />
              <span className="text-gray-500 text-xs">FCFA</span>
            </div>
          </div>

          {/* Weight & CBM Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`relative p-4 rounded-2xl border transition-all ${isBasic ? 'bg-black/20 border-white/5 opacity-50' : 'bg-black/40 border-white/10'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                  <Scale size={12} /> Weight (kg)
                </label>
              </div>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                disabled={isBasic}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold"
                placeholder="0"
              />
            </div>
            <div className={`relative p-4 rounded-2xl border transition-all ${isBasic ? 'bg-black/20 border-white/5 opacity-50' : 'bg-black/40 border-white/10'}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                  <Box size={12} /> CBM
                </label>
              </div>
              <input 
                type="number" 
                value={cbm} 
                onChange={(e) => setCbm(Number(e.target.value))}
                disabled={isBasic}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold"
                placeholder="0"
              />
            </div>
          </div>

          {/* Ad Spend */}
          <div className={`relative p-4 rounded-2xl border transition-all ${isBasic || (!isFull && !isComplete) ? 'bg-black/20 border-white/5 opacity-50' : 'bg-black/40 border-white/10'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <Target size={12} /> Ad Spend Est.
              </label>
              {(isBasic) && <Lock size={12} className="text-gray-600" />}
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={adSpend} 
                onChange={(e) => setAdSpend(Number(e.target.value))}
                disabled={isBasic}
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold"
                placeholder="0"
              />
              <span className="text-gray-500 text-xs">FCFA</span>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Est. Net Profit</span>
            <span className="text-2xl font-bold text-red-500 tracking-tight">{formatCurrency(profit)}</span>
          </div>
          <div className="flex justify-end">
            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${Number(roi) > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {roi}% ROI
            </span>
          </div>
        </div>

        {isBasic && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400 font-medium leading-relaxed text-center">
              Upgrade to <span className="font-bold">Importateur</span> to unlock full shipping, CBM, and net margin calculations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
