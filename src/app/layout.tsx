import "./globals.css";
import { headers } from "next/headers";
import Script from "next/script";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { LangSwitch } from "@/components/LangSwitch";
import { Footer } from "@/components/Footer";
import { JsonLd, websiteJsonLd } from "@/components/JsonLd";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"]
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";
const gscId = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: {
    images: [{ url: "/hero-bg.jpg", width: 1200, height: 630, alt: "Vietnam HS & US HTS Import Duty Lookup" }],
  },
  ...(gscId ? { verification: { google: gscId } } : {}),
};

const getPathname = () => headers().get("x-pathname") ?? "";

const getHtmlLang = (pathname: string) => {
  if (pathname.startsWith("/en")) return "en";
  if (pathname.startsWith("/vi")) return "vi";
  return "vi";
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = getPathname();
  const lang = getHtmlLang(pathname);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={lang}>
      <body
        className={`${beVietnamPro.className} min-h-screen bg-slate-100 text-slate-900 antialiased`}
      >
        <JsonLd data={websiteJsonLd()} />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-setup" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
        <div className="flex min-h-screen flex-col">
          <LangSwitch />
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
