import { safeJsonLdSerialize } from "emdash/page";
import type { AdxensSiteSettings } from "./site-settings";

export const DEFAULT_SITE_TITLE = "Adxens";
export const DEFAULT_HOME_TITLE = "Adxens — Make ad operation feel less like work";
export const DEFAULT_HOME_DESCRIPTION =
	"Join the Adxens V2 beta for media buyers and agencies. Keep accounts, budgets, and funding clearer, and shape what comes next.";

export const LEGAL_DEFAULTS = {
	"privacy-policy": {
		title: "Privacy policy",
		description: "How Adxens Group collects, uses, stores, and protects personal information.",
	},
	"terms-and-conditions": {
		title: "Terms and conditions",
		description: "Terms and conditions for using the Adxens Group platform and services.",
	},
} as const;

/** Public origin for canonicals, OG, JSON-LD, sitemap. Prefer env over request host. */
export function resolveSiteOrigin(fallback?: string | URL): string {
	const fromEnv =
		process.env.EMDASH_SITE_URL?.trim() ||
		process.env.SITE_URL?.trim() ||
		process.env.PUBLIC_SITE_URL?.trim();
	if (fromEnv) {
		try {
			return new URL(fromEnv).origin;
		} catch {
			/* fall through */
		}
	}
	if (fallback instanceof URL) return fallback.origin;
	if (typeof fallback === "string" && fallback) {
		try {
			return new URL(fallback).origin;
		} catch {
			return fallback.replace(/\/$/, "");
		}
	}
	return "http://127.0.0.1:4321";
}

export function absoluteUrl(path: string, origin: string): string {
	return new URL(path.startsWith("/") ? path : `/${path}`, origin).href;
}

export type FaqItem = { question: string; answer: string };

export function buildHomeJsonLd(opts: {
	origin: string;
	title: string;
	description: string;
	settings: AdxensSiteSettings;
	faqItems: FaqItem[];
}): string {
	const { origin, title, description, settings, faqItems } = opts;
	// EmDashHead already emits WebSite at `${origin}/#website` — extend it with
	// Organization (publisher target), WebPage, and FAQPage only.
	const orgId = `${origin}/#organization`;
	const websiteId = `${origin}/#website`;
	const webpageId = `${origin}/#webpage`;

	const graph: Record<string, unknown>[] = [
		{
			"@type": "Organization",
			"@id": orgId,
			name: "Adxens",
			url: origin,
			logo: absoluteUrl("/adxens-logo.png", origin),
			email: settings.email,
			telephone: settings.phone,
			sameAs: [settings.whatsappUrl, settings.telegramUrl].filter(Boolean),
			contactPoint: [
				{
					"@type": "ContactPoint",
					contactType: "customer support",
					email: settings.email,
					telephone: settings.phone,
				},
			],
		},
		{
			"@type": "WebPage",
			"@id": webpageId,
			url: origin,
			name: title,
			description,
			isPartOf: { "@id": websiteId },
			about: { "@id": orgId },
			inLanguage: "en-US",
		},
	];

	if (faqItems.length > 0) {
		graph.push({
			"@type": "FAQPage",
			"@id": `${origin}/#faq`,
			url: `${origin}/#faq`,
			isPartOf: { "@id": webpageId },
			mainEntity: faqItems.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: item.answer,
				},
			})),
		});
	}

	return safeJsonLdSerialize({
		"@context": "https://schema.org",
		"@graph": graph,
	});
}

export function buildWebPageJsonLd(opts: {
	origin: string;
	path: string;
	name: string;
	description?: string | null;
	dateModified?: string | null;
}): string {
	const url = absoluteUrl(opts.path, opts.origin);
	const node: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${url}#webpage`,
		url,
		name: opts.name,
		isPartOf: { "@id": `${opts.origin}/#website` },
		inLanguage: "en-US",
	};
	if (opts.description) node.description = opts.description;
	if (opts.dateModified) node.dateModified = opts.dateModified;
	return safeJsonLdSerialize(node);
}
