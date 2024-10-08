import { create } from "zustand";
import { EnhancedArticle, SortOption } from "../lib/types";
import {
  fetchAndEnhanceArticles,
  filterArticles,
  sortArticles,
} from "../services/articleService";

interface ResearchState {
  searchInput: string;
  setSearchInput: (input: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  filteredArticles: EnhancedArticle[];
  setFilteredArticles: (articles: EnhancedArticle[]) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  page: number;
  setPage: (page: number) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  selectedJournals: string[];
  setSelectedJournals: (journals: string[]) => void;
  minCitations: string;
  setMinCitations: (citations: string) => void;
  allArticles: EnhancedArticle[];
  setAllArticles: (articles: EnhancedArticle[]) => void;
  isFiltersActive: boolean;
  setIsFiltersActive: (active: boolean) => void;
  availableJournals: string[];
  setAvailableJournals: (journals: string[]) => void;
  handleSearch: (isLoadMore?: boolean) => Promise<void>;
  handleLoadMore: () => Promise<void>;
  clearSearch: () => void;
  handleSortChange: (option: SortOption) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  searchInput: "",
  setSearchInput: (input) => set({ searchInput: input }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  filteredArticles: [],
  setFilteredArticles: (articles) => set({ filteredArticles: articles }),
  isFiltersOpen: false,
  setIsFiltersOpen: (open) => set({ isFiltersOpen: open }),
  page: 1,
  setPage: (page) => set({ page }),
  sortOption: "relevance",
  setSortOption: (option) => set({ sortOption: option }),
  startDate: undefined,
  setStartDate: (date) => set({ startDate: date }),
  endDate: undefined,
  setEndDate: (date) => set({ endDate: date }),
  selectedJournals: [],
  setSelectedJournals: (journals) => set({ selectedJournals: journals }),
  minCitations: "",
  setMinCitations: (citations) => set({ minCitations: citations }),
  allArticles: [],
  setAllArticles: (articles) => set({ allArticles: articles }),
  isFiltersActive: false,
  setIsFiltersActive: (active) => set({ isFiltersActive: active }),
  availableJournals: [],
  setAvailableJournals: (journals) => set({ availableJournals: journals }),

  handleSearch: async (isLoadMore = false) => {
    const {
      searchInput,
      page,
      sortOption,
      setIsLoading,
      setAllArticles,
      setFilteredArticles,
      setPage,
      setAvailableJournals,
    } = get();

    setIsLoading(true);
    try {
      const currentPage = isLoadMore ? page + 1 : 1;

      const enhancedArticles = await fetchAndEnhanceArticles(
        searchInput,
        currentPage
      );

      const updatedAllArticles = isLoadMore
        ? [...get().allArticles, ...enhancedArticles]
        : enhancedArticles;
      setAllArticles(updatedAllArticles);

      const journals = Array.from(
        new Set(updatedAllArticles.map((article) => article.journal))
      ).filter((journal) => journal !== "No journal available");
      setAvailableJournals(journals);

      const sortedArticles = sortArticles(updatedAllArticles, sortOption);
      setFilteredArticles(sortedArticles);

      setPage(currentPage);
    } catch (error) {
      console.error("Error in handleSearch:", error);
    } finally {
      setIsLoading(false);
    }
  },

  handleLoadMore: async () => {
    const { handleSearch } = get();
    await handleSearch(true);
  },

  clearSearch: () => {
    set({
      searchInput: "",
      allArticles: [],
      filteredArticles: [],
      page: 1,
      isFiltersActive: false,
      startDate: undefined,
      endDate: undefined,
      selectedJournals: [],
      minCitations: "",
    });
  },

  handleSortChange: (option: SortOption) => {
    const {
      allArticles,
      isFiltersActive,
      filteredArticles,
      setFilteredArticles,
    } = get();
    set({ sortOption: option });
    const articlesToSort = isFiltersActive ? filteredArticles : allArticles;
    const sortedArticles = sortArticles(articlesToSort, option);
    setFilteredArticles(sortedArticles);
  },

  applyFilters: () => {
    const {
      allArticles,
      startDate,
      endDate,
      selectedJournals,
      minCitations,
      sortOption,
      setFilteredArticles,
      setIsFiltersActive,
      setIsFiltersOpen,
    } = get();

    const filteredArticles = filterArticles(
      allArticles,
      startDate,
      endDate,
      selectedJournals,
      minCitations
    );
    const sortedFilteredArticles = sortArticles(filteredArticles, sortOption);
    setFilteredArticles(sortedFilteredArticles);
    setIsFiltersActive(true);
    setIsFiltersOpen(false);
  },

  clearFilters: () => {
    const {
      allArticles,
      sortOption,
      setFilteredArticles,
      setIsFiltersActive,
      setIsFiltersOpen,
    } = get();
    set({
      startDate: undefined,
      endDate: undefined,
      selectedJournals: [],
      minCitations: "",
    });
    const sortedArticles = sortArticles(allArticles, sortOption);
    setFilteredArticles(sortedArticles);
    setIsFiltersActive(false);
    setIsFiltersOpen(false);
  },
}));
