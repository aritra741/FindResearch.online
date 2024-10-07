import { EnhancedArticle } from "@/app/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import React from "react";

interface ArticleCardProps {
  article: EnhancedArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          <div className="max-w-[250px] break-words">{article.title}</div>
        </CardTitle>
        <p className="text-sm text-gray-600">{article.authors}</p>
        <p className="text-xs text-gray-500">{article.date}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700 line-clamp-3">{article.abstract}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
            <Badge
              key={tagIndex}
              variant="secondary"
              className="px-2 py-1 text-xs"
            >
              {tag}
            </Badge>
          ))}
          {article.tags.length > 3 && (
            <Badge variant="secondary" className="px-2 py-1 text-xs">
              +{article.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2">
        <p className="text-xs text-gray-500">{article.journal}</p>
        <div className="flex justify-between w-full">
          <span className="text-xs text-gray-600">
            Citations: {article.citationCount}
          </span>
          <span className="text-xs text-gray-600">
            Relevance:{" "}
            {article.relevanceScore
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
            window.open(`https://doi.org/${article.doi}`, "_blank")
          }
        >
          <FileText className="mr-2 h-4 w-4" />
          Read Full Text
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
