export interface Article {
  title: string;
  authors: string;
  date: string;
  journal: string;
  tags: string[];
  abstract: string;
  doi: string;
  citationCount: number;
  referenceCount: number;
}

export interface EnhancedArticle extends Article {
  embedding: number[];
  influenceScore: number;
  relevanceScore?: number;
  rankingScore?: number;
}

export interface CrossrefAuthor {
  name?: string;
  given?: string;
  family?: string;
}

export interface CrossrefItem {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  "container-title"?: string[];
  published?: { "date-parts": number[][] };
  abstract?: string;
  subject?: string[];
  "is-referenced-by-count"?: number;
  reference?: { DOI?: string }[];
}

export interface CrossrefResponse {
  message: {
    items: CrossrefItem[];
  };
}

export interface CoreAuthor {
  name: string;
}

export interface CoreItem {
  title?: string;
  authors?: CoreAuthor[];
  datePublished?: string;
  publisher?: string;
  topics?: string[];
  abstract?: string;
  doi?: string;
  citationCount?: number;
}

export interface CoreResponse {
  totalHits: number;
  limit: number;
  offset: number;
  results: CoreItem[];
}

export type SortOption = "relevance" | "citationCount" | "date";

export interface RankingFactors {
  relevanceScore: number;
  citationCount: number;
  publicationDate: Date;
  isExactMatch: boolean;
}
