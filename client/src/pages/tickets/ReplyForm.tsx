import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReplySchema, type CreateReplyData } from "@helpdesk/core";
import { AlertMessage } from "@/components/AlertMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ticketsApi } from "./ticketsApi";

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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateReplyData>({
    resolver: zodResolver(createReplySchema),
  });

  const body = watch("body");
  const isEmpty = !body?.trim();

  const submit = (data: CreateReplyData) => {
    onSubmit(data.body);
    reset();
  };

  const handlePolish = async () => {
    const draft = getValues("body");
    if (!draft?.trim()) return;
    setPolishError(null);
    setIsPolishing(true);
    try {
      const { body: polished } = await ticketsApi.polishReply(ticketId, draft);
      setValue("body", polished, { shouldValidate: true });
    } catch {
      setPolishError("Failed to polish reply. Please try again.");
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background px-6 py-5 space-y-3">
      <h2 className="text-sm font-medium text-foreground">Write a reply</h2>
      <form onSubmit={handleSubmit(submit)} className="space-y-3">
        <div>
          <Textarea
            {...register("body")}
            placeholder="Type your reply..."
            rows={4}
            aria-invalid={!!errors.body}
            disabled={isPending || isPolishing}
          />
        </div>
        {polishError && <AlertMessage message={polishError} />}
        {isError && (
          <AlertMessage message="Failed to send reply. Please try again." />
        )}
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
