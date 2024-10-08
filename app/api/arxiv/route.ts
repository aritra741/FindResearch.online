import { NextResponse } from "next/server";
import axios from "axios";
import { parseString } from "xml2js";
import { promisify } from "util";
import { ITEMS_PER_API } from "@/app/lib/constants";
import { cleanAbstract } from "@/app/lib/utils";
import { Article, ArxivResponse, ArxivEntry } from "@/app/lib/types";

const parseXML = promisify(parseString);

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
  const url = `https://export.arxiv.org/api/query?search_query=${encodedQuery}&start=${
    (parseInt(page) - 1) * ITEMS_PER_API
  }&max_results=${ITEMS_PER_API}`;

  try {
    const response = await axios.get(url);
    const result = (await parseXML(response.data)) as ArxivResponse;

    const entries = result.feed.entry || [];
    const articles: Article[] = entries.map(
      (entry: ArxivEntry): Article => ({
        title: entry.title[0] || "No title available",
        authors: entry.author
          ? entry.author.map((author) => author.name[0]).join(", ")
          : "No authors available",
        date: entry.published[0] || "No date available",
        journal: entry["arxiv:journal_ref"]
          ? entry["arxiv:journal_ref"][0]
          : "arXiv",
        tags: entry.category ? entry.category.map((cat) => cat.$.term) : [],
        abstract: entry.summary
          ? cleanAbstract(entry.summary[0])
          : "No abstract available",
        doi: entry.id
          ? entry.id[0].replace("http://arxiv.org/abs/", "arxiv:")
          : "No DOI available",
        citationCount: 0,
        referenceCount: 0,
        arxivId: entry.id
          ? entry.id[0].replace("http://arxiv.org/abs/", "")
          : "No arXiv ID available",
      })
    );

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching arXiv articles:", error);
    return NextResponse.json(
      { error: "Error fetching articles" },
      { status: 500 }
    );
  }
}
