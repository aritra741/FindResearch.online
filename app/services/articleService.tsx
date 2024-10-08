import { isAfter, isBefore, isValid, parse, parseISO } from "date-fns";
import {
  fetchArxivArticles,
  fetchCoreArticles,
  fetchCrossrefArticles,
  fetchPapersWithCodeArticles,
} from "../lib/api";
import { Article, EnhancedArticle, SortOption } from "../lib/types";

const k1 = 1.2;
const b = 0.75;

interface CorpusStats {
  docCount: number;
  avgDocLength: number;
  termFrequency: { [term: string]: number };
}

function calculateBM25Score(
  article: Article,
  searchTerms: string[],
  corpusStats: CorpusStats
): number {
  const doc = article.title + " " + article.abstract;
  const docLength = doc.split(/\s+/).length;

  return searchTerms.reduce((score, term) => {
    const tf = (doc.match(new RegExp(term, "gi")) || []).length;
    const idf = Math.log(
      (corpusStats.docCount - corpusStats.termFrequency[term] + 0.5) /
        (corpusStats.termFrequency[term] + 0.5) +
        1
    );
    const numerator = tf * (k1 + 1);
    const denominator =
      tf + k1 * (1 - b + b * (docLength / corpusStats.avgDocLength));
    return score + idf * (numerator / denominator);
  }, 0);
}

function getCorpusStats(
  articles: Article[],
  searchTerms: string[]
): CorpusStats {
  let totalLength = 0;
  const termFrequency: { [term: string]: number } = {};

  searchTerms.forEach((term) => (termFrequency[term] = 0));

  articles.forEach((article) => {
    const doc = article.title + " " + article.abstract;
    totalLength += doc.split(/\s+/).length;

    searchTerms.forEach((term) => {
      if (doc.toLowerCase().includes(term.toLowerCase())) {
        termFrequency[term]++;
      }
    });
  });

  return {
    docCount: articles.length,
    avgDocLength: totalLength / articles.length,
    termFrequency,
  };
}

function calculateRankingScore(article: EnhancedArticle): number {
  const citationScore = Math.log(article.citationCount + 1) * 10;
  const dateScore =
    (new Date().getFullYear() - new Date(article.date).getFullYear() + 1) * 5;
  return article.relevanceScore ?? 0 + citationScore + dateScore;
}

export function enhanceAndRankArticles(
  articles: Article[],
  searchInput: string
): EnhancedArticle[] {
  const searchTerms = searchInput.toLowerCase().split(/\s+/);
  const corpusStats = getCorpusStats(articles, searchTerms);

  const scoredArticles = articles.map((article) => ({
    ...article,
    relevanceScore: calculateBM25Score(article, searchTerms, corpusStats),
  }));

  const minScore = Math.min(...scoredArticles.map((a) => a.relevanceScore));
  const maxScore = Math.max(...scoredArticles.map((a) => a.relevanceScore));

  const enhancedArticles: EnhancedArticle[] = scoredArticles.map((article) => ({
    ...article,
    relevanceScore:
      maxScore > minScore
        ? (article.relevanceScore - minScore) / (maxScore - minScore)
        : 1,
    rankingScore: 0,
  }));

  enhancedArticles.forEach((article) => {
    article.rankingScore = calculateRankingScore(article);
  });

  return enhancedArticles.sort(
    (a, b) => b.rankingScore ?? 0 - (a.rankingScore ?? 0)
  );
}

export async function fetchAndEnhanceArticles(
  searchInput: string,
  currentPage: number
): Promise<EnhancedArticle[]> {
  const results = await Promise.all([
    fetchCrossrefArticles(searchInput, currentPage),
    fetchCoreArticles(searchInput, currentPage),
    fetchArxivArticles(searchInput, currentPage),
    fetchPapersWithCodeArticles(searchInput, currentPage),
  ]);

  const allArticles = results.flat();

  const uniqueDoiMap = new Map<string, EnhancedArticle>();
  const papersWithCodeMap = new Map<string, EnhancedArticle>();

  allArticles.forEach((article) => {
    let doi = article.doi;

    if (doi && doi.startsWith("arxiv:")) {
      doi = doi.replace(/v\d+$/, ""); // Remove version number (e.g., v1, v2, etc.)
    }

    if (doi) {
      const isPapersWithCode =
        "repositoryUrl" in article && article.repositoryUrl !== undefined;

      if (isPapersWithCode) {
        papersWithCodeMap.set(doi, article as EnhancedArticle);
      } else if (!uniqueDoiMap.has(doi)) {
        uniqueDoiMap.set(doi, article as EnhancedArticle);
      }
    }
  });

  papersWithCodeMap.forEach((article, doi) => {
    uniqueDoiMap.set(doi, article);
  });

  const uniqueArticles = Array.from(uniqueDoiMap.values());

  const enhancedArticles = enhanceAndRankArticles(uniqueArticles, searchInput);

  return enhancedArticles;
}

export const sortArticles = (
  articles: EnhancedArticle[],
  option: SortOption
) => {
  return [...articles].sort((a, b) => {
    switch (option) {
      case "relevance":
        return (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0);
      case "citationCount":
        return b.citationCount - a.citationCount;
      case "date":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      default:
        return 0;
    }
  });
};

const parseArticleDate = (dateString: string): Date => {
  let date = parseISO(dateString);
  if (isValid(date)) return date;

  const formats = ["yyyy-MM-dd", "yyyy-MM", "yyyy"];
  for (const format of formats) {
    date = parse(dateString, format, new Date());
    if (isValid(date)) return date;
  }

  console.warn(
    `Unable to parse date: ${dateString}. Using current date instead.`
  );
  return new Date();
};

export const filterArticles = (
  articles: EnhancedArticle[],
  startDate: Date | undefined,
  endDate: Date | undefined,
  selectedJournals: string[],
  minCitations: string
) => {
  return articles.filter((article) => {
    const articleDate = parseArticleDate(article.date);
    const isAfterStartDate = startDate
      ? isAfter(articleDate, startDate) ||
        articleDate.getTime() === startDate.getTime()
      : true;
    const isBeforeEndDate = endDate
      ? isBefore(articleDate, endDate) ||
        articleDate.getTime() === endDate.getTime()
      : true;

    const isInSelectedJournals =
      selectedJournals.length === 0 ||
      selectedJournals.includes(article.journal);

    const meetsMinCitations =
      minCitations === "" || article.citationCount >= parseInt(minCitations);

    return (
      isAfterStartDate &&
      isBeforeEndDate &&
      isInSelectedJournals &&
      meetsMinCitations
    );
  });
};
