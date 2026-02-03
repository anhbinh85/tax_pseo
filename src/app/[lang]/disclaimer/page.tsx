import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/i18n";
import { SITE_YEAR } from "@/lib/site";

type PageProps = {
  params: { lang: string };
};

const SOURCES_EN = [
  "Vietnam: General Department of Vietnam Customs; Biểu thuế XNK (BT) official tariff data.",
  "US HTS: United States International Trade Commission (USITC) / Harmonized Tariff Schedule reference data.",
  "CAS: Chemical Abstracts Service registry data where applicable.",
  "AI-generated content: Descriptions, HTS suggestions, and insights—for guidance only.",
];

const SOURCES_VI = [
  "Việt Nam: Tổng cục Hải quan; dữ liệu biểu thuế XNK (BT) chính thức.",
  "US HTS: Dữ liệu tham chiếu Biểu thuế Hài hòa Hoa Kỳ (USITC).",
  "CAS: Dữ liệu đăng ký hóa chất (Chemical Abstracts Service) khi áp dụng.",
  "Nội dung AI: Mô tả, gợi ý mã HTS và gợi ý do AI tạo—chỉ mang tính tham khảo.",
];

export const generateMetadata = ({ params }: PageProps) => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const title =
    lang === "en"
      ? `Disclaimer - Vietnam Import Tax & HS Code Portal ${SITE_YEAR}`
      : `Tuyên bố miễn trừ - Cổng tra cứu thuế nhập khẩu ${SITE_YEAR}`;
  const description =
    lang === "en"
      ? "Data sources, AI disclaimer, and author information. Validate before commercial use."
      : "Nguồn dữ liệu, tuyên bố về AI và thông tin tác giả. Cần xác thực trước khi dùng thương mại.";
  return {
    title,
    description,
    alternates: {
      canonical: `/${params.lang}/disclaimer`,
      languages: {
        en: "/en/disclaimer",
        vi: "/vi/disclaimer",
      },
    },
  };
};

export default function DisclaimerPage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const sources = lang === "en" ? SOURCES_EN : SOURCES_VI;

  return (
    <main className="min-h-screen bg-brand-navy text-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          {lang === "en" ? "Disclaimer" : "Tuyên bố miễn trừ"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {lang === "en" ? "Disclaimer" : "Tuyên bố miễn trừ trách nhiệm"}
        </h1>

        <section className="mt-8 space-y-6 text-slate-300">
          {lang === "en" ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-white">Data sources</h2>
                <p className="mt-2 text-sm">
                  Data on this site is collected from multiple sources. We do not guarantee completeness or real-time accuracy. Official sources should be consulted for binding decisions.
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                  {sources.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI-generated content</h2>
                <p className="mt-2 text-sm">
                  Descriptions, HTS code suggestions, and other AI-generated content on this site are for guidance only. They must be validated by a qualified human (customs broker, lawyer, or trade expert) before use for commercial, trade, or compliance purposes.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Author</h2>
                <p className="mt-2 text-sm">
                  The author is based in Vietnam and has expertise in logistics and AI. This project was built mostly with AI assistance and completed in about three working days. It is shared to showcase both the author’s work and the capabilities of AI—as a reference tool, not as legal or official advice.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Questions</h2>
                <p className="mt-2 text-sm">
                  For any questions or feedback, please use the <strong>Contact</strong> button in the header or footer. We are happy to hear from you.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-white">Nguồn dữ liệu</h2>
                <p className="mt-2 text-sm">
                  Dữ liệu trên trang được tổng hợp từ nhiều nguồn. Chúng tôi không đảm bảo đầy đủ hay chính xác theo thời gian thực. Cần tham chiếu nguồn chính thức cho các quyết định có tính ràng buộc.
                </p>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm">
                  {sources.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Nội dung do AI tạo</h2>
                <p className="mt-2 text-sm">
                  Mô tả, gợi ý mã HTS và nội dung do AI tạo khác trên trang chỉ mang tính tham khảo. Cần được người có chuyên môn (đại lý hải quan, luật sư hoặc chuyên gia thương mại) xác thực trước khi sử dụng cho mục đích thương mại, thương mại quốc tế hoặc tuân thủ pháp luật.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Tác giả</h2>
                <p className="mt-2 text-sm">
                  Tác giả đang sống tại Việt Nam và có chuyên môn về logistics và AI. Dự án này được xây dựng chủ yếu với sự hỗ trợ của AI và hoàn thành trong khoảng ba ngày làm việc. Trang được chia sẻ để giới thiệu công việc của tác giả và khả năng của AI—như một công cụ tham khảo, không phải tư vấn pháp lý hay chính thức.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Câu hỏi</h2>
                <p className="mt-2 text-sm">
                  Mọi câu hỏi hoặc phản hồi, vui lòng dùng nút <strong>Liên hệ</strong> ở đầu hoặc chân trang. Chúng tôi rất mong nhận được ý kiến từ bạn.
                </p>
              </div>
            </>
          )}
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={lang === "en" ? "/en/contact" : "/vi/contact"}
            className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-amber-400"
          >
            {lang === "en" ? "Contact" : "Liên hệ"}
          </Link>
          <Link
            href={lang === "en" ? "/en" : "/vi"}
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-400 hover:text-white"
          >
            {lang === "en" ? "← Home" : "← Trang chủ"}
          </Link>
        </div>
      </div>
    </main>
  );
}
