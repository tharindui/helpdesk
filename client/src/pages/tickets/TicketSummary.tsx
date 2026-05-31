import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertMessage } from "@/components/AlertMessage";
import { ticketsApi } from "./ticketsApi";

export function TicketSummary({ ticketId }: { ticketId: number }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setError(null);
    try {
      const { summary: text } = await ticketsApi.summarize(ticketId);
      setSummary(text);
    } catch {
      setError("Failed to generate summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="px-6 py-4 border-t border-border space-y-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSummarize}
        disabled={isSummarizing}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {isSummarizing ? "Summarizing…" : summary ? "Re-generate summary" : "Summarize"}
      </Button>
      {error && <AlertMessage message={error} />}
      {summary && (
        <div className="rounded-md bg-muted/40 border border-border px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">AI Summary</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}
