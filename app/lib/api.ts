import axios from "axios";
import {
  getCachedCitationCount,
  ITEMS_PER_API,
  setCachedCitationCount,
} from "./constants";
import { Article, CrossrefItem, CrossrefResponse } from "./types";
import { cleanAbstract } from "./utils";

interface CoreApiResponse {
  totalHits: number;
  limit: number;
  offset: number;
  scrollId: string | null;
  results: CoreApiResult[];
}

interface CoreApiResult {
  id: string;
  authors: { name: string }[];
  title: string;
  datePublished: string;
  publisher: string;
  subjects: string[];
  abstract: string;
  doi?: string;
  downloadUrl?: string;
  fullTextIdentifier?: string;
  language?: {
    code: string;
    name: string;
  };
  citationCount: number;
}

export const fetchArxivArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  const encodedQuery = encodeURIComponent(query);
  const url = `http://export.arxiv.org/api/query?search_query=${encodedQuery}&start=${
    (page - 1) * ITEMS_PER_API
  }&max_results=${ITEMS_PER_API}`;

  try {
    const response = await axios.get(url);
    const parser = new DOMParser();
    const xml = parser.parseFromString(response.data, "application/xml");

    const items = Array.from(xml.getElementsByTagName("entry"));
    return items.map((item) => ({
      title:
        item.getElementsByTagName("title")[0]?.textContent ||
        "No title available",
      authors:
        Array.from(item.getElementsByTagName("author"))
          .map(
            (author) =>
              author.getElementsByTagName("name")[0]?.textContent ||
              "No authors available"
          )
          .join(", ") || "No authors available",
      date:
        item.getElementsByTagName("published")[0]?.textContent ||
        "No date available",
      journal:
        item.getElementsByTagName("arxiv:journal_ref")[0]?.textContent ||
        "arXiv",
      tags:
        Array.from(item.getElementsByTagName("category"))
          .map((tag) => tag.getAttribute("term") || "")
          .filter((tag) => tag.length > 0) || [],
      abstract:
        item.getElementsByTagName("summary")[0]?.textContent ?? ""
          ? cleanAbstract(
              item.getElementsByTagName("summary")[0]?.textContent ?? ""
            )
          : "No abstract available",
      doi:
        item
          .getElementsByTagName("id")[0]
          ?.textContent?.replace("http://arxiv.org/abs/", "arxiv:") ||
        "No DOI available",
      citationCount: 0, // arXiv API doesn't provide citation counts
      referenceCount: 0, // arXiv API doesn't provide reference counts
      arxivId:
        item
          .getElementsByTagName("id")[0]
          ?.textContent?.replace("http://arxiv.org/abs/", "") ||
        "No arXiv ID available",
    }));
  } catch (error) {
    console.error("Error fetching arXiv articles:", error);
    return [];
  }
};

export const fetchCrossrefArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
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

    const exactMatches = processItems(exactMatchResponse.data.message.items);
    const fuzzyMatches = processItems(fuzzySearchResponse.data.message.items);

    return [...exactMatches, ...fuzzyMatches].filter(
      (article, index, self) =>
        index === self.findIndex((t) => t.doi === article.doi)
    );
  } catch (error) {
    console.error("Error fetching Crossref articles:", error);
    return [];
  }
};

export const fetchCoreArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.core.ac.uk/v3/search/works/?q=${encodedQuery}&limit=${ITEMS_PER_API}&offset=${
    (page - 1) * ITEMS_PER_API
  }&api_key=${process.env.NEXT_PUBLIC_CORE_API_KEY}`;

  try {
    const response = await axios.get<CoreApiResponse>(url);

    if (!response.data || !Array.isArray(response.data.results)) {
      console.error("Unexpected CORE API response structure:", response.data);
      return [];
    }

    return response.data.results.map((item: CoreApiResult) => ({
      title: item.title || "No title available",
      authors:
        item.authors.map((author) => author.name).join(", ") ||
        "No authors available",
      date: item.datePublished || "No date available",
      journal: item.publisher || "No journal available",
      tags: item.subjects || [],
      abstract: item.abstract || "No abstract available",
      doi: item.doi || "No DOI available",
      citationCount: item.citationCount || 0,
      referenceCount: 0, // CORE API doesn't provide this information
      downloadUrl: item.downloadUrl || item.fullTextIdentifier || "",
    }));
  } catch (error) {
    console.error("Error fetching CORE articles:", error);
    return [];
  }
};

// Existing function to fetch citation counts
export const fetchCitationCount = async (doi: string): Promise<number> => {
  if (doi === "No DOI available") {
    return 0;
  }

  const cachedCount = getCachedCitationCount(doi);
  if (cachedCount !== null) {
    return cachedCount;
  }

  try {
    // const openCitationsUrl = `https://opencitations.net/index/coci/api/v1/citations/${doi}`;
    // const response = await axios.get<{ count: number }>(openCitationsUrl);
    const citationCount = 0;
    // typeof response.data.count === "number" ? response.data.count : 0;
    setCachedCitationCount(doi, citationCount);
    return citationCount;
  } catch (error) {
    console.error(`Error fetching citation count for ${doi}:`, error);
    return 0;
  }
};
