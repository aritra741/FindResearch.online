import axios from "axios";
import { ITEMS_PER_API } from "./constants";
import {
  Article,
  CrossrefItem,
  CrossrefResponse,
  PapersWithCodeResponse,
  PapersWithCodeResult,
} from "./types";
import { cleanAbstract } from "./utils";

export const fetchPapersWithCodeArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  try {
    const response = await axios.get<PapersWithCodeResponse>(
      `/api/paperswithcode?query=${encodeURIComponent(query)}&page=${page}`
    );
    const items = response.data.results;

    return items.map((item: PapersWithCodeResult) => ({
      title: item.paper?.title || "No title available",
      authors: item.paper?.authors?.join(", ") || "No authors available",
      date: item.paper?.published || "No date available",
      journal: item.paper?.conference || "No journal/conference available",
      tags: [],
      abstract: item.paper?.abstract || "No abstract available",
      doi: item.paper?.arxiv_id
        ? `arxiv:${item.paper.arxiv_id}`
        : "No DOI available",
      citationCount: 0,
      referenceCount: 0,
      downloadUrl: item.paper?.url_pdf || "",
      repositoryUrl: item.repository?.url || "",
      framework: item.repository?.framework || "",
    }));
  } catch (error) {
    console.error("Error fetching Papers with Code articles:", error);
    return [];
  }
};

export const fetchArxivArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await axios.get(
      `/api/arxiv?query=${encodeURIComponent(query)}&page=${page}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    return response.data;
  } catch (error) {
    clearTimeout(timeoutId);
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
  try {
    const response = await axios.get<Article[]>(
      `/api/core?query=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching CORE articles:", error);
    return [];
  }
};
