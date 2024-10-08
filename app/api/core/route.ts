import { ITEMS_PER_API } from "@/app/lib/constants";
import { Article, CoreApiResponse, CoreApiResult } from "@/app/lib/types";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page");

  if (!query || !page) {
    return NextResponse.json(
      { error: "Missing query or page parameter" },
      { status: 400 }
    );
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.core.ac.uk/v3/search/works/?q=${encodedQuery}&limit=${ITEMS_PER_API}&offset=${
    (parseInt(page) - 1) * ITEMS_PER_API
  }&api_key=${process.env.CORE_API_KEY}`;

  try {
    const response = await axios.get<CoreApiResponse>(url);

    if (!response.data || !Array.isArray(response.data.results)) {
      console.error("Unexpected CORE API response structure:", response.data);
      return NextResponse.json(
        { error: "Unexpected API response" },
        { status: 500 }
      );
    }

    const articles: Article[] = response.data.results.map(
      (item: CoreApiResult) => ({
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
      })
    );

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching CORE articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
