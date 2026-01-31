"use client";

import { useEffect, useMemo, useState } from "react";

type RateOption = {
  key: string;
  label: string;
  value: number;
};

type TaxProps = {
  lang: "en" | "vi";
  rates: {
    mfn: number;
    formE: number;
    formD: number;
    vat: number;
    excise: number;
    env: number;
    importOptions?: Record<string, number>;
    exportOptions?: Record<string, number>;
  };
};

const importLabelsEn: Record<string, string> = {
  mfn: "MFN",
  nk_tt: "NK TT (Normal Import)",
  form_e: "ACFTA (Form E)",
  form_d: "ATIGA (Form D)",
  ajcep: "AJCEP",
  vjepa: "VJEPA",
  akfta: "AKFTA",
  aanzfta: "AANZFTA",
  aifta: "AIFTA",
  vkfta: "VKFTA",
  vcfta: "VCFTA",
  vn_eaeu: "VN-EAEU",
  cptpp: "CPTPP",
  ahkfta: "AHKFTA",
  vncu: "VNCU",
  eur1: "EVFTA",
  ukv: "UKVFTA",
  vn_lao: "VN-LAO",
  vifta: "VIFTA",
  rcept: "RCEPT"
};

const importLabelsVi: Record<string, string> = {
  mfn: "MFN",
  nk_tt: "NK TT (Nhập khẩu thông thường)",
  form_e: "ACFTA (Form E)",
  form_d: "ATIGA (Form D)",
  ajcep: "AJCEP",
  vjepa: "VJEPA",
  akfta: "AKFTA",
  aanzfta: "AANZFTA",
  aifta: "AIFTA",
  vkfta: "VKFTA",
  vcfta: "VCFTA",
  vn_eaeu: "VN-EAEU",
  cptpp: "CPTPP",
  ahkfta: "AHKFTA",
  vncu: "VNCU",
  eur1: "EVFTA",
  ukv: "UKVFTA",
  vn_lao: "VN-LAO",
  vifta: "VIFTA",
  rcept: "RCEPT"
};

const exportLabels: Record<string, string> = {
  xk: "Export (XK)",
  xk_cptpp: "XK CPTPP",
  xk_ev: "XK EVFTA",
  xk_ukv: "XK UKVFTA"
};

const numberOrZero = (value: number) => (Number.isFinite(value) ? value : 0);

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0
  }).format(Math.round(value));

const formatPercent = (value: number) =>
  `${Number.isFinite(value) ? value : 0}%`;

const computeImport = (
  tgtt: number,
  tsNk: number,
  tsTtdb: number,
  tsTbh: number,
  tsBvmt: number,
  qty: number,
  tsVat: number
) => {
  const nkRate = tsNk / 100;
  const ttdbRate = tsTtdb / 100;
  const tbhRate = tsTbh / 100;
  const vatRate = tsVat / 100;
  const tnk = tgtt * nkRate;
  const tbh = tgtt * tbhRate;
  const tttdb = (tgtt + tnk) * ttdbRate;
  const tbvmt = qty * tsBvmt;
  const vat = (tgtt + tnk + tttdb + tbh + tbvmt) * vatRate;
  const total = tnk + tbh + tttdb + tbvmt + vat;
  return { tnk, tbh, tttdb, tbvmt, vat, total };
};

const computeExport = (tgtt: number, tsXk: number, tsBvmt: number, qty: number) => {
  const xkRate = tsXk / 100;
  const txk = tgtt * xkRate;
  const tbvmt = qty * tsBvmt;
  const total = txk + tbvmt;
  return { txk, tbvmt, total };
};

