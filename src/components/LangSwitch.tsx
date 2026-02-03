"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const getLangPaths = (pathname: string) => {
  if (pathname.startsWith("/en")) {
    return {
      en: pathname,
      vi: pathname.replace(/^\/en/, "/vi")
    };
  }
  if (pathname.startsWith("/vi")) {
    return {
      vi: pathname,
      en: pathname.replace(/^\/vi/, "/en")
    };
  }
  if (pathname === "/") {
    return { vi: "/vi", en: "/en" };
  }
  return { vi: `/vi${pathname}`, en: `/en${pathname}` };
};

export const LangSwitch = () => {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/us-hts")) return null;
  const langPaths = getLangPaths(pathname);
  const activeLang = pathname.startsWith("/en")
    ? "en"
    : pathname.startsWith("/vi")
      ? "vi"
      : "vi";

  return (
    <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-xs font-semibold uppercase text-slate-700 shadow-sm backdrop-blur">
      <Link
        href={langPaths.vi}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
          activeLang === "vi" ? "bg-brand-red text-white" : "hover:bg-slate-100"
        }`}
        title="Tiếng Việt"
      >
        <span aria-hidden>🇻🇳</span>
        Vi
      </Link>
      <Link
        href={langPaths.en}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
          activeLang === "en" ? "bg-brand-red text-white" : "hover:bg-slate-100"
        }`}
        title="English"
      >
        <span aria-hidden>🇺🇸</span>
        En
      </Link>
    </div>
  );
};
