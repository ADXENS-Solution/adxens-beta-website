import { getEmDashCollection, getEmDashEntry } from "emdash";

export type HelpTopicData = {
	id: string;
	slug: string | null;
	title: string;
	description?: string;
	icon?: string;
	sort_order?: number;
};

export type HelpArticleData = {
	id: string;
	slug: string | null;
	title: string;
	subtitle?: string;
	topic_slug?: string;
	search_tags?: string;
	content?: unknown;
	updatedAt?: Date;
};

export async function getHelpTopicsWithHint() {
	return getEmDashCollection("help_topics", {
		orderBy: { sort_order: "asc" },
		limit: 50,
	});
}

export async function getHelpArticles(options?: {
	topicSlug?: string;
	limit?: number;
}) {
	const where = options?.topicSlug ? { topic_slug: options.topicSlug } : undefined;
	return getEmDashCollection("help_articles", {
		orderBy: { title: "asc" },
		limit: options?.limit ?? 200,
		...(where ? { where } : {}),
	});
}

export async function getHelpArticle(slug: string) {
	return getEmDashEntry("help_articles", slug, {
		references: { topic: true, related: { limit: 8 } },
	});
}

export async function getHelpSettings() {
	return getEmDashEntry("help_settings", "main", {
		references: { popular_articles: { limit: 12 } },
	});
}

export function articlePath(slug: string | null | undefined) {
	return slug ? `/help/${slug}` : "/help";
}

export function topicPath(slug: string | null | undefined) {
	return slug ? `/help/topics/${slug}` : "/help";
}

export function formatUpdated(date: Date | string | null | undefined) {
	if (!date) return null;
	const d = typeof date === "string" ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
