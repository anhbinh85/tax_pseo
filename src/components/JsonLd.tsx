/**
 * Renders JSON-LD structured data for SEO (WebPage, BreadcrumbList, etc.).
 */
type Props = { data: object };

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

export function webPageWithBreadcrumb(
  name: string,
  description: string,
  path: string,
  breadcrumbs: Array<{ name: string; path: string }>
) {
  const url = `${siteUrl}${path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: breadcrumbs.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${siteUrl}${item.path}`,
        })),
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vietnam HS & US HTS Import Duty Lookup",
    url: siteUrl,
    description: "Search Vietnam HS codes and US HTS import duties. Compare rates by origin.",
  };
}
