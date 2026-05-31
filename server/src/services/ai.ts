import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

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
