import { SITE_URL } from "@/constants/site-constants";
import { getPosts } from "@/lib/blog/query";
import { COMMERCIAL_MODE } from "@/lib/commercial-mode";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const data = COMMERCIAL_MODE ? null : await getPosts();

	const postPages: MetadataRoute.Sitemap =
		data?.posts?.map((post) => ({
			url: `${SITE_URL}/blog/${post.slug}`,
			lastModified: new Date(post.publishedAt),
			changeFrequency: "weekly",
			priority: 0.7,
		})) ?? [];

	return [
		// High priority pages
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1.0,
		},
		...(!COMMERCIAL_MODE
			? [
					{
						url: `${SITE_URL}/roadmap`,
						lastModified: new Date(),
						changeFrequency: "weekly" as const,
						priority: 0.9,
					},
					{
						url: `${SITE_URL}/blog`,
						lastModified: new Date(),
						changeFrequency: "weekly" as const,
						priority: 0.8,
					},
					{
						url: `${SITE_URL}/contributors`,
						lastModified: new Date(),
						changeFrequency: "daily" as const,
						priority: 0.6,
					},
				]
			: []),

		// Legal / low priority
		{
			url: `${SITE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${SITE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 0.3,
		},

		// Blog posts
		...postPages,
	];
}
