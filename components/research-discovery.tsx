"use client";

import { env, pipeline } from "@xenova/transformers";
import axios from "axios";
import { format } from "date-fns";
import { distance } from "fastest-levenshtein";
import { FileText, Filter, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_API = 25;
const CORE_API_KEY = "YOUR_CORE_API_KEY"; // Replace with your actual CORE API key

interface Article {
  title: string;
  authors: string;
  date: string;
  journal: string;
  tags: string[];
  abstract: string;
  doi: string;
  citationCount: number;
  referenceCount: number;
}

interface EnhancedArticle extends Article {
  embedding: number[];
  influenceScore: number;
  relevanceScore?: number;
  rankingScore?: number;
}

interface CrossrefAuthor {
  name?: string;
  given?: string;
  family?: string;
}

interface CrossrefItem {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  "container-title"?: string[];
  published?: { "date-parts": number[][] };
  abstract?: string;
  subject?: string[];
  "is-referenced-by-count"?: number;
  reference?: { DOI?: string }[];
}

interface CrossrefResponse {
  message: {
    items: CrossrefItem[];
  };
}

interface CoreAuthor {
  name: string;
}

interface CoreItem {
  title: string;
  authors: CoreAuthor[];
  datePublished: string;
  publisher: string;
  subjects: string[];
  abstract: string;
  doi?: string;
  citationCount: number;
}

interface CoreResponse {
  data: CoreItem[];
}

type FeatureExtractionPipeline = (
  input: string | string[]
) => Promise<Float32Array[]>;

type SortOption = "relevance" | "citationCount" | "date";

interface RankingFactors {
  relevanceScore: number;
  citationCount: number;
  publicationDate: Date;
  isExactMatch: boolean;
}

const citationCache: { [doi: string]: { count: number; timestamp: number } } =
  {};

const getCachedCitationCount = (doi: string): number | null => {
  const cached = citationCache[doi];
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.count;
  }
  return null;
};

const setCachedCitationCount = (doi: string, count: number) => {
  citationCache[doi] = { count, timestamp: Date.now() };
};

const fetchCitationCount = async (doi: string): Promise<number> => {
  if (doi === "No DOI available") {
    return 0;
  }

  const cachedCount = getCachedCitationCount(doi);
  if (cachedCount !== null) {
    return cachedCount;
  }

  try {
    const openCitationsUrl = `https://opencitations.net/index/coci/api/v1/citations/${doi}`;
    const response = await axios.get<{ count: number }>(openCitationsUrl);
    const citationCount =
      typeof response.data.count === "number" ? response.data.count : 0;
    setCachedCitationCount(doi, citationCount);
    return citationCount;
  } catch (error) {
    console.error(`Error fetching citation count for ${doi}:`, error);
    return 0;
  }
};

const fuzzyTitleMatch = (
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

const calculateRankingScore = (factors: RankingFactors): number => {
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

const handleApiError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);

  let errorMessage = "An unexpected error occurred. Please try again later.";

  if (error instanceof Error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (error.response.status === 429) {
          errorMessage =
            "Too many requests. Please try again in a few minutes.";
        } else if (error.response.status === 404) {
          errorMessage = "The requested resource was not found.";
        }
      } else if (error.request) {
        errorMessage =
          "Unable to reach the server. Please check your internet connection.";
      }
    } else {
      errorMessage = `An error occurred: ${error.message}`;
    }
  }

  toast.error(errorMessage);
};

