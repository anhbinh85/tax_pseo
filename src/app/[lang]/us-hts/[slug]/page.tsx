import { redirect } from "next/navigation";

type PageProps = {
  params: { lang: string; slug: string };
};

export default function LangUsHtsSlugRedirect({ params }: PageProps) {
  redirect(`/us-hts/${params.slug}`);
}
