import type { APIRoute } from "astro";
import { getAdxensSiteSettings, getFaqItems } from "../lib/site-settings";
import { DEFAULT_HOME_DESCRIPTION, resolveSiteOrigin } from "../lib/seo";

export const GET: APIRoute = async ({ site, url }) => {
	const origin = resolveSiteOrigin(site ?? url);
	const [settings, faqItems] = await Promise.all([getAdxensSiteSettings(), getFaqItems()]);

	const lines = [
		"# Adxens",
		"",
		"> Adxens helps media buyers and agencies run ad operations with clearer accounts, budgets, and funding.",
		"",
		DEFAULT_HOME_DESCRIPTION,
		"",
		"## Product",
		"",
		"- Adxens V2 private beta: real-time platform for Meta agency ad accounts, balance, team roles, and multi-channel funding",
		"- Beta capacity: 35 testers",
		"- Beta scope: Meta only during private beta (Google, TikTok, and others planned later)",
		`- Contact: ${settings.email} · ${settings.phone}`,
		`- WhatsApp: ${settings.whatsappUrl}`,
		`- Telegram: ${settings.telegramUrl}`,
		"",
		"## Pages",
		"",
		`- [Home](${origin}/): Product overview, beta benefits, process, FAQ, apply CTA`,
		`- [FAQ](${origin}/#faq): Common questions about the private beta`,
		`- [Apply](${origin}/#apply): Request early access`,
		`- [Terms and conditions](${origin}/terms-and-conditions)`,
		`- [Privacy policy](${origin}/privacy-policy)`,
		"",
	];

	if (faqItems.length > 0) {
		lines.push("## FAQ", "");
		for (const item of faqItems) {
			lines.push(`### ${item.question}`, "", item.answer, "");
		}
	}

	return new Response(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=300",
		},
	});
};