export function ResearchDiscoveryComponent() {
  env.allowLocalModels = false;
  env.allowRemoteModels = true;

  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<EnhancedArticle[]>(
    []
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [model, setModel] = useState<FeatureExtractionPipeline | null>(null);
  const [page, setPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [minCitations, setMinCitations] = useState<string>("");
  const [allArticles, setAllArticles] = useState<EnhancedArticle[]>([]);
  const [isFiltersActive, setIsFiltersActive] = useState(false);
  const [availableJournals, setAvailableJournals] = useState<string[]>([]);

  useEffect(() => {
    async function loadModel() {
      try {
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
        handleApiError(error, "loadModel");
      }
    }
    loadModel();
  }, []);

  const enhanceArticles = useCallback(
    async (articles: Article[]): Promise<EnhancedArticle[]> => {
      if (!model) return articles as EnhancedArticle[];

      const enhancedArticles = await Promise.all(
        articles.map(async (article) => {
          const [embeddingResult, updatedCitationCount] = await Promise.all([
            model(article.title + " " + article.abstract),
            fetchCitationCount(article.doi),
          ]);
          const embedding = Array.from(embeddingResult[0]);
          const influenceScore = Math.random(); // Placeholder for actual influence score
          return {
            ...article,
            embedding,
            influenceScore,
            citationCount: Math.max(
              article.citationCount || 0,
              updatedCitationCount || 0
            ),
          };
        })
      );

      return enhancedArticles;
    },
    [model]
  );

  const cleanAbstract = (abstract: string): string => {
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

  const fetchCrossrefArticles = useCallback(
    async (query: string, page: number): Promise<Article[]> => {
      const encodedQuery = encodeURIComponent(query);
      const exactMatchUrl = `https://api.crossref.org/works?query.bibliographic=${encodedQuery}&rows=1&sort=relevance&order=desc&select=DOI,title,author,container-title,published,abstract,subject,type,is-referenced-by-count,reference&filter=type:journal-article`;
      const fuzzySearchUrl = `https://api.crossref.org/works?query=${encodedQuery}&rows=${ITEMS_PER_API}&offset=${
        (page - 1) * ITEMS_PER_API
      }&sort=relevance&order=desc&select=DOI,title,author,container-title,published,abstract,subject,type,is-referenced-by-count,reference&filter=type:journal-article`;

      try {
        const [exactMatchResponse, fuzzySearchResponse] = await Promise.all([
          axios.get<CrossrefResponse>(exactMatchUrl),
          axios.get<CrossrefResponse>(fuzzySearchUrl),
        ]);

        const processItems = (items: CrossrefItem[]): Article[] => {
          return items
            .filter(
              (item: CrossrefItem) =>
                item.abstract &&
                item.title &&
                item.title.length > 0 &&
                !item.DOI?.includes("/fig-") &&
                !item.DOI?.includes("/table-")
            )
            .map((item: CrossrefItem) => ({
              title: item.title ? item.title[0] : "No title available",
              authors: item.author
                ? item.author
                    .map(
                      (author) =>
                        author.name ||
                        `${author.given || ""} ${author.family || ""}`.trim()
                    )
                    .filter((name) => name.length > 0)
                    .join(", ")
                : "No authors available",
              date:
                item.published &&
                item.published["date-parts"] &&
                item.published["date-parts"][0]
                  ? item.published["date-parts"][0].slice(0, 3).join("-")
                  : "No date available",
              journal: item["container-title"]
                ? item["container-title"][0]
                : "No journal available",
              tags: item.subject || [],
              abstract: item.abstract
                ? cleanAbstract(item.abstract)
                : "No abstract available",
              doi: item.DOI || "No DOI available",
              citationCount:
                typeof item["is-referenced-by-count"] === "number"
                  ? item["is-referenced-by-count"]
                  : 0,
              referenceCount: item.reference ? item.reference.length : 0,
            }));
        };

        const exactMatches = processItems(
          exactMatchResponse.data.message.items
        );
        const fuzzyMatches = processItems(
          fuzzySearchResponse.data.message.items
        );

        // Combine exact matches and fuzzy matches, removing duplicates
        const combinedResults = [...exactMatches, ...fuzzyMatches].filter(
          (article, index, self) =>
            index === self.findIndex((t) => t.doi === article.doi)
        );

        return combinedResults;
      } catch (error) {
        handleApiError(error, "fetchCrossrefArticles");
        return [];
      }
    },
    []
  );
  const fetchCoreArticles = useCallback(
    async (query: string, page: number): Promise<Article[]> => {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.core.ac.uk/v3/search/works/?q=title:(${encodedQuery})&limit=${ITEMS_PER_API}&offset=${
        (page - 1) * ITEMS_PER_API
      }&scroll=false&api_key=${CORE_API_KEY}`;

      try {
        const response = await axios.get<CoreResponse>(url);
        return response.data.data.map((item: CoreItem) => ({
          title: item.title,
          authors: item.authors.map((author) => author.name).join(", "),
          date: item.datePublished,
          journal: item.publisher,
          tags: item.subjects,
          abstract: item.abstract,
          doi: item.doi || "No DOI available",
          citationCount:
            typeof item.citationCount === "number" ? item.citationCount : 0,
          referenceCount: 0, // CORE API doesn't provide this information
        }));
      } catch (error) {
        handleApiError(error, "fetchCoreArticles");
        return [];
      }
    },
    []
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

      setFilteredArticles(sortArticles(filtered, sortOption));
      setIsFiltersActive(true);
      setIsFiltersOpen(false);
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

        const removeDuplicates = (articles: Article[]): Article[] => {
          const uniqueArticles = new Map<string, Article>();
          articles.forEach((article) => {
            const key =
              article.doi !== "No DOI available" ? article.doi : article.title;
            if (
              !uniqueArticles.has(key) ||
              article.citationCount >
                (uniqueArticles.get(key)?.citationCount ?? 0)
            ) {
              uniqueArticles.set(key, article);
            }
          });
          return Array.from(uniqueArticles.values());
        };

        const calculateRelevanceScore = (
          queryEmbedding: number[],
          articleEmbedding: number[]
        ): number => {
          const dotProduct = queryEmbedding.reduce(
            (sum, val, i) => sum + val * articleEmbedding[i],
            0
          );
          const queryMagnitude = Math.sqrt(
            queryEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const articleMagnitude = Math.sqrt(
            articleEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          return dotProduct / (queryMagnitude * articleMagnitude);
        };

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

        // Remove duplicates from the new articles
        const newArticles = rankedArticles.filter(
          (article) =>
            !allArticles.some(
              (existingArticle) =>
                existingArticle.doi === article.doi ||
                existingArticle.title === article.title
            )
        );

        // Update allArticles state
        const updatedAllArticles = isLoadMore
          ? [...allArticles, ...newArticles]
          : newArticles;
        setAllArticles(updatedAllArticles);

        const journals = Array.from(
          new Set(updatedAllArticles.map((article) => article.journal))
        ).filter((journal) => journal !== "No journal available");
        setAvailableJournals(journals);

        // Apply sorting
        const sortedArticles = sortArticles(updatedAllArticles, sortOption);

        // Apply filters if active, otherwise use sorted articles
        if (isFiltersActive) {
          const filteredSortedArticles = sortedArticles.filter((article) => {
            const articleDate = new Date(article.date);
            const isAfterStartDate = startDate
              ? articleDate >= startDate
              : true;
            const isBeforeEndDate = endDate ? articleDate <= endDate : true;
            const isInSelectedJournals =
              selectedJournals.length === 0 ||
              selectedJournals.includes(article.journal);
            const meetsMinCitations =
              minCitations === "" ||
              article.citationCount >= parseInt(minCitations);

            return (
              isAfterStartDate &&
              isBeforeEndDate &&
              isInSelectedJournals &&
              meetsMinCitations
            );
          });
          setFilteredArticles(filteredSortedArticles);
        } else {
          setFilteredArticles(sortedArticles);
        }

        setPage(currentPage);
      } catch (error) {
        handleApiError(error, "handleSearch");
      } finally {
        setIsLoading(false);
      }
    },
    [
      page,
      searchInput,
      model,
      fetchCrossrefArticles,
      fetchCoreArticles,
      enhanceArticles,
      sortArticles,
      setPage,
      setIsLoading,
      sortOption,
      allArticles,
      isFiltersActive,
      startDate,
      endDate,
      selectedJournals,
      minCitations,
    ]
  );

  const clearFilters = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedJournals([]);
    setMinCitations("");
    setFilteredArticles(sortArticles(allArticles, sortOption));
    setIsFiltersActive(false);
    setIsFiltersOpen(false);
  }, [allArticles, sortArticles, sortOption]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setAllArticles([]);
    setFilteredArticles([]);
    clearFilters();
    setPage(1);
    setIsFiltersActive(false);
  }, [clearFilters]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchInput.trim()) {
        e.preventDefault();
        handleSearch();
      }
    },
    [searchInput, handleSearch]
  );

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Enhanced Research Article Discovery
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <Input
            type="text"
            placeholder="Enter search terms (searches titles and abstracts)..."
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          <div className="flex justify-center space-x-4">
            <Button onClick={() => handleSearch()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2" />
                  Search Articles
                </>
              )}
            </Button>
            <Button variant="outline" onClick={clearSearch}>
              Clear Search
            </Button>
          </div>
        </div>

        {isLoading && filteredArticles.length === 0 ? (
          <p className="text-center">Searching for articles...</p>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Search Results</h2>
              <div className="flex items-center space-x-4">
                <Select
                  onValueChange={(value) =>
                    handleSortChange(value as SortOption)
                  }
                  defaultValue={sortOption}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="citationCount">
                      Citation Count
                    </SelectItem>
                    <SelectItem value="date">Publication Date</SelectItem>
                  </SelectContent>
                </Select>
                <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Date Range</h3>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-[120px] justify-start text-left font-normal"
                              >
                                {startDate
                                  ? format(startDate, "dd/MM/yyyy")
                                  : "Start Date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-[120px] justify-start text-left font-normal"
                              >
                                {endDate
                                  ? format(endDate, "dd/MM/yyyy")
                                  : "End Date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Journal/Source</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {availableJournals.map((journal) => (
                            <label
                              key={journal}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                checked={selectedJournals.includes(journal)}
                                onCheckedChange={(checked) => {
                                  setSelectedJournals(
                                    checked
                                      ? [...selectedJournals, journal]
                                      : selectedJournals.filter(
                                          (j) => j !== journal
                                        )
                                  );
                                }}
                              />
                              <span>{journal}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">Minimum Citations</h3>
                        <Input
                          type="number"
                          value={minCitations}
                          onChange={(e) => setMinCitations(e.target.value)}
                          placeholder="Enter minimum citations"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button onClick={() => applyFilters()}>
                          Apply Filters
                        </Button>
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: EnhancedArticle, index) => (
                <Card
                  key={`${article.doi}-${index}`}
                  className="transition-all duration-300 hover:shadow-lg flex flex-col"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      <div className="max-w-[250px] break-words">
                        {article.title}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{article.authors}</p>
                    <p className="text-xs text-gray-500">{article.date}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {article.abstract}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags
                        .slice(0, 3)
                        .map((tag: string, tagIndex: number) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="px-2 py-1 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      {article.tags.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                        >
                          +{article.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start space-y-2">
                    <p className="text-xs text-gray-500">{article.journal}</p>
                    <div className="flex justify-between w-full">
                      <span className="text-xs text-gray-600">
                        Citations: {article.citationCount}
                      </span>
                      <span className="text-xs text-gray-600">
                        Relevance:{" "}
                        {article.relevanceScore
                          ? (article.relevanceScore * 100).toFixed(2)
                          : "N/A"}
                        %
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(`https://doi.org/${article.doi}`, "_blank")
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Read Full Text
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">
            No articles found. Try a new search.
          </p>
        )}
      </div>
    </div>
  );
}

export default ResearchDiscoveryComponent;
