"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import type { AISummaryRequest, AISummaryResponse } from "@/lib/types";

interface ExecutiveSummaryProps {
  summaryRequest: AISummaryRequest;
  autoGenerate?: boolean;
  onSummaryGenerated?: (summary: string) => void;
}

/**
 * ExecutiveSummary component
 *
 * Displays an AI-generated executive summary of retirement plan fee benchmarking results.
 * Calls Azure OpenAI via the /api/ai-summary endpoint to generate natural language insights.
 */
export function ExecutiveSummary({ summaryRequest, autoGenerate = false, onSummaryGenerated }: ExecutiveSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (autoGenerate && !hasGenerated) {
      generateSummary();
    }
  }, [autoGenerate, hasGenerated]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(summaryRequest),
      });

      const data: AISummaryResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSummary(data.summary);
      setHasGenerated(true);

      // Notify parent component if callback provided
      if (onSummaryGenerated) {
        onSummaryGenerated(data.summary);
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  // Format the summary with basic markdown-like formatting
  const formatSummary = (text: string) => {
    if (!text) return null;

    // Split into paragraphs
    const paragraphs = text.split("\n\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, index) => {
      // Handle bold text (convert **text** to <strong>text</strong>)
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      const formatted = parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <p key={index} className="mb-4 last:mb-0 text-muted-foreground leading-relaxed">
          {formatted}
        </p>
      );
    });
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Executive Summary
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your fee benchmarking results
            </CardDescription>
          </div>
          <Button
            onClick={generateSummary}
            disabled={loading}
            variant={hasGenerated ? "outline" : "default"}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : hasGenerated ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing your fee data and generating insights...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium mb-1">Failed to generate summary</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Please ensure Azure OpenAI credentials are configured in your environment variables.
            </p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="prose prose-sm max-w-none">
            <div className="space-y-4 text-sm">{formatSummary(summary)}</div>
          </div>
        )}

        {!loading && !error && !summary && !hasGenerated && (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Summary&quot; to create an AI-powered analysis of your benchmarking results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
