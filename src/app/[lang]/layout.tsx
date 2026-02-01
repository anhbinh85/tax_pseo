import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";
import { SITE_YEAR } from "@/lib/site";

type LayoutProps = {
  children: React.ReactNode;
  params: { lang: string };
};

export const generateMetadata = ({ params }: LayoutProps): Metadata => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);
  const title = strings.homeTitle;
  const description =
    lang === "en"
      ? `Search HS codes and import duties in Vietnam for ${SITE_YEAR}.`
      : `Tra cứu mã HS và thuế nhập khẩu Việt Nam năm ${SITE_YEAR}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        vi: "/vi"
      }
    }
  };
};

export default function LangLayout({ children, params }: LayoutProps) {
  if (!isLocale(params.lang)) notFound();
  return children;
}
