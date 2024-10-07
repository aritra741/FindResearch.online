"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import ArticleCard from "../components/ArticleCard";
import FilterPopover from "../components/FilterPopover";
import SearchBar from "../components/SearchBar";
import useArticleSearch from "./hooks/useArticleSearch";
import { SortOption } from "./types/article";

export default function ResearchDiscoveryPage() {
  const {
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
  } = useArticleSearch();

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Enhanced Research Article Discovery
        </h1>

        <SearchBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          handleSearch={handleSearch}
          isLoading={isLoading}
          clearSearch={clearSearch}
        />

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
                <div className="relative">
                  <FilterPopover
                    isOpen={isFiltersOpen}
                    setIsOpen={setIsFiltersOpen}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    selectedJournals={selectedJournals}
                    setSelectedJournals={setSelectedJournals}
                    minCitations={minCitations}
                    setMinCitations={setMinCitations}
                    availableJournals={availableJournals}
                    applyFilters={applyFilters}
                    clearFilters={clearFilters}
                  />
                  {isFiltersActive && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2"
                    >
                      !
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isFiltersActive && (
              <div className="flex items-center justify-between bg-gray-100 p-4 rounded-md">
                <p className="text-sm text-gray-600">Filters applied</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => (
                <ArticleCard
                  key={`${article.doi}-${index}`}
                  article={article}
                />
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
