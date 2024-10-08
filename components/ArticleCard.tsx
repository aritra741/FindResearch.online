import { EnhancedArticle } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code, FileText } from "lucide-react";
import React from "react";

interface ArticleCardProps {
  article: EnhancedArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
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
            article.downloadUrl
              ? window.open(article.downloadUrl, "_blank")
              : article.arxivId
              ? window.open(
                  `https://arxiv.org/pdf/${article.arxivId}`,
                  "_blank"
                )
              : article.doi && article.doi !== "No DOI available"
              ? window.open(`https://doi.org/${article.doi}`, "_blank")
              : alert(
                  "No DOI, arXiv ID, or download URL available for this article"
                )
          }
          disabled={
            !article.downloadUrl &&
            (!article.doi || article.doi === "No DOI available")
          }
        >
          <FileText className="mr-2 h-4 w-4" />
          Read Full Text
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() =>
            article.repositoryUrl
              ? window.open(article.repositoryUrl, "_blank")
              : null
          }
          disabled={!article.repositoryUrl}
        >
          <Code className="mr-2 h-4 w-4" />
          Get Code
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
