import axios from "axios";
import { Article, CoreItem, CoreResponse } from "../types/article";

export const fetchCoreArticles = async (
  query: string,
  page: number
): Promise<Article[]> => {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.core.ac.uk/v3/search/works/?q=title:(${encodedQuery})&limit=25&offset=${
    (page - 1) * 25
  }&api_key=${process.env.NEXT_PUBLIC_CORE_API_KEY}`;

  try {
    const response = await axios.get<CoreResponse>(url);

    // Check if response.data and response.data.results exist
    if (!response.data || !Array.isArray(response.data.results)) {
      console.error("Unexpected CORE API response structure:", response.data);
      return [];
    }

    return response.data.results.map((item: CoreItem) => ({
      title: item.title || "No title available",
      authors: Array.isArray(item.authors)
        ? item.authors.map((author) => author.name).join(", ")
        : "No authors available",
      date: item.datePublished || "No date available",
      journal: item.publisher || "No journal available",
      tags: Array.isArray(item.topics) ? item.topics : [],
      abstract: item.abstract || "No abstract available",
      doi: item.doi || "No DOI available",
      citationCount:
        typeof item.citationCount === "number" ? item.citationCount : 0,
      referenceCount: 0, // CORE API doesn't provide this information
    }));
  } catch (error) {
    console.error("Error fetching CORE articles:", error);
    return [];
  }
};
