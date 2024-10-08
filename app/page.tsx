"use client";

import ArticleCard from "@/components/ArticleCard";
import FilterPopover from "@/components/FilterPopover";
import SearchBar from "@/components/SearchBar";
import SortSelect from "@/components/SortSelect";
import { Button } from "@/components/ui/button";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { EnhancedArticle } from "../app/lib/types";
import { useResearchStore } from "../app/store/researchStore";

export default function ResearchDiscoveryComponent() {
  const [parent] = useAutoAnimate();

  const {
    filteredArticles,
    isLoading,
    handleSearch,
    handleLoadMore,
    clearSearch,
  } = useResearchStore();

  const onSearch = () => {
    handleSearch();
  };

  const onLoadMore = () => {
    handleLoadMore();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Find Research Online
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <SearchBar />
          <div className="flex justify-center space-x-4">
            <Button onClick={onSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search Articles"}
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
                <SortSelect />
                <FilterPopover />
              </div>
            </div>

            <div
              ref={parent}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredArticles.map(
                (article: EnhancedArticle, index: number) => (
                  <ArticleCard
                    key={`${article.doi}-${index}`}
                    article={article}
                  />
                )
              )}
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={onLoadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-600">Try a new search.</p>
        )}
      </div>
    </div>
  );
}
