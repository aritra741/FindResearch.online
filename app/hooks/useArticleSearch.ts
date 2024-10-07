import { env, pipeline } from "@xenova/transformers";
import { useCallback, useEffect, useState } from "react";
import { fetchCoreArticles } from "../api/core";
import { fetchCrossrefArticles } from "../api/crossref";
import { Article, EnhancedArticle, SortOption } from "../types/article";
import {
  calculateRankingScore,
  calculateRelevanceScore,
  fuzzyTitleMatch,
  removeDuplicates,
} from "../utils/articleUtils";

type FeatureExtractionPipeline = (
  input: string | string[]
) => Promise<Float32Array[]>;

const useArticleSearch = () => {
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<EnhancedArticle[]>(
    []
  );
  const [allArticles, setAllArticles] = useState<EnhancedArticle[]>([]);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [model, setModel] = useState<FeatureExtractionPipeline | null>(null);

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [minCitations, setMinCitations] = useState<string>("");
  const [isFiltersActive, setIsFiltersActive] = useState(false);
  const [availableJournals, setAvailableJournals] = useState<string[]>([]);

  useEffect(() => {
    async function loadModel() {
      try {
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        const featureExtractionPipeline = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2"
        );
        setModel(
          () => (input: string | string[]) =>
            featureExtractionPipeline(input, {
              pooling: "mean",
              normalize: true,
            })
        );
      } catch (error) {
        console.error("Error loading model:", error);
      }
    }
    loadModel();
  }, []);

  const enhanceArticles = useCallback(
    async (articles: Article[]): Promise<EnhancedArticle[]> => {
      if (!model) return articles as EnhancedArticle[];

      const enhancedArticles = await Promise.all(
        articles.map(async (article) => {
          const embeddingResult = await model(
            article.title + " " + article.abstract
          );
          const embedding = Array.from(embeddingResult[0]);
          return {
            ...article,
            embedding,
          };
        })
      );

      return enhancedArticles;
    },
    [model]
  );

  const sortArticles = useCallback(
    (articles: EnhancedArticle[], option: SortOption) => {
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
    },
    []
  );

  const applyFilters = useCallback(
    (articles: EnhancedArticle[] = allArticles) => {
      let filtered = articles;

      if (startDate || endDate) {
        filtered = filtered.filter((article) => {
          const articleDate = new Date(article.date);
          const isAfterStartDate = startDate ? articleDate >= startDate : true;
          const isBeforeEndDate = endDate ? articleDate <= endDate : true;
          return isAfterStartDate && isBeforeEndDate;
        });
      }

      if (selectedJournals.length > 0) {
        filtered = filtered.filter((article) =>
          selectedJournals.includes(article.journal)
        );
      }

      if (minCitations) {
        const minCitationsValue = parseInt(minCitations);
        filtered = filtered.filter(
          (article) => article.citationCount >= minCitationsValue
        );
      }

      const filteredWithRelevance = filtered.map((article) => {
        const originalArticle = allArticles.find((a) => a.doi === article.doi);
        return {
          ...article,
          relevanceScore: originalArticle?.relevanceScore,
          rankingScore: originalArticle?.rankingScore,
        };
      });

      setFilteredArticles(sortArticles(filteredWithRelevance, sortOption));
      setIsFiltersActive(true);
    },
    [
      allArticles,
      startDate,
      endDate,
      selectedJournals,
      minCitations,
      sortArticles,
      sortOption,
    ]
  );

  const handleSearch = useCallback(
    async (isLoadMore: boolean = false) => {
      setIsLoading(true);
      try {
        const currentPage = isLoadMore ? page + 1 : 1;
        const [crossrefArticles, coreArticles] = await Promise.all([
          fetchCrossrefArticles(searchInput, currentPage),
          fetchCoreArticles(searchInput, currentPage),
        ]);

        const combinedArticles = [...crossrefArticles, ...coreArticles];
        const uniqueArticles = removeDuplicates(combinedArticles);
        const enhanced = await enhanceArticles(uniqueArticles);

        let rankedArticles: EnhancedArticle[] = enhanced.map((article) => ({
          ...article,
          relevanceScore: 0,
          rankingScore: 0,
        }));

        if (model) {
          const queryEmbeddingResult = await model(searchInput);
          const queryEmbedding = Array.from(queryEmbeddingResult[0]);
          rankedArticles = rankedArticles.map((article) => {
            const relevanceScore = calculateRelevanceScore(
              queryEmbedding,
              article.embedding
            );
            return {
              ...article,
              relevanceScore,
              rankingScore: calculateRankingScore({
                relevanceScore,
                citationCount: article.citationCount,
                publicationDate: new Date(article.date),
                isExactMatch: fuzzyTitleMatch(searchInput, article.title),
              }),
            };
          });
        }

        const newArticles = rankedArticles.filter(
          (article) =>
            !allArticles.some(
              (existingArticle) =>
                existingArticle.doi === article.doi ||
                existingArticle.title === article.title
            )
        );

        const updatedAllArticles = isLoadMore
          ? [...allArticles, ...newArticles]
          : newArticles;
        setAllArticles(updatedAllArticles);

        const journals = Array.from(
          new Set(updatedAllArticles.map((article) => article.journal))
        ).filter((journal) => journal !== "No journal available");
        setAvailableJournals(journals);

        const sortedArticles = sortArticles(updatedAllArticles, sortOption);

        if (isFiltersActive) {
          applyFilters(sortedArticles);
        } else {
          setFilteredArticles(sortedArticles);
        }

        setPage(currentPage);
      } catch (error) {
        console.error("Error in handleSearch:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      page,
      searchInput,
      model,
      enhanceArticles,
      sortArticles,
      applyFilters,
      allArticles,
      isFiltersActive,
      sortOption,
    ]
  );

  const clearFilters = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedJournals([]);
    setMinCitations("");
    setFilteredArticles(sortArticles(allArticles, sortOption));
    setIsFiltersActive(false);
  }, [allArticles, sortArticles, sortOption]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setAllArticles([]);
    setFilteredArticles([]);
    clearFilters();
    setPage(1);
    setIsFiltersActive(false);
  }, [clearFilters]);

  const handleLoadMore = useCallback(() => {
    handleSearch(true);
  }, [handleSearch]);

  const handleSortChange = useCallback(
    (newSortOption: SortOption) => {
      setSortOption(newSortOption);
      const articlesToSort = isFiltersActive ? filteredArticles : allArticles;
      const sortedArticles = sortArticles(articlesToSort, newSortOption);
      setFilteredArticles(sortedArticles);
    },
    [sortArticles, allArticles, filteredArticles, isFiltersActive]
  );

  return {
    searchInput,
    setSearchInput,
    isLoading,
    filteredArticles,
    handleSearch,
    handleLoadMore,
    handleSortChange,
    clearSearch,
    sortOption,
    isFiltersActive,
    applyFilters,
    clearFilters,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedJournals,
    setSelectedJournals,
    minCitations,
    setMinCitations,
    availableJournals,
  };
};

export default useArticleSearch;
