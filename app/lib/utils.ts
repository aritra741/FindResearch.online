import { distance } from "fastest-levenshtein";
import { Article, ExtractedFeatures, RankingFactors } from "./types";
import axios from "axios";

export const cleanAbstract = (abstract: string): string => {
  let cleaned = abstract.replace(/<\/?jats:\w+(?:\s+[^>]*)?>/g, "");
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, "");
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return cleaned.trim();
};

export const fuzzyTitleMatch = (
  searchTitle: string,
  articleTitle: string,
  threshold: number = 0.8
): boolean => {
  const searchWords = searchTitle.toLowerCase().split(/\s+/);
  const articleWords = articleTitle.toLowerCase().split(/\s+/);

  let matchCount = 0;
  for (const searchWord of searchWords) {
    for (const articleWord of articleWords) {
      const similarity =
        1 -
        distance(searchWord, articleWord) /
          Math.max(searchWord.length, articleWord.length);
      if (similarity >= threshold) {
        matchCount++;
        break;
      }
    }
  }

  return matchCount / searchWords.length >= threshold;
};

export const calculateRankingScore = (factors: RankingFactors): number => {
  const currentYear = new Date().getFullYear();
  const yearsSincePublication =
    currentYear - factors.publicationDate.getFullYear();

  const relevanceWeight = 0.4;
  const citationWeight = 0.3;
  const recencyWeight = 0.2;
  const exactMatchWeight = 0.1;

  const normalizedCitations =
    Math.log(factors.citationCount + 1) / Math.log(1000);
  const recencyScore = Math.max(0, 1 - yearsSincePublication / 10);

  return (
    factors.relevanceScore * relevanceWeight +
    normalizedCitations * citationWeight +
    recencyScore * recencyWeight +
    (factors.isExactMatch ? 1 : 0) * exactMatchWeight
  );
};

export const removeDuplicates = (articles: Article[]): Article[] => {
  const uniqueArticles = new Map<string, Article>();
  articles.forEach((article) => {
    const key =
      article.doi !== "No DOI available" ? article.doi : article.title;
    if (
      !uniqueArticles.has(key) ||
      article.citationCount > (uniqueArticles.get(key)?.citationCount ?? 0)
    ) {
      uniqueArticles.set(key, article);
    }
  });
  return Array.from(uniqueArticles.values());
};

export const citationCache: {
  [doi: string]: { count: number; timestamp: number };
} = {};

export const getCachedCitationCount = (doi: string): number | null => {
  const cached = citationCache[doi];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.count;
  }
  return null;
};

export const setCachedCitationCount = (doi: string, count: number) => {
  citationCache[doi] = { count, timestamp: Date.now() };
};

export async function extractFeaturesFromAbstract(
  abstract: string
): Promise<ExtractedFeatures> {
  try {
    const response = await axios.post<ExtractedFeatures>("/api/insights", {
      abstract,
    });
    return response.data;
  } catch (error) {
    console.error("Error extracting features:", error);
    throw new Error("Failed to extract features from the abstract");
  }
}
