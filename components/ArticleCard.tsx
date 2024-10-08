import { EnhancedArticle } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Code, FileText, Loader2 } from "lucide-react";
import React, { useState } from "react";

interface ArticleCardProps {
  article: EnhancedArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // console.log("Article in ArticleCard:", JSON.stringify(article, null, 2));

  const [loading, setLoading] = useState(false);
  const [codeLink, setCodeLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCodeLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const arxivId = article.arxivId;

      if (!arxivId) {
        throw new Error("No arXiv ID available.");
      }

      // console.log("arxiv id", arxivId);

      const paperResponse = await fetch(
        `https://api.paperswithcode.com/v1/papers/?arxiv_id=${arxivId}`
      );
      const paperData = await paperResponse.json();

      if (paperData && paperData.results && paperData.results.length > 0) {
        const paperId = paperData.results[0].id;

        const repoResponse = await fetch(
          `https://api.paperswithcode.com/v1/papers/${paperId}/repositories/`
        );
        const repoData = await repoResponse.json();

        if (repoData && repoData.length > 0) {
          setCodeLink(repoData[0].url); // Assuming the first repo
        } else {
          setCodeLink(null);
          setError("No code repository found.");
        }
      } else {
        setCodeLink(null);
        setError("No paper found for this arXiv ID.");
      }
    } catch (err) {
      setError("Failed to fetch code repository.");
      setCodeLink(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          <div className="max-w-[250px] break-words">
            {typeof article.title === "string"
              ? article.title
              : "No title available"}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">
          {typeof article.authors === "string"
            ? article.authors
            : "No authors available"}
        </p>
        <p className="text-xs text-gray-500">
          {typeof article.date === "string"
            ? article.date
            : "No date available"}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 line-clamp-3">
          {typeof article.abstract === "string"
            ? article.abstract
            : "No abstract available"}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2">
        <p className="text-xs text-gray-500">
          {typeof article.journal === "string"
            ? article.journal
            : "No journal available"}
        </p>
        <div className="flex justify-between w-full">
          <span className="text-xs text-gray-600">
            Citations:{" "}
            {typeof article.citationCount === "number"
              ? article.citationCount
              : "N/A"}
          </span>
          <span className="text-xs text-gray-600">
            Relevance:{" "}
            {typeof article.relevanceScore === "number"
              ? (article.relevanceScore * 100).toFixed(2)
              : "N/A"}
            %
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            article.doi && article.doi !== "No DOI available"
              ? window.open(`https://doi.org/${article.doi}`, "_blank")
              : alert("No DOI available for this article")
          }
          disabled={!article.doi || article.doi === "No DOI available"}
        >
          <FileText className="mr-2 h-4 w-4" />
          Read Full Text
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={fetchCodeLink}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Code className="mr-2 h-4 w-4" />
          )}
          {loading ? "Fetching..." : "Get Code"}
        </Button>

        {codeLink && !error && (
          <a
            href={codeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 text-sm mt-2"
          >
            View Code Repository
          </a>
        )}
        {error && (
          <div className="flex items-center text-red-600 text-sm mt-2">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
