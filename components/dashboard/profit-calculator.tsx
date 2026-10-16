"use client";

import { useState } from "react";
import { Truck, Scale, Box, Target, Lock } from "lucide-react";
import { getPlanFeatures } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { useUser } from "@/lib/supabase/provider";
import { SectionLabel } from "@/components/landing/primitives";

interface ProfitCalculatorProps {
  buyPrice: number;
  sellPrice: number;
}

export default function ProfitCalculator({ buyPrice, sellPrice }: ProfitCalculatorProps) {
  const { t, lang } = useI18n();
  const c = t.featureUi.calculator;
  // The plan comes from the signed-in profile (not a local browser setting),
  // so paying users get the calculator their plan includes.
  const { profile } = useUser();
  const features = getPlanFeatures(profile?.active_plan);

  const [shipping, setShipping] = useState(0);
  const [weight, setWeight] = useState(0);
  const [cbm, setCbm] = useState(0);
  const [adSpend, setAdSpend] = useState(0);

  const isBasic = features.calculator === "basic";

  const totalCost = buyPrice + (isBasic ? 0 : shipping + adSpend);
  const profit = sellPrice - totalCost;
  const roi = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(0) : "0";

  const locale = lang === "FR" ? "fr-FR" : lang === "CN" ? "zh-CN" : "en-US";
  const formatCurrency = (val: number) => `${val.toLocaleString(locale)} FCFA`;

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-ink-2 p-7">
      <div className="mb-7 flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <SectionLabel>{c.plan} · {features.name[lang] || features.name.EN}</SectionLabel>
          <h2 className="mt-3 font-display text-3xl font-light text-white">{c.title}</h2>
        </div>
      </div>

      {/* PRICES */}
      <dl className="grid grid-cols-2 border-b border-white/[0.08] pb-6">
        <div>
          <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone">{c.buyPrice}</dt>
          <dd className="mt-2 whitespace-nowrap font-display text-xl font-light text-white sm:text-2xl">{formatCurrency(buyPrice)}</dd>
        </div>
        <div className="border-l border-white/[0.08] pl-5">
          <dt className="font-label text-[10px] uppercase tracking-[0.15em] text-stone">{c.sellPrice}</dt>
          <dd className="mt-2 whitespace-nowrap font-display text-xl font-light text-white sm:text-2xl">{formatCurrency(sellPrice)}</dd>
        </div>
      </dl>

      {/* INPUTS */}
      <div className="mt-6 space-y-3">
        <Field icon={<Truck size={13} />} label={c.shipping} unit="FCFA" value={shipping} onChange={setShipping} locked={isBasic} lockedBadge={c.lockedBadge} />
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<Scale size={13} />} label={c.weight} value={weight} onChange={setWeight} locked={isBasic} />
          <Field icon={<Box size={13} />} label={c.cbm} value={cbm} onChange={setCbm} locked={isBasic} />
        </div>
        <Field icon={<Target size={13} />} label={c.adSpend} unit="FCFA" value={adSpend} onChange={setAdSpend} locked={isBasic} lockedBadge={c.lockedBadge} />
      </div>

      {/* RESULT */}
      <div className="mt-7 flex items-end justify-between gap-4 border-t border-white/[0.08] pt-6">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.15em] text-stone">{c.netProfit}</p>
          <p className={`mt-2 whitespace-nowrap font-display text-3xl font-light sm:text-4xl ${profit >= 0 ? "text-white" : "text-red-500"}`}>{formatCurrency(profit)}</p>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 font-label text-[11px] tracking-[0.1em] ${
            Number(roi) > 0 ? "border-white/15 text-white" : "border-red-500/30 text-red-500"
          }`}
        >
          {roi}% {c.roi}
        </span>
      </div>

      {isBasic && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-xs leading-relaxed text-white/75">
          <Lock size={13} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
          {c.lockedNote}
        </p>
      )}
    </section>
  );
}

function Field({
  icon,
  label,
  unit,
  value,
  onChange,
  locked,
  lockedBadge,
}: {
  icon: React.ReactNode;
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  locked: boolean;
  lockedBadge?: string;
}) {
  return (
    <label
      className={`block rounded-xl border px-4 py-3 transition ${
        locked ? "cursor-not-allowed border-white/[0.05] opacity-50" : "border-white/10 focus-within:border-red-500/50"
      }`}
    >
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-label text-[10px] uppercase tracking-[0.15em] text-stone">
          {icon} {label}
        </span>
        {locked && (
          <span className="flex items-center gap-1 font-label text-[9px] uppercase tracking-[0.12em] text-stone-2">
            <Lock size={10} aria-hidden /> {lockedBadge}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={locked}
          className="w-full bg-transparent font-display text-xl font-light text-white focus:outline-none disabled:cursor-not-allowed"
          placeholder="0"
        />
        {unit && <span className="text-xs text-stone">{unit}</span>}
      </span>
    </label>
  );
}
