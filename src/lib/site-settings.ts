import { getEmDashEntry } from "emdash";

export type AdxensSiteSettings = {
	phone: string;
	phoneHref: string;
	email: string;
	whatsappUrl: string;
	telegramUrl: string;
	betaBadge: string;
	ctaLabel: string;
};

const defaults: AdxensSiteSettings = {
	phone: "+1 251-332-1053",
	phoneHref: "tel:+12513321053",
	email: "contact@adxens.com",
	whatsappUrl: "https://wa.me/message/4LJX46RLL52CG1",
	telegramUrl: "https://t.me/Adxens_Media",
	betaBadge: "Adxens V2- Private Beta • 35 spots",
	ctaLabel: "Request Early Access",
};

export async function getAdxensSiteSettings(): Promise<AdxensSiteSettings> {
	const { entry } = await getEmDashEntry("site_settings", "main");
	if (!entry) return defaults;
	const d = entry.data;
	return {
		phone: d.phone || defaults.phone,
		phoneHref: d.phone_href || defaults.phoneHref,
		email: d.email || defaults.email,
		whatsappUrl: d.whatsapp_url || defaults.whatsappUrl,
		telegramUrl: d.telegram_url || defaults.telegramUrl,
		betaBadge: d.beta_badge || defaults.betaBadge,
		ctaLabel: d.cta_label || defaults.ctaLabel,
	};
}

export async function getFaqItems(): Promise<{ question: string; answer: string }[]> {
	const { entry } = await getEmDashEntry("site_settings", "main");
	const rows = entry?.data?.faq_items;
	if (!Array.isArray(rows)) return [];
	return rows
		.map((item) => ({
			question: typeof item?.question === "string" ? item.question : "",
			answer: typeof item?.answer === "string" ? item.answer : "",
		}))
		.filter((item) => item.question && item.answer);
}
