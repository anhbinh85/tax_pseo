import { getAllHscodes, getChapterCodes, hasHscodeData } from "@/lib/hscode";
import { getUsHtsChapterCodes } from "@/lib/hts-chapters";
import { hasUsHtsData, getAllUsHtsSlugs } from "@/lib/us-data";
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/vi`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/en`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/us-hts`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/vi/disclaimer`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/en/disclaimer`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/vi/contact`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/en/contact`,
      lastModified: new Date()
    }
  ];

  if (hasUsHtsData()) {
    const usSlugs = getAllUsHtsSlugs();
    usSlugs.forEach((slug) => {
      entries.push({
        url: `${siteUrl}/us-hts/${slug}`,
        lastModified: new Date()
      });
    });
    getUsHtsChapterCodes().forEach((chapter) => {
      entries.push({
        url: `${siteUrl}/us-hts/chapter/${chapter}`,
        lastModified: new Date()
      });
    });
  }

  if (!hasHscodeData()) return entries;

  const data = getAllHscodes();
  const chapters = getChapterCodes();

  chapters.forEach((chapter) => {
    entries.push(
      {
        url: `${siteUrl}/vi/chapter/${chapter}`,
        lastModified: new Date()
      },
      {
        url: `${siteUrl}/en/chapter/${chapter}`,
        lastModified: new Date()
      }
    );
  });

  data.forEach((item) => {
    entries.push(
      {
        url: `${siteUrl}/vi/hs-code/${item.slug}`,
        lastModified: new Date()
      },
      {
        url: `${siteUrl}/en/hs-code/${item.slug}`,
        lastModified: new Date()
      }
    );
  });

  return entries;
}
