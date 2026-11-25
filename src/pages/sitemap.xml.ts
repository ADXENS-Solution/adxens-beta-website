import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash";
import { resolveSiteOrigin } from "../lib/seo";

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export const GET: APIRoute = async ({ site, url }) => {
	const origin = resolveSiteOrigin(site ?? url);
	const urls: { loc: string; lastmod?: string; priority?: string }[] = [
		{ loc: `${origin}/`, priority: "1.0" },
		{ loc: `${origin}/help`, priority: "0.9" },
	];

	try {
		const { entries } = await getEmDashCollection("pages", { status: "published" });
		for (const entry of entries) {
			const slug = entry.data.slug;
			if (!slug || typeof slug !== "string") continue;
			// Skip non-routable leftover pages; legal docs live at /{slug}
			if (slug !== "privacy-policy" && slug !== "terms-and-conditions") continue;
			const lastmod =
				entry.data.updatedAt instanceof Date
					? entry.data.updatedAt.toISOString()
					: typeof entry.data.updatedAt === "string"
						? entry.data.updatedAt
						: undefined;
			urls.push({
				loc: `${origin}/${slug}`,
				lastmod,
				priority: "0.7",
			});
		}
	} catch {
		urls.push(
			{ loc: `${origin}/privacy-policy`, priority: "0.7" },
			{ loc: `${origin}/terms-and-conditions`, priority: "0.7" },
		);
	}

	try {
		const { entries: topics } = await getEmDashCollection("help_topics", {
			status: "published",
			limit: 100,
		});
		for (const topic of topics) {
			urls.push({
				loc: `${origin}/help/topics/${topic.id}`,
				priority: "0.8",
			});
		}
		const { entries: articles } = await getEmDashCollection("help_articles", {
			status: "published",
			limit: 500,
		});
		for (const article of articles) {
			const lastmod =
				article.data.updatedAt instanceof Date
					? article.data.updatedAt.toISOString()
					: undefined;
			urls.push({
				loc: `${origin}/help/${article.id}`,
				lastmod,
				priority: "0.7",
			});
		}
	} catch {
		// Help collections may not exist yet on older DBs
	}

	const body = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		...urls.map((item) => {
			const parts = [`  <url>`, `    <loc>${escapeXml(item.loc)}</loc>`];
			if (item.lastmod) parts.push(`    <lastmod>${escapeXml(item.lastmod)}</lastmod>`);
			if (item.priority) parts.push(`    <priority>${item.priority}</priority>`);
			parts.push(`  </url>`);
			return parts.join("\n");
		}),
		`</urlset>`,
		``,
	].join("\n");

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
};
