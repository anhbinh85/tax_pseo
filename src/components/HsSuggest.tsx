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

const MAX_IMAGE_SIZE_MB = 5;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);
const SUPPORTED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export const HsSuggest = ({ lang }: Props) => {
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (file?: File) => {
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    const lowerName = file.name.toLowerCase();
    const hasValidExt = SUPPORTED_IMAGE_EXTS.some((ext) => lowerName.endsWith(ext));
    if (!SUPPORTED_IMAGE_TYPES.has(file.type) || !hasValidExt) {
      setError(
        lang === "en"
          ? `Unsupported file format. Please upload ${SUPPORTED_IMAGE_EXTS.join(", ")} only.`
          : `Định dạng không hỗ trợ. Vui lòng chỉ tải lên ${SUPPORTED_IMAGE_EXTS.join(", ")}.`
      );
      setImageDataUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(
        lang === "en"
          ? `Image is too large. Please use a file under ${MAX_IMAGE_SIZE_MB}MB.`
          : `Ảnh quá lớn. Vui lòng dùng ảnh dưới ${MAX_IMAGE_SIZE_MB}MB.`
      );
      setImageDataUrl(null);
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

  const handleClear = () => {
    setDescription("");
    setImageDataUrl(null);
    setImageHint(null);
    setSuggestions([]);
    setError(null);
    setFileInputKey((prev) => prev + 1);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl border border-brand-red/30 bg-gradient-to-r from-brand-red/10 via-white to-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
              {lang === "en" ? "AI Lookup" : "Tra cứu AI"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
          {lang === "en"
            ? "AI HS Code Suggestion"
            : "Gợi ý mã HS bằng AI"}
            </h2>
          </div>
          <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {lang === "en" ? "Recommended" : "Nên dùng"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {lang === "en"
            ? "Use text, an image, or both. AI will suggest likely HS codes."
            : "Có thể dùng mô tả, hình ảnh, hoặc cả hai. AI sẽ gợi ý mã HS phù hợp."}
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
          key={fileInputKey}
          type="file"
          accept={SUPPORTED_IMAGE_EXTS.join(",")}
          onChange={(event) => handleImageChange(event.target.files?.[0])}
          className="block text-sm text-slate-600"
        />
        <div className="text-xs text-slate-500">
          {lang === "en"
            ? `Supported: ${SUPPORTED_IMAGE_EXTS.join(", ")} • Max ${MAX_IMAGE_SIZE_MB}MB`
            : `Hỗ trợ: ${SUPPORTED_IMAGE_EXTS.join(", ")} • Tối đa ${MAX_IMAGE_SIZE_MB}MB`}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lang === "en"
            ? "AI can be wrong. Please validate its result."
            : "AI có thể sai. Vui lòng kiểm tra lại kết quả."}
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            {lang === "en" ? "Clear" : "Xoá"}
          </button>
        </div>
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
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              {lang === "en" ? "AI Result" : "Kết quả AI"}
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              {lang === "en" ? "Matched" : "Gợi ý"}
            </span>
          </div>
          {suggestions.map((item) => (
            <div
              key={item.hs_code}
              className="block rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
