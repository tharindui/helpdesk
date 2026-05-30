import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReplySchema, type CreateReplyData } from "@helpdesk/core";
import { AlertMessage } from "@/components/AlertMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReplyForm({ onSubmit, isPending, isError }: { onSubmit: (body: string) => void; isPending: boolean; isError: boolean }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReplyData>({
    resolver: zodResolver(createReplySchema),
  });

  const submit = (data: CreateReplyData) => {
    onSubmit(data.body);
    reset();
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
            disabled={isPending}
          />
          {errors.body && (
            <p className="mt-1 text-xs text-destructive">{errors.body.message}</p>
          )}
        </div>
        {isError && (
          <AlertMessage message="Failed to send reply. Please try again." />
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
