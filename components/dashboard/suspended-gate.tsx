"use client";

import { usePathname } from "next/navigation";
import { LockedPanel } from "@/components/dashboard/locked";
import { useI18n } from "@/lib/i18n";

const TEXT = {
  FR: { title: "Compte suspendu", desc: "Votre compte a été suspendu. Contactez le support pour en savoir plus.", cta: "Contacter le support" },
  EN: { title: "Account suspended", desc: "Your account has been suspended. Contact support to find out more.", cta: "Contact support" },
  CN: { title: "账户已停用", desc: "您的账户已被停用。请联系客服了解详情。", cta: "联系客服" },
};

/** A suspended account sees this instead of the dashboard; support stays reachable. */
export function SuspendedGate({ suspended, children }: { suspended: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useI18n();
  if (!suspended || pathname.startsWith("/dashboard/support")) return <>{children}</>;
  const t = TEXT[lang] ?? TEXT.FR;
  return (
    <main className="mx-auto max-w-5xl px-4 py-24">
      <LockedPanel title={t.title} description={t.desc} ctaLabel={t.cta} href="/dashboard/support" />
    </main>
  );
}
