import { getTotalUrlCount, ITEMS_PER_SITEMAP } from "@/app/sitemap";
import { SITE_CONFIG } from "@/config/site";

/** Serves sitemap index at /sitemap.xml (Next.js 14 does not auto-generate it when using generateSitemaps). */
export async function GET() {
  const total = getTotalUrlCount();
  const totalChunks = Math.max(1, Math.ceil(total / ITEMS_PER_SITEMAP));
  const domain = SITE_CONFIG.domain;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: totalChunks }, (_, i) => `  <sitemap>
    <loc>${domain}/sitemap/${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
