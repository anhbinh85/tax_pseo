import "./globals.css";
import { headers } from "next/headers";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"]
});

const getHtmlLang = () => {
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname.startsWith("/en")) return "en";
  if (pathname.startsWith("/vi")) return "vi";
  return "vi";
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const lang = getHtmlLang();

  return (
    <html lang={lang}>
      <body
        className={`${beVietnamPro.className} min-h-screen bg-slate-100 text-slate-900 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="bg-brand-navy text-slate-200">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm">
              <span>Data sourced from General Department of Vietnam Customs.</span>
              <div className="flex items-center gap-3">
                <Link
                  href={lang === "en" ? "/en/contact" : "/vi/contact"}
                  className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:border-brand-gold hover:text-brand-gold"
                >
                  {lang === "en" ? "Contact" : "Liên hệ"}
                </Link>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                  Made in Vietnam 🇻🇳
                </span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
