/* eslint-disable no-console */
const baseUrl = "https://www.vietnamhs.info";

const fetchText = async (url) => {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  return { status: res.status, url: res.url, text };
};

const getTag = (html, regex) => {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
};

const parseHtml = (html) => ({
  title: getTag(html, /<title>([^<]+)<\/title>/i),
  description: getTag(
    html,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i
  ),
  canonical: getTag(
    html,
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i
  ),
  robots: getTag(
    html,
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["'][^>]*>/i
  ),
  hreflang: Array.from(
    html.matchAll(
      /<link\s+rel=["']alternate["']\s+hreflang=["']([^"']+)["']\s+href=["']([^"']+)["'][^>]*>/gi
    )
  ).map((match) => ({ lang: match[1], href: match[2] })),
  jsonLd: /application\/ld\+json/i.test(html)
});

const logPage = (label, info, parsed) => {
  console.log(`\n== ${label} ==`);
  console.log(`Status: ${info.status}`);
  console.log(`Final URL: ${info.url}`);
  console.log(`Title: ${parsed.title ?? "MISSING"}`);
  console.log(`Description: ${parsed.description ?? "MISSING"}`);
  console.log(`Canonical: ${parsed.canonical ?? "MISSING"}`);
  console.log(`Robots: ${parsed.robots ?? "MISSING"}`);
  console.log(`Hreflang count: ${parsed.hreflang.length}`);
  console.log(`JSON-LD: ${parsed.jsonLd ? "YES" : "NO"}`);
};

const parseSitemapUrls = (xml) =>
  Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());

const main = async () => {
  console.log(`Base: ${baseUrl}`);

  // Basic pages
  const home = await fetchText(baseUrl);
  logPage("Home (base)", home, parseHtml(home.text));

  const vi = await fetchText(`${baseUrl}/vi`);
  logPage("Home (vi)", vi, parseHtml(vi.text));

  const en = await fetchText(`${baseUrl}/en`);
  logPage("Home (en)", en, parseHtml(en.text));

  // Sitemap
  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
  console.log(`\n== Sitemap ==`);
  console.log(`Status: ${sitemap.status}`);
  const urls = parseSitemapUrls(sitemap.text);
  console.log(`URL count: ${urls.length}`);
  const sample = urls.slice(0, 3);
  console.log(`Sample URLs:\n- ${sample.join("\n- ")}`);

  // Detail page sample (first hs-code in sitemap)
  const hsUrl = urls.find((url) => url.includes("/hs-code/"));
  if (hsUrl) {
    const detail = await fetchText(hsUrl);
    logPage("HS Detail", detail, parseHtml(detail.text));
  } else {
    console.log("No hs-code URL found in sitemap.");
  }

  // Robots
  const robots = await fetchText(`${baseUrl}/robots.txt`);
  console.log(`\n== Robots ==`);
  console.log(`Status: ${robots.status}`);
  console.log(robots.text.split("\n").slice(0, 10).join("\n"));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
