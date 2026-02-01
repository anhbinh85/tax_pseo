"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

type Props = {
  lang: "en" | "vi";
  item: {
    hs_code: string;
    name_en: string;
    name_vi: string;
    unit: string;
    vat: string | null;
    taxes: Record<string, string>;
    excise_tax?: string | null;
    export_tax?: string | null;
    export_cptpp?: string | null;
    export_ev?: string | null;
    export_ukv?: string | null;
    env_tax?: string | null;
    policy?: string | null;
  };
};

export const HsCodePdfButton = ({ lang, item }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const target = document.getElementById("hs-code-pdf-root");
      if (!target) {
        setError(
          lang === "en"
            ? "Unable to capture the report section."
            : "Không thể lấy nội dung báo cáo."
        );
        return;
      }

      target.classList.add("pdf-mode");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const sections = Array.from(
        target.querySelectorAll<HTMLElement>("[data-pdf-section]")
      );
      const elements = sections.length > 0 ? sections : [target];

      const capture = async (element: HTMLElement) =>
        html2canvas(element, {
          scale: 1.3,
          useCORS: true,
          backgroundColor: "#f8fafc",
          scrollX: 0,
          scrollY: -window.scrollY
        });

      const addWatermark = () => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setTextColor(225, 225, 225);
        doc.setFontSize(28);
        doc.setFont("DejaVu", "bold");
        doc.text("vietnamhs.info", pageWidth / 2, pageHeight / 2, {
          align: "center",
          angle: -30
        });
        doc.setTextColor(15, 23, 42);
        doc.setFont("DejaVu", "normal");
        doc.setFontSize(10);
      };

      const addCanvasWithSlicing = (canvas: HTMLCanvasElement) => {
        const scale = usableWidth / canvas.width;
        const pageHeightPx = Math.floor(usableHeight / scale);
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        const sliceCanvas = document.createElement("canvas");
        const sliceCtx = sliceCanvas.getContext("2d");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = pageHeightPx;

        for (let page = 0; page < totalPages; page += 1) {
          if (!sliceCtx) break;
          const sourceY = page * pageHeightPx;
          const sliceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
          sliceCanvas.height = sliceHeight;

          sliceCtx.clearRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          sliceCtx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const imgData = sliceCanvas.toDataURL("image/jpeg", 0.78);
          if (page > 0) doc.addPage();
          const renderHeight = sliceHeight * scale;
          doc.addImage(imgData, "JPEG", margin, margin, usableWidth, renderHeight);
          addWatermark();
        }
      };

      let cursorY = margin;
      let isFirstPage = true;

      for (const element of elements) {
        const canvas = await capture(element);
        const scale = usableWidth / canvas.width;
        const imgHeight = canvas.height * scale;
        const remaining = usableHeight - (cursorY - margin);

        if (imgHeight <= remaining) {
          if (!isFirstPage && cursorY === margin) {
            // no-op, already on a new page
          }
          const imgData = canvas.toDataURL("image/jpeg", 0.78);
          doc.addImage(imgData, "JPEG", margin, cursorY, usableWidth, imgHeight);
          addWatermark();
          cursorY += imgHeight + 12;
          isFirstPage = false;
          continue;
        }

        if (imgHeight <= usableHeight) {
          if (!isFirstPage) doc.addPage();
          const imgData = canvas.toDataURL("image/jpeg", 0.78);
          doc.addImage(imgData, "JPEG", margin, margin, usableWidth, imgHeight);
          addWatermark();
          cursorY = margin + imgHeight + 12;
          isFirstPage = false;
          continue;
        }

        if (!isFirstPage) doc.addPage();
        addCanvasWithSlicing(canvas);
        cursorY = margin;
        isFirstPage = false;
      }

      doc.save(`hs-code-${item.hs_code}.pdf`);
    } catch {
      setError(
        lang === "en"
          ? "PDF generation failed. Please try again."
          : "Tạo PDF thất bại. Vui lòng thử lại."
      );
    } finally {
      const target = document.getElementById("hs-code-pdf-root");
      target?.classList.remove("pdf-mode");
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 flex justify-start" data-html2canvas-ignore="true">
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={loading}
      >
        {loading
          ? lang === "en"
            ? "Generating..."
            : "Đang tạo..."
          : lang === "en"
            ? "Download PDF"
            : "Tải PDF"}
      </button>
      {error && (
        <span className="ml-4 text-sm text-red-600">
          {error}
        </span>
      )}
    </div>
  );
};
