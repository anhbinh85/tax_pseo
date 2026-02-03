import { redirect } from "next/navigation";

type PageProps = {
  params: { lang: string };
  searchParams: { q?: string };
};

export default function LangUsHtsIndexRedirect({
  searchParams,
}: PageProps) {
  const q = searchParams?.q?.trim();
  const base = "/us-hts";
  if (q) {
    const slug = (q ?? "")
      .toString()
      .replace(/[\s.]/g, "")
      .replace(/\D/g, "")
      .slice(0, 10);
    if (slug.length === 4 || slug.length === 6 || slug.length === 8 || slug.length === 10) {
      redirect(`${base}/${slug}`);
    }
  }
  redirect(base);
}
