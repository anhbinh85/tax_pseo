"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Footer = () => {
  const pathname = usePathname() ?? "/";
  const lang = pathname.startsWith("/en") ? "en" : "vi";

  return (
    <footer className="bg-brand-navy text-slate-200">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm">
        <span>Data sourced from General Department of Vietnam Customs.</span>
        <div className="flex items-center gap-3">
          <Link
            href={lang === "en" ? "/en/contact" : "/vi/contact"}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:border-brand-gold hover:text-brand-gold"
          >
            Contact
          </Link>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
            Made in Vietnam 🇻🇳
          </span>
        </div>
      </div>
    </footer>
  );
};
