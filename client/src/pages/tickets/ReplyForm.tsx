import { Sentry } from "@/lib/sentry";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReplySchema, type CreateReplyData } from "@helpdesk/core";
import { AlertMessage } from "@/components/AlertMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ticketsApi } from "./ticketsApi";

type ReplyOptions = { polished: string; aiSuggestion: string };

export function ReplyForm({
  ticketId,
  onSubmit,
  isPending,
  isError,
}: {
  ticketId: number;
  onSubmit: (body: string) => void;
  isPending: boolean;
  isError: boolean;
}) {
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [replyOptions, setReplyOptions] = useState<ReplyOptions | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
  } = useForm<CreateReplyData>({
    resolver: zodResolver(createReplySchema),
  });

  const body = watch("body");
  const isEmpty = !body?.trim();

  const submit = (data: CreateReplyData) => {
    onSubmit(data.body);
    reset();
    setReplyOptions(null);
  };

  const handlePolish = async () => {
    const draft = getValues("body");
    if (!draft?.trim()) return;
    setPolishError(null);
    setReplyOptions(null);
    setIsPolishing(true);
    try {
      const options = await ticketsApi.polishReply(ticketId, draft);
      setReplyOptions(options);
    } catch (err) {
      Sentry.captureException(err);
      setPolishError("Failed to polish reply. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  const useOption = (text: string) => {
    setValue("body", text, { shouldValidate: true });
    setReplyOptions(null);
  };

  return (
    <div className="rounded-lg border border-border bg-background px-6 py-5 space-y-3">
      <h2 className="text-sm font-medium text-foreground">Write a reply</h2>
      <form onSubmit={handleSubmit(submit)} className="space-y-3">
        <Textarea
          {...register("body")}
          placeholder="Type your reply..."
          rows={4}
          disabled={isPending || isPolishing}
        />

        {replyOptions && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Choose a reply option:</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { label: "Your reply (polished)", text: replyOptions.polished },
                  { label: "AI suggestion", text: replyOptions.aiSuggestion },
                ] as const
              ).map(({ label, text }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3"
                >
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap overflow-y-auto max-h-28 leading-relaxed">
                    {text}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => useOption(text)}
                  >
                    Use this
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {polishError && <AlertMessage message={polishError} />}
        {isError && <AlertMessage message="Failed to send reply. Please try again." />}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePolish}
            disabled={isEmpty || isPending || isPolishing}
          >
            {isPolishing ? "Polishing…" : "Polish"}
          </Button>
          <Button type="submit" disabled={isEmpty || isPending || isPolishing}>
            {isPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
