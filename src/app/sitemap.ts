import { getAllHscodes, getChapterCodes, hasHscodeData } from "@/lib/hscode";
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/vi`,
      lastModified: new Date()
    },
    {
      url: `${siteUrl}/en`,
      lastModified: new Date()
    }
  ];

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
