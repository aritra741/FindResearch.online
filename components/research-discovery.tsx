"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { FileText, Filter, Search, X } from "lucide-react";
import React, { useState } from "react";

interface Article {
  title: string;
  authors: string;
  date: string;
  journal: string;
  tags: string[];
  abstract: string;
}

export function ResearchDiscoveryComponent() {
  const [searchType, setSearchType] = useState("tags");
  const [searchInput, setSearchInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const fetchedArticles = [
      {
        title:
          "The Impact of Artificial Intelligence on Modern Healthcare: A Comprehensive Study of Recent Advancements and Future Prospects",
        authors: "John Doe, Jane Smith",
        date: "2023-05-15",
        journal: "Journal of AI in Medicine",
        tags: ["AI", "Healthcare", "Machine Learning"],
        abstract:
          "This study explores the transformative effects of artificial intelligence on healthcare delivery and patient outcomes...",
      },
      {
        title:
          "Quantum Computing: A New Era in Information Processing and Its Potential Applications in Various Fields",
        authors: "Alice Johnson, Bob Williams",
        date: "2022-06-02",
        journal: "Quantum Science Review",
        tags: ["Quantum Computing", "Information Theory", "Physics"],
        abstract:
          "We present a comprehensive overview of recent advancements in quantum computing and their potential applications...",
      },
      {
        title:
          "Climate Change Mitigation Strategies: A Global Perspective on Policy Implementation and Effectiveness",
        authors: "Emma Brown, Michael Green",
        date: "2021-04-20",
        journal: "Environmental Science & Policy",
        tags: ["Climate Change", "Sustainability", "Policy"],
        abstract:
          "This paper analyzes various climate change mitigation strategies implemented across different countries...",
      },
    ];

    setArticles(fetchedArticles);
    applyFilters(fetchedArticles);
    setIsLoading(false);
  };

  const applyFilters = (fetchedArticles = articles) => {
    let filtered = fetchedArticles;

    if (searchType === "tags" && selectedFilterTags.length > 0) {
      filtered = filtered.filter((article) =>
        selectedFilterTags.some((tag) => article.tags.includes(tag))
      );
    }

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

    setFilteredArticles(filtered);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedJournals([]);
    setSelectedFilterTags([]);
    setFilteredArticles(articles);
    setIsFiltersOpen(false);
  };

  const clearSearch = () => {
    setSearchInput("");
    setTags([]);
    setArticles([]);
    setFilteredArticles([]);
    clearFilters();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (searchType === "tags") {
        setTags([...tags, searchInput.trim()]);
        setSelectedFilterTags([...selectedFilterTags, searchInput.trim()]);
        setSearchInput("");
      } else {
        handleSearch();
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setSelectedFilterTags(
      selectedFilterTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const toggleFilterTag = (tag: string) => {
    setSelectedFilterTags(
      selectedFilterTags.includes(tag)
        ? selectedFilterTags.filter((t) => t !== tag)
        : [...selectedFilterTags, tag]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Research Article Discovery
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <Tabs
            value={searchType}
            defaultValue="tags"
            onValueChange={setSearchType}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tags">Search by Tags</TabsTrigger>
              <TabsTrigger value="text">Search by Text</TabsTrigger>
            </TabsList>
            <TabsContent value="tags">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter a tag and press Enter..."
                  value={searchInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {tag}
                      <button
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        onClick={() => removeTag(tag)}
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="text">
              <Input
                type="text"
                placeholder="Enter search terms..."
                value={searchInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleSearch} disabled={isLoading}>
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

        {filteredArticles.length > 0 && (
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
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
                        <PopoverContent className="w-auto p-0" align="start">
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
                        <PopoverContent className="w-auto p-0" align="start">
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
                    <div className="space-y-2">
                      {[
                        "Journal of AI in Medicine",
                        "Quantum Science Review",
                        "Environmental Science & Policy",
                      ].map((journal) => (
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
                  {searchType === "tags" && tags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={
                              selectedFilterTags.includes(tag)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleFilterTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
        )}

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <Card
                key={index}
                className="transition-all duration-300 hover:shadow-lg"
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
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {article.abstract}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag: string, tagIndex: number) => (
                      <Badge
                        key={tagIndex}
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{article.journal}</p>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Read Full Text
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">
            No articles found. Try a new search.
          </p>
        )}
      </div>
    </div>
  );
}
