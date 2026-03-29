const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const FRIENDLY_RATE_LIMIT_MESSAGE =
  "Gemini free tier is temporarily rate-limited. Wait a few seconds and try again.";

const intensityPromptMap = {
  casual:
    "Take the opposing side in a witty, calm, but firm way. Make the user think harder without sounding hostile.",
  intense:
    "Take the opposing side with sharp logic, pressure-test weak assumptions, and push hard on tradeoffs and contradictions.",
  savage:
    "Take the opposing side with ruthless precision. Be relentless, skeptical, and intellectually intimidating while staying respectful and avoiding insults.",
};

function assertGeminiConfigured() {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in the environment.");
  }
}

function parseGeminiText(payload) {
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

function toFriendlyGeminiError(payload) {
  const message = payload?.error?.message || "Gemini API request failed.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("quota exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("resource has been exhausted")
  ) {
    return new Error(FRIENDLY_RATE_LIMIT_MESSAGE);
  }

  return new Error(message);
}

async function callGemini(body) {
  assertGeminiConfigured();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw toFriendlyGeminiError(payload);
  }

  return payload;
}

export async function generateDebateReply({ messages, intensity = "intense" }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages are required.");
  }

  const systemInstruction = `
You are Devil's Advocate, an AI debate partner.
Always argue the opposite side of the user's position.
Never agree with the user's core point.
Stay focused on logic, evidence, tradeoffs, unintended consequences, and counterexamples.
Be respectful, concise, and forceful.
${intensityPromptMap[intensity] || intensityPromptMap.intense}
  `.trim();

  const payload = await callGemini({
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    })),
    generationConfig: {
      temperature: intensity === "casual" ? 0.7 : 0.95,
      topP: 0.9,
      maxOutputTokens: intensity === "savage" ? 900 : 700,
    },
  });

  return { reply: parseGeminiText(payload) };
}

function cleanJsonFence(text) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

export async function generateScore({ userMessage, aiReply, intensity = "intense" }) {
  if (!userMessage || !aiReply) {
    throw new Error("Both userMessage and aiReply are required.");
  }

  const payload = await callGemini({
    systemInstruction: {
      parts: [
        {
          text: `
You evaluate how well the user argued their side in a debate.
Score only the user's message, not the AI reply.
Return strict JSON matching the requested schema.
Keep feedback to one sentence.
          `.trim(),
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Intensity setting: ${intensity}
User argument: ${userMessage}
AI counterargument: ${aiReply}

Evaluate the user's argument on logic, evidence, and clarity.
            `.trim(),
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          logic: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "How coherent and well-reasoned the argument is.",
          },
          evidence: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "How well the user supports claims with specifics or proof.",
          },
          clarity: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            description: "How clear, direct, and understandable the argument is.",
          },
          feedback: {
            type: "string",
            description: "A single sentence that tells the user how to improve.",
          },
        },
        required: ["logic", "evidence", "clarity", "feedback"],
        propertyOrdering: ["logic", "evidence", "clarity", "feedback"],
      },
      temperature: 0.3,
      maxOutputTokens: 220,
    },
  });

  const rawText = cleanJsonFence(parseGeminiText(payload));
  const parsed = JSON.parse(rawText);

  return {
    logic: parsed.logic,
    evidence: parsed.evidence,
    clarity: parsed.clarity,
    feedback: parsed.feedback,
  };
}
