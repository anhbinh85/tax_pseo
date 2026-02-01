import { SITE_YEAR } from "@/lib/site";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];

export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export const getLocaleFromPath = (pathname: string): Locale => {
  if (pathname.startsWith("/en")) return "en";
  return "vi";
};

export const getLocaleStrings = (locale: Locale) => {
  if (locale === "en") {
    return {
      homeTitle: `Vietnam Import Tariff Lookup ${SITE_YEAR}`,
      searchPlaceholder: "Search HS code or product name",
      mfn: "MFN Import Duty",
      evfta: "EVFTA Import Duty",
      vat: "VAT",
      unit: "Unit",
      relatedTitle: "Related HS Codes (Same Chapter)",
      aiBadge: "✨ AI Insight",
      notFound: "HS code not found",
      notAvailable: "N/A",
      checkPolicy: "Check Policy"
    };
  }

  return {
    homeTitle: `Tra cứu thuế nhập khẩu Việt Nam ${SITE_YEAR}`,
    searchPlaceholder: "Tìm mã HS hoặc tên hàng hoá",
    mfn: "Thuế NK ưu đãi (MFN)",
    evfta: "Thuế EVFTA",
    vat: "VAT",
    unit: "Đơn vị tính",
    relatedTitle: "Mã HS liên quan (cùng Chương)",
    aiBadge: "✨ AI Insight",
    notFound: "Không tìm thấy mã HS",
    notAvailable: "N/A",
    checkPolicy: "Kiểm tra chính sách"
  };
};
