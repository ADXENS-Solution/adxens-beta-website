import { getEmDashCollection, getEmDashEntry } from "emdash";

export type HelpTopicData = {
  id: string;
  slug: string | null;
  title: string;
  description?: string;
  icon?: string;
};

export type HelpArticleData = {
  id: string;
  slug: string | null;
  title: string;
  subtitle?: string;
  content?: unknown;
  updatedAt?: Date;
};

export async function getHelpTopicsWithHint() {
  return getEmDashCollection("help_topics", {
    orderBy: { title: "asc" },
    limit: 50,
  });
}

export async function getHelpArticles(options?: {
  topicSlug?: string;
  limit?: number;
}) {
  const result = await getEmDashCollection("help_articles", {
    orderBy: { title: "asc" },
    limit: options?.limit ?? 200,
  });

  if (!options?.topicSlug) return result;

  const resolved = await Promise.all(
    result.entries.map(async (article) => {
      const { entry } = await getEmDashEntry("help_articles", article.id, {
        references: { topic: true },
      });
      return entry;
    }),
  );

  const entries = resolved.filter(
    (article): article is NonNullable<typeof article> =>
      Boolean(article) &&
      article?.references?.topic?.entries?.[0]?.id === options.topicSlug,
  );

  return { ...result, entries };
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

export function articleTopicSlug(
  article:
    | {
        references?: { topic?: { entries?: { id: string }[] } };
      }
    | null
    | undefined,
) {
  return article?.references?.topic?.entries?.[0]?.id ?? "";
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
