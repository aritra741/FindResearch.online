import axios from "axios";
import { Article, CrossrefItem, CrossrefResponse } from "../types/article";
import { cleanAbstract } from "../utils/articleUtils";

export const fetchCrossrefArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  const encodedQuery = encodeURIComponent(query);
  const exactMatchUrl = `https://api.crossref.org/works?query.bibliographic=${encodedQuery}&rows=1&sort=relevance&order=desc&select=DOI,title,author,container-title,published,abstract,subject,type,is-referenced-by-count,reference&filter=type:journal-article`;
  const fuzzySearchUrl = `https://api.crossref.org/works?query=${encodedQuery}&rows=25&offset=${
    (page - 1) * 25
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
