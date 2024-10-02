"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FileText, Search, X } from "lucide-react";
import { KeyboardEvent, useState } from "react";

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Filter states
  const [dateRange, setDateRange] = useState([2020, 2023]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setArticles([
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
    ]);
    setIsLoading(false);
  };

  const clearSearch = () => {
    setSearchInput("");
    setTags([]);
    setArticles([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      setTags([...tags, searchInput.trim()]);
      setSearchInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const applyFilters = () => {
    // Apply filters logic here
    console.log("Applying filters:", {
      dateRange,
      selectedAuthor,
      selectedJournals,
      selectedTags,
    });
    handleSearch();
  };

  const clearFilters = () => {
    setDateRange([2020, 2023]);
    setSelectedAuthor("");
    setSelectedJournals([]);
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Research Article Discovery
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <Tabs
            defaultValue="tags"
            value={searchType}
            onValueChange={(value) => setSearchType(value)}
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
                  onChange={(e) => setSearchInput(e.target.value)}
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
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <Collapsible
            open={isFiltersOpen}
            onOpenChange={setIsFiltersOpen}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between w-full"
              >
                Filters
                {isFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Slider
                    min={2020}
                    max={2023}
                    step={1}
                    value={dateRange}
                    onValueChange={setDateRange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{dateRange[0]}</span>
                    <span>{dateRange[1]}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author</label>
                  <Select
                    value={selectedAuthor}
                    onValueChange={setSelectedAuthor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an author" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-doe">John Doe</SelectItem>
                      <SelectItem value="jane-smith">Jane Smith</SelectItem>
                      <SelectItem value="alice-johnson">
                        Alice Johnson
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Journal/Source</label>
                <div className="flex flex-wrap gap-2">
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
                              : selectedJournals.filter((j) => j !== journal)
                          );
                        }}
                      />
                      <span>{journal}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags/Categories</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "AI",
                    "Healthcare",
                    "Quantum Computing",
                    "Climate Change",
                    "Policy",
                  ].map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedTags(
                          selectedTags.includes(tag)
                            ? selectedTags.filter((t) => t !== tag)
                            : [...selectedTags, tag]
                        );
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button onClick={applyFilters}>Apply Filters</Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

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

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
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
