import DOMPurify from "dompurify";
import { SenderType } from "@helpdesk/core";
import { type Reply } from "./ticketsApi";

type Props = { replies: Reply[] };

export function ReplyThread({ replies }: Props) {
  return (
    <div className="px-6 py-5 space-y-4">
      <h2 className="text-sm font-medium text-foreground">
        {replies.length === 0 ? "No replies yet" : `Replies (${replies.length})`}
      </h2>
      {replies.map((reply) => {
        const isAgent = reply.senderType === SenderType.agent;
        const isAI = reply.senderType === SenderType.ai;
        const senderLabel = isAgent ? reply.author?.name : isAI ? "AI Support" : "Customer";
        return (
          <div key={reply.id} className={`flex ${isAgent || isAI ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg border px-4 py-3 space-y-1 ${isAgent || isAI ? "bg-primary/10 border-primary/20" : "bg-muted border-border"}`}>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {senderLabel}
                </span>
                <span>·</span>
                <span>
                  {new Date(reply.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {reply.bodyHTML ? (
                <div
                  className="text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.bodyHTML) }}
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{reply.body}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
