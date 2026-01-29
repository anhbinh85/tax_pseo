import { headers } from "next/headers";
import { redirect } from "next/navigation";

const getPreferredLocale = () => {
  const header = headers().get("accept-language") ?? "";
  if (header.toLowerCase().includes("en")) return "en";
  return "vi";
};

export default function RootRedirectPage() {
  const locale = getPreferredLocale();
  redirect(`/${locale}`);
}

