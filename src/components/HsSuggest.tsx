"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Suggestion = {
  hs_code: string;
  name_en: string;
  name_vi: string;
  reason: string;
};

type Props = {
  lang: Locale;
};

const MAX_IMAGE_SIZE_MB = 2;

export const HsSuggest = ({ lang }: Props) => {
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (file?: File) => {
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(
        lang === "en"
          ? "Image is too large. Please use a file under 2MB."
          : "Ảnh quá lớn. Vui lòng dùng ảnh dưới 2MB."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setSuggestions([]);
    setImageHint(null);
    try {
      const res = await fetch("/api/hs-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          imageDataUrl: imageDataUrl || undefined
        })
      });
      const data = (await res.json()) as {
        suggestions?: Suggestion[];
        imageHint?: string | null;
      };
      setSuggestions(data.suggestions ?? []);
      setImageHint(data.imageHint ?? null);
    } catch {
      setError(
        lang === "en"
          ? "Could not fetch suggestions. Please try again."
          : "Không thể lấy gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">
          {lang === "en"
            ? "AI HS Code Suggestion"
            : "Gợi ý mã HS bằng AI"}
        </h2>
        <p className="text-sm text-slate-600">
          {lang === "en"
            ? "Enter product details and optional image. AI will suggest suitable HS codes from the tariff list."
            : "Nhập mô tả sản phẩm và ảnh (nếu có). AI sẽ gợi ý mã HS phù hợp từ danh mục thuế."}
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
          rows={4}
          placeholder={
            lang === "en"
              ? "Example: rubber tire for passenger car, size 195/65R15"
              : "Ví dụ: lốp cao su cho ô tô con, size 195/65R15"
          }
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => handleImageChange(event.target.files?.[0])}
          className="block text-sm text-slate-600"
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lang === "en"
            ? "AI can be wrong. Please validate its result."
            : "AI có thể sai. Vui lòng kiểm tra lại kết quả."}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!description.trim() && !imageDataUrl}
        >
          {loading
            ? lang === "en"
              ? "Finding..."
              : "Đang gợi ý..."
            : lang === "en"
              ? "Suggest HS Code"
              : "Gợi ý mã HS"}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {imageHint && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <span className="font-semibold">
            {lang === "en" ? "Image hint:" : "Mô tả ảnh:"}
          </span>{" "}
          {imageHint}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((item) => (
            <a
              key={item.hs_code}
              href={`/${lang}/hs-code/${item.hs_code.replace(/\./g, "")}`}
              className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className="text-sm font-semibold text-slate-900">
                {item.hs_code} - {lang === "en" ? item.name_en : item.name_vi}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {lang === "en" ? item.name_vi : item.name_en}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {item.reason}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
};
