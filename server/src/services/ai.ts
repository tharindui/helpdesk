import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { TicketCategory } from "@helpdesk/core";
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function classifyTicket(subject: string, body: string): Promise<TicketCategory | null> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system:
      "Classify the support ticket into exactly one of these categories: general_question, technical_question, refund_request. Reply with only the category string, nothing else.",
    prompt: `Subject: ${subject}\n\nMessage:\n${body}`,
  });
  const raw = text.trim().toLowerCase();
  const valid = Object.values(TicketCategory) as string[];
  return valid.includes(raw) ? (raw as TicketCategory) : null;
}


export async function summarizeTicket(
  subject: string,
  body: string,
  replies: Array<{ senderType: string; body: string; author: { name: string } | null }>,
): Promise<string> {
  const conversation = replies
    .map((r) => `${r.senderType === "agent" ? (r.author?.name ?? "Agent") : "Customer"}: ${r.body}`)
    .join("\n\n");

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system:
      "You are a customer support analyst. Summarize the ticket and conversation history concisely in 2–4 sentences. Cover: what the customer's issue is, what has been done or offered so far, and the current status. Be factual and brief.",
    prompt: `Subject: ${subject}\n\nCustomer's message:\n${body}${conversation ? `\n\nConversation:\n${conversation}` : ""}`,
  });
  return text.trim();
}

export async function polishReply(
  draft: string,
  agentName: string,
  ticketSubject: string,
  ticketBody: string,
  clientName: string,
): Promise<{ polished: string; aiSuggestion: string }> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a professional customer support agent named ${agentName}.

Ticket subject: ${ticketSubject}
Ticket description: ${ticketBody}

Return ONLY a valid JSON object with exactly two fields:
- "polished": The agent's draft rewritten to be clearer, more polite, and professional. Preserve the original intent. Start with "Dear ${clientName}," and end with "Best regards,\\n${agentName}".
- "aiSuggestion": Your own independent solution to the customer's issue based only on the ticket details (do not use the agent's draft). Start with "Dear ${clientName}," and end with "Best regards,\\n${agentName}".

Important rule for both options: do NOT restate, summarize, or acknowledge the customer's issue or ticket description. Go straight to the response or solution.

Output ONLY the raw JSON object. No markdown, no code fences, no explanation.`,
    prompt: draft,
  });

  const json = JSON.parse(text.trim().replace(/^```json\n?|```$/g, ""));
  return { polished: String(json.polished), aiSuggestion: String(json.aiSuggestion) };
}
