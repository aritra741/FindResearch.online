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
  downloadUrl?: string;
  repositoryUrl?: string;
  framework?: string;
  arxivId?: string;
}

export interface EnhancedArticle extends Article {
  embedding?: number[];
  relevanceScore?: number;
  rankingScore?: number;
}

interface PapersWithCodePaper {
  id: string;
  arxiv_id: string | null;
  nips_id: string | null;
  url_abs: string;
  url_pdf: string;
  title: string;
  abstract: string;
  authors: string[];
  published: string;
  conference: string | null;
  conference_url_abs: string | null;
  conference_url_pdf: string | null;
  proceeding: string | null;
}

export interface PapersWithCodeRepository {
  url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  framework: string;
}

export interface PapersWithCodeResult {
  paper: PapersWithCodePaper;
  repository: PapersWithCodeRepository;
  is_official: boolean;
}

export interface PapersWithCodeResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PapersWithCodeResult[];
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

export interface CoreApiResult {
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

export interface CoreAuthor {
  name: string;
}

export interface CoreItem {
  title: string;
  authors: CoreAuthor[];
  datePublished: string;
  publisher: string;
  subjects: string[];
  abstract: string;
  doi?: string;
  citationCount: number;
}

export interface CoreApiResponse {
  totalHits: number;
  limit: number;
  offset: number;
  scrollId: string | null;
  results: CoreApiResult[];
}

export interface CoreResponse {
  data: CoreItem[];
}

export type FeatureExtractionPipeline = (
  input: string | string[]
) => Promise<Float32Array[]>;

export type SortOption = "relevance" | "citationCount" | "date";

export interface RankingFactors {
  relevanceScore: number;
  citationCount: number;
  publicationDate: Date;
  isExactMatch: boolean;
}

export interface ArxivAuthor {
  name: string[];
}

export interface ArxivEntry {
  title: string[];
  author?: ArxivAuthor[];
  published: string[];
  "arxiv:journal_ref"?: string[];
  category?: Array<{ $: { term: string } }>;
  summary: string[];
  id: string[];
}

export interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[];
  };
}

export interface ArxivJournal {
  $: {
    xmlns: string;
  };
  _: string;
}

export interface ExtractedFeatures {
  main_outcome: string;
  methodology: string;
}
