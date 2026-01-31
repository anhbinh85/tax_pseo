"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, User, MessageSquare } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export const ContactForm = () => {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const siteKey = useMemo(
    () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    []
  );
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (!siteKey) return;
    if (document.getElementById("turnstile-script")) {
      return;
    }
    const script = document.createElement("script");
    script.id = "turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;
    const interval = window.setInterval(() => {
      if (!window.turnstile) return;
      if (widgetId) return;
      const id = window.turnstile.render("#turnstile-widget", {
        sitekey: siteKey,
        theme: "dark",
        callback: (value: string) => setToken(value),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null)
      });
      setWidgetId(String(id));
      window.clearInterval(interval);
    }, 200);

    return () => window.clearInterval(interval);
  }, [siteKey, widgetId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    if (!token) {
      setState("error");
      setError("Please complete the verification.");
      return;
    }

    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
      company: String(formData.get("company") || ""),
      turnstileToken: token
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to send message.");
      }

      form.reset();
      setState("success");
      if (widgetId && window.turnstile) {
        window.turnstile.reset(widgetId);
      }
      setToken(null);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Unable to send message.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <User className="h-4 w-4 text-brand-gold" />
            Your name
          </span>
          <input
            required
            name="name"
            placeholder="Nguyen Van A"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-brand-gold focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <Mail className="h-4 w-4 text-brand-gold" />
            Work email
          </span>
          <input
            required
            type="email"
            name="email"
            placeholder="you@company.com"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-brand-gold focus:outline-none"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            onInvalid={(event) => {
              event.currentTarget.setCustomValidity(
                "Please enter a valid email address."
              );
            }}
            onInput={(event) => {
              event.currentTarget.setCustomValidity("");
            }}
          />
        {!emailValid && (
          <span className="text-xs text-amber-300">
            Please enter a valid email address to continue.
          </span>
        )}
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm text-slate-200">
        <span className="flex items-center gap-2 font-semibold uppercase tracking-wide">
          <MessageSquare className="h-4 w-4 text-brand-gold" />
          Message
        </span>
        <textarea
          required
          name="message"
          rows={5}
          placeholder="Tell us about your import needs or questions."
          disabled={!emailValid}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-brand-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-h-[65px]">
          {siteKey ? (
            <div id="turnstile-widget" />
          ) : (
            <div className="rounded-lg border border-amber-700/40 bg-amber-900/40 px-3 py-2 text-xs text-amber-200">
              Turnstile is not configured. Please set
              {" "}
              NEXT_PUBLIC_TURNSTILE_SITE_KEY.
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400">
          We never display your email publicly. Messages are sent securely.
        </p>
        <button
          type="submit"
          disabled={state === "loading" || !siteKey || !emailValid}
          className="inline-flex items-center justify-center rounded-xl bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-600"
        >
          {state === "loading" ? "Sending..." : "Send message"}
        </button>
      </div>

      {state === "success" && (
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-200">
          Thanks! Your message has been sent. We will reply soon.
        </div>
      )}
      {state === "error" && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/40 px-4 py-3 text-sm text-red-200">
          {error || "Unable to send message."}
        </div>
      )}
    </form>
  );
};
