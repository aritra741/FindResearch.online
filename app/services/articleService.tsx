import { isAfter, isBefore, isValid, parse, parseISO } from "date-fns";
import {
  fetchArxivArticles,
  fetchCoreArticles,
  fetchCrossrefArticles,
} from "../lib/api"; // Import the new arXiv function
import {
  EnhancedArticle,
  FeatureExtractionPipeline,
  SortOption,
} from "../lib/types";
import {
  calculateRankingScore,
  calculateRelevanceScore,
  removeDuplicates,
} from "../lib/utils";

export const fetchAndEnhanceArticles = async (
  searchInput: string,
  currentPage: number,
  model: FeatureExtractionPipeline | null
) => {
  const [crossrefArticles, coreArticles, arxivArticles] = await Promise.all([
    fetchCrossrefArticles(searchInput, currentPage),
    fetchCoreArticles(searchInput, currentPage),
    fetchArxivArticles(searchInput, currentPage), // Fetch articles from arXiv
  ]);

  const combinedArticles = [
    ...crossrefArticles,
    ...coreArticles,
    ...arxivArticles,
  ];
  const uniqueArticles = removeDuplicates(combinedArticles);

  let enhancedArticles: EnhancedArticle[] = uniqueArticles.map((article) => ({
    ...article,
    embedding: [],
    relevanceScore: 0,
    rankingScore: 0,
  }));

  if (model) {
    const queryEmbeddingResult = await model(searchInput);
    const queryEmbedding = Array.from(queryEmbeddingResult[0]);

    enhancedArticles = await Promise.all(
      enhancedArticles.map(async (article) => {
        const embeddingResult = await model(
          article.title + " " + article.abstract
        );
        const embedding = Array.from(embeddingResult[0]);
        const relevanceScore = calculateRelevanceScore(
          queryEmbedding,
          embedding
        );
        const rankingScore = calculateRankingScore({
          relevanceScore,
          citationCount: article.citationCount,
          publicationDate: new Date(article.date),
          isExactMatch: article.title
            .toLowerCase()
            .includes(searchInput.toLowerCase()),
        });

        return {
          ...article,
          embedding,
          relevanceScore,
          rankingScore,
        };
      })
    );
  }

  return enhancedArticles;
};

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
    // Date filtering
    const articleDate = parseArticleDate(article.date);
    const isAfterStartDate = startDate
      ? isAfter(articleDate, startDate) ||
        articleDate.getTime() === startDate.getTime()
      : true;
    const isBeforeEndDate = endDate
      ? isBefore(articleDate, endDate) ||
        articleDate.getTime() === endDate.getTime()
      : true;

    // Journal filtering
    const isInSelectedJournals =
      selectedJournals.length === 0 ||
      selectedJournals.includes(article.journal);

    // Citation filtering
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
