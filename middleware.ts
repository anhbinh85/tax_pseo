import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["vi", "en"];

const getPreferredLocale = (request: NextRequest) => {
  const header = request.headers.get("accept-language") ?? "";
  if (header.toLowerCase().includes("en")) return "en";
  return "vi";
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname === "/") {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  // US HTS pages are locale-agnostic (English)
  if (pathname.startsWith("/us-hts")) {
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  const hasLocale = LOCALES.some((locale) => pathname.startsWith(`/${locale}`));
  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/vi${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
};

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"]
};
