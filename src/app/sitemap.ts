import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betweenussupport.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/blog`, lastModified: new Date() },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
    })),
    { url: `${SITE_URL}/resources`, lastModified: new Date() },
    { url: `${SITE_URL}/guidelines`, lastModified: new Date() },
    { url: `${SITE_URL}/privacy`, lastModified: new Date() },
    { url: `${SITE_URL}/terms`, lastModified: new Date() },
  ];
}
