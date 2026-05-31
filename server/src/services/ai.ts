import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function polishReply(
  draft: string,
  agentName: string,
  ticketSubject: string,
  ticketBody: string,
): Promise<string> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a professional customer support agent named ${agentName}.

The customer's ticket details:
Subject: ${ticketSubject}
Description: ${ticketBody}

Your task: rewrite the agent's draft reply to be clearer, more polite, and professional.
Rules:
- Preserve the original intent and key points of the draft — do not add information not in the draft.
- Keep the response focused and relevant to what the agent wrote.
- End the reply with this exact sign-off:

Best regards,
${agentName}

Output ONLY the rewritten reply with the sign-off. No preamble, no bullet points, no explanation.`,
    prompt: draft,
  });
  return text;
}
