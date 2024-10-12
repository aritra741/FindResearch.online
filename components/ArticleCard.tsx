import React, { useState, useEffect, useRef } from "react";
import { EnhancedArticle, ExtractedFeatures } from "@/app/lib/types";
import { extractFeaturesFromAbstract } from "@/app/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Code, FileText, Zap } from "lucide-react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (
        elements: (string | Element | ReadonlyArray<string | Element>)[]
      ) => Promise<void>;
      startup: {
        promise: Promise<void>;
      };
      tex: {
        inlineMath: string[][];
      };
      svg: {
        fontCache: "local" | "global" | "none";
      };
      options: {
        enableMenu: boolean;
      };
      loader: {
        load: (...components: string[]) => Promise<void>;
      };
      config: (config: Record<string, unknown>) => void;
    };
  }
}

interface ArticleCardProps {
  article: EnhancedArticle;
}

const MathMLRenderer: React.FC<{ mathml: string }> = ({ mathml }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && window.MathJax) {
      window.MathJax.typesetPromise([ref.current])
        .then(() => {
          // MathJax typesetting is complete
        })
        .catch((err: Error) =>
          console.error("MathJax typesetting failed:", err)
        );
    }
  }, [mathml]);

  return (
    <span
      ref={ref}
      dangerouslySetInnerHTML={{ __html: mathml }}
      className="inline-block align-middle"
    />
  );
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [aiInsights, setAiInsights] = useState<ExtractedFeatures | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mathJaxReady, setMathJaxReady] = useState(false);

  useEffect(() => {
    const checkMathJax = () => {
      if (window.MathJax) {
        setMathJaxReady(true);
      } else {
        setTimeout(checkMathJax, 100);
      }
    };

    checkMathJax();
  }, []);

  const handleAIInsightsClick = async () => {
    if (aiInsights) return; // Don't fetch if we already have insights
    setIsLoading(true);
    setError(null);
    try {
      const features = await extractFeaturesFromAbstract(article.abstract);
      setAiInsights(features);
    } catch (err) {
      setError("Failed to load AI insights");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTitle = (title: string) => {
    if (!mathJaxReady) {
      return title; // Return plain text if MathJax is not ready
    }

    const mathmlRegex = /<math[\s\S]*?<\/math>/g;
    const parts = title.split(mathmlRegex);
    const mathmlElements = title.match(mathmlRegex) || [];

    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {mathmlElements[index] && (
              <MathMLRenderer mathml={mathmlElements[index]} />
            )}
          </React.Fragment>
        ))}
      </span>
    );
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          <div className="max-w-[250px] break-words">
            {typeof article.title === "string"
              ? renderTitle(article.title)
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
        <Accordion type="single" collapsible className="mt-4 w-full">
          <AccordionItem value="ai-insights">
            <AccordionTrigger
              className="text-sm"
              onClick={handleAIInsightsClick}
            >
              <Zap color="#7C3AED" /> AI Insights
            </AccordionTrigger>
            <AccordionContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : aiInsights ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Main Outcome:</strong> {aiInsights.main_outcome}
                  </p>
                  <p>
                    <strong>Methodology:</strong> {aiInsights.methodology}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Click to load AI insights
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
