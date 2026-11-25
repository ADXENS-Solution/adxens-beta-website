import type { APIRoute } from "astro";
import { resolveSiteOrigin } from "../lib/seo";

export const GET: APIRoute = ({ site, url }) => {
	const origin = resolveSiteOrigin(site ?? url);
	const body = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /_emdash/",
		"Disallow: /search",
		"",
		`Sitemap: ${origin}/sitemap.xml`,
		"",
	].join("\n");

	return new Response(body, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
