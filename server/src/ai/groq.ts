import { env } from "../config/env";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  model: string,
  system: string,
  userMessages: { role: "user" | "assistant"; content: string }[],
  maxTokens = 1024
): Promise<string> {
  const messages: Message[] = [{ role: "system", content: system }, ...userMessages];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function* streamGroq(
  model: string,
  system: string,
  userMessages: { role: "user" | "assistant"; content: string }[],
  maxTokens = 1024
): AsyncGenerator<string> {
  const messages: Message[] = [{ role: "system", content: system }, ...userMessages];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: true }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text();
    throw new Error(`Groq API error (${res.status}): ${body}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;

      try {
        const event = JSON.parse(payload);
        const delta = event.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }
}