export const DeepTaxCalculator = ({ lang, rates }: TaxProps) => {
  const [fxRate, setFxRate] = useState(25000);
  const [cifUsd, setCifUsd] = useState(1000);
  const [qty, setQty] = useState(1);
  const [safeguard, setSafeguard] = useState(0);
  const [excise, setExcise] = useState(rates.excise || 0);
  const [env, setEnv] = useState(rates.env || 0);
  const [vat, setVat] = useState(rates.vat || 0);

  const importOptions = useMemo<RateOption[]>(() => {
    const base: Record<string, number> = {
      mfn: numberOrZero(rates.mfn),
      nk_tt: numberOrZero(rates.importOptions?.nk_tt ?? 0),
      form_e: numberOrZero(rates.formE),
      form_d: numberOrZero(rates.formD)
    };
    const merged = { ...base, ...(rates.importOptions ?? {}) };
    return Object.entries(merged)
      .filter(([, value]) => Number.isFinite(value))
      .map(([key, value]) => ({
        key,
        label:
          (lang === "en" ? importLabelsEn[key] : importLabelsVi[key]) ??
          key.toUpperCase(),
        value
      }));
  }, [lang, rates]);

  const exportOptions = useMemo<RateOption[]>(() => {
    const merged = {
      xk: rates.exportOptions?.xk ?? 0,
      xk_cptpp: rates.exportOptions?.xk_cptpp ?? 0,
      xk_ev: rates.exportOptions?.xk_ev ?? 0,
      xk_ukv: rates.exportOptions?.xk_ukv ?? 0
    };
    return Object.entries(merged)
      .filter(([, value]) => Number.isFinite(value))
      .map(([key, value]) => ({
        key,
        label: exportLabels[key] ?? key.toUpperCase(),
        value: numberOrZero(value)
      }));
  }, [rates.exportOptions]);

  const [importCols, setImportCols] = useState(() => {
    const defaults = importOptions.slice(0, 3);
    return defaults.map((option) => ({
      key: option?.key ?? "mfn",
      label: option?.label ?? "MFN",
      rate: option?.value ?? 0
    }));
  });

  const [exportCols, setExportCols] = useState(() => {
    const defaults = exportOptions.slice(0, 3);
    return defaults.map((option) => ({
      key: option?.key ?? "xk",
      label: option?.label ?? "XK",
      rate: option?.value ?? 0
    }));
  });

  useEffect(() => {
    const sync = (options: RateOption[], setter: typeof setImportCols) => {
      if (options.length === 0) return;
      setter((current) =>
        current.map((col) => {
          const matched = options.find((option) => option.key === col.key);
          if (!matched) return col;
          return { ...col, label: matched.label, rate: matched.value };
        })
      );
    };
    sync(importOptions, setImportCols);
    sync(exportOptions, setExportCols);
  }, [importOptions, exportOptions]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = (await response.json()) as { rates?: { VND?: number } };
        if (data?.rates?.VND) {
          setFxRate(Math.round(data.rates.VND));
        }
      } catch {
        // ignore, keep default
      }
    };
    fetchRate();
  }, []);

  const tgtt = cifUsd * qty * fxRate;

  const importResults = importCols.map((col) => ({
    ...col,
    calc: computeImport(tgtt, col.rate, excise, safeguard, env, qty, vat)
  }));

  const exportResults = exportCols.map((col) => ({
    ...col,
    calc: computeExport(tgtt, col.rate, env, qty)
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {lang === "en" ? "Deep Tax Calculator" : "Tính thuế dự kiến"}
        </h2>
        <p className="text-sm text-slate-600">
          {lang === "en"
            ? "Waterfall calculation shows tax-on-tax effects for import and export."
            : "Tính theo trình tự để thấy rõ hiệu ứng thuế chồng thuế cho nhập và xuất."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en"
            ? "CIF/FOB Unit Value (USD)"
            : "Trị giá CIF/FOB 1 đơn vị (USD)"}
          <input
            type="number"
            min={0}
            value={cifUsd}
            onChange={(event) => setCifUsd(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "USD → VND Rate" : "Tỷ giá USD → VND"}
          <input
            type="number"
            min={0}
            value={fxRate}
            onChange={(event) => setFxRate(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "Quantity (Q)" : "Số lượng (Q)"}
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(event) => setQty(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "Safeguard Tax (%)" : "Thuế tự vệ (%)"}
          <input
            type="number"
            min={0}
            value={safeguard}
            onChange={(event) => setSafeguard(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "Excise Rate (%)" : "Thuế TTĐB (%)"}
          <input
            type="number"
            min={0}
            value={excise}
            onChange={(event) => setExcise(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "Env Tax (VND/unit)" : "Thuế BVMT (VND/đv)"}
          <input
            type="number"
            min={0}
            value={env}
            onChange={(event) => setEnv(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-700">
          {lang === "en" ? "VAT (%)" : "VAT (%)"}
          <input
            type="number"
            min={0}
            value={vat}
            onChange={(event) => setVat(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {lang === "en"
          ? `Taxable value (VND) = ${formatVnd(tgtt)}`
          : `Trị giá tính thuế (VND) = ${formatVnd(tgtt)}`}
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-900">
          {lang === "en" ? "Import Scenario" : "Thuế nhập khẩu dự kiến"}
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {importResults.map((col, idx) => (
            <div key={`${col.key}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={col.key}
                  onChange={(event) => {
                    const nextKey = event.target.value;
                    const option = importOptions.find((o) => o.key === nextKey);
                    setImportCols((current) =>
                      current.map((item, index) =>
                        index === idx
                          ? {
                              key: nextKey,
                              label: option?.label ?? nextKey.toUpperCase(),
                              rate: option?.value ?? item.rate
                            }
                          : item
                      )
                    );
                  }}
                >
                  {importOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={col.rate}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setImportCols((current) =>
                      current.map((item, index) =>
                        index === idx ? { ...item, rate: value } : item
                      )
                    );
                  }}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Import Duty" : "TNK"}</span>
                  <span>{formatVnd(col.calc.tnk)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Safeguard Tax" : "TBH"}</span>
                  <span>{formatVnd(col.calc.tbh)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Excise Tax" : "TTTĐB"}</span>
                  <span>{formatVnd(col.calc.tttdb)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Env Tax" : "TBVMT"}</span>
                  <span>{formatVnd(col.calc.tbvmt)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "en" ? "VAT" : "VAT"}</span>
                  <span>{formatVnd(col.calc.vat)} đ</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                  <span>{lang === "en" ? "Total Tax" : "Tổng thuế"}</span>
                  <span>{formatVnd(col.calc.total)} đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-slate-900">
          {lang === "en" ? "Export Scenario" : "Thuế xuất khẩu dự kiến"}
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {exportResults.map((col, idx) => (
            <div key={`${col.key}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <select
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={col.key}
                  onChange={(event) => {
                    const nextKey = event.target.value;
                    const option = exportOptions.find((o) => o.key === nextKey);
                    setExportCols((current) =>
                      current.map((item, index) =>
                        index === idx
                          ? {
                              key: nextKey,
                              label: option?.label ?? nextKey.toUpperCase(),
                              rate: option?.value ?? item.rate
                            }
                          : item
                      )
                    );
                  }}
                >
                  {exportOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={col.rate}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setExportCols((current) =>
                      current.map((item, index) =>
                        index === idx ? { ...item, rate: value } : item
                      )
                    );
                  }}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Export Duty" : "TXK"}</span>
                  <span>{formatVnd(col.calc.txk)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === "en" ? "Env Tax" : "TBVMT"}</span>
                  <span>{formatVnd(col.calc.tbvmt)} đ</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                  <span>{lang === "en" ? "Total Tax" : "Tổng thuế"}</span>
                  <span>{formatVnd(col.calc.total)} đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
