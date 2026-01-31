import { notFound } from "next/navigation";
import { ContactForm } from "@/components/ContactForm";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: { lang: string };
};

export const generateMetadata = ({ params }: PageProps) => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const title =
    lang === "en"
      ? "Contact - Vietnam Import Tax & HS Code Portal 2026"
      : "Liên hệ - Cổng tra cứu thuế nhập khẩu 2026";
  const description =
    lang === "en"
      ? "Send a private message about HS codes, tariffs, or compliance."
      : "Gửi tin nhắn riêng tư về mã HS, thuế nhập khẩu và quy định.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: {
        en: "/en/contact",
        vi: "/vi/contact"
      }
    }
  };
};

export default function ContactPage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);

  return (
    <main className="min-h-screen bg-brand-navy text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            {lang === "en" ? "Contact" : "Liên hệ"}
          </p>
          <h1 className="text-3xl font-semibold">
            {lang === "en" ? "Let’s talk" : "Liên hệ tư vấn"}
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            {lang === "en"
              ? "Tell us about your import or tariff questions. We respond privately by email."
              : "Hãy gửi câu hỏi về mã HS và thuế nhập khẩu. Chúng tôi phản hồi riêng qua email."}
          </p>
        </div>
        <ContactForm />
        <p className="mt-6 text-xs text-slate-400">
          {lang === "en"
            ? `Data source: ${strings.homeTitle}.`
            : `Nguồn dữ liệu: ${strings.homeTitle}.`}
        </p>
      </div>
    </main>
  );
}
