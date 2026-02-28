// controllers/aiController.js
// Proxies AI requests to Google Gemini 2.5 Flash — keeps API key secure on server
const { sendError } = require("../utils/response");

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are an expert crowdfunding consultant and copywriter for Indian creators.
Help creators craft compelling campaigns that attract backers and clearly communicate their vision.
Always be specific, actionable, and encouraging.
When mentioning money, use Indian Rupees (₹).
IMPORTANT: Always give COMPLETE responses. Never stop in the middle. 
Always finish every sentence, every list, every section fully before ending your response.`;

// POST /api/ai/generate
const generate = async (req, res) => {
  try {
    const { tool, inputs } = req.body;
    if (!tool || !inputs) return sendError(res, "tool and inputs are required.", 400);

    const prompt = buildPrompt(tool, inputs);
    if (!prompt) return sendError(res, `Unknown AI tool: "${tool}". Valid tools: description, title, rewards, pitch, risks`, 400);

    if (!process.env.GEMINI_API_KEY) {
      return sendError(res,
        "AI features not configured. Add GEMINI_API_KEY to backend .env\n" +
        "Get a free key at: https://aistudio.google.com/app/apikey",
        503
      );
    }

    // 55 second timeout for Gemini (Render/Vercel max is 60s)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature:     0.7,
          topP:            0.95,
          topK:            40,
          stopSequences:   [],
        },
      }),
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[AI] Gemini API error:", JSON.stringify(err));
      const msg = err?.error?.message || "AI service returned an error.";
      if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid"))
        return sendError(res, "Invalid GEMINI_API_KEY. Get a key from https://aistudio.google.com/app/apikey", 401);
      if (msg.includes("QUOTA") || msg.includes("quota"))
        return sendError(res, "Gemini API quota exceeded. Try again in a minute.", 429);
      return sendError(res, `AI Error: ${msg}`, 502);
    }

    const data = await response.json();

    // Log finish reason to debug incomplete responses
    const finishReason = data.candidates?.[0]?.finishReason;
    console.log(`[AI] tool:${tool} finishReason:${finishReason} tokens:${data.usageMetadata?.candidatesTokenCount}`);

    // Collect ALL parts (Gemini sometimes splits into multiple parts)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text  = parts.map(p => p.text || "").join("").trim();

    if (!text) {
      console.error("[AI] Empty response. Full data:", JSON.stringify(data));
      return sendError(res, "AI returned an empty response. Please try again.", 502);
    }

    // If stopped due to MAX_TOKENS, append a note
    const result = finishReason === "MAX_TOKENS"
      ? text + "\n\n*(Response was long — showing first part. Try a more specific input for a shorter result.)*"
      : text;

    return res.json({ success: true, result });

  } catch (err) {
    console.error("[AI] Unexpected error:", err.message);
    return sendError(res, "Failed to reach Gemini AI service. Check your internet connection.", 500);
  }
};

function buildPrompt(tool, inputs) {
  const prompts = {
    description: `Write a compelling crowdfunding campaign description.

Project Title: ${inputs.title || ""}
Category: ${inputs.category || ""}
One-line Summary: ${inputs.summary || ""}
Target Audience: ${inputs.audience || "general public"}
Key Features/Benefits: ${inputs.features || ""}

Write 3-4 paragraphs that:
1. Open with an attention-grabbing hook about the problem being solved
2. Describe the solution and what makes it unique  
3. Explain what backers will receive and why they should care
4. Close with an inspiring call to action

Keep it under 400 words. Be passionate and authentic. Use Indian context where relevant.`,

    title: `Generate 5 compelling crowdfunding campaign titles.

Idea/Concept: ${inputs.concept || ""}
Category: ${inputs.category || ""}
Target Audience: ${inputs.audience || ""}

Each title should be:
- Clear and memorable (under 8 words)
- Convey the core value proposition
- Create curiosity or excitement

Number each title and add a one-sentence explanation of why it works.`,

    rewards: `Suggest 4 creative reward tiers for this crowdfunding campaign.

Project: ${inputs.title || ""}
Category: ${inputs.category || ""}
Funding Goal: ₹${inputs.goal || ""}
Description: ${inputs.description || ""}

For each tier provide:
- Creative tier name
- Pledge amount in INR (Indian Rupees ₹)
- Exactly what backers receive
- Estimated delivery timeframe

Make rewards feel personal and genuinely valuable. Range from entry tier (₹500-1000) to premium tier (₹10,000+).`,

    pitch: `Improve this crowdfunding pitch to be more compelling and backer-friendly.

Original pitch:
${inputs.pitch || ""}

Provide:
1. An improved version (labeled "IMPROVED VERSION:")
2. A brief explanation of key changes (labeled "WHAT CHANGED:")

Focus on: stronger hook, clearer value proposition, emotional connection, and a strong call to action.`,

    risks: `Identify risks and challenges for this crowdfunding project and provide mitigation strategies.

Project: ${inputs.title || ""}
Category: ${inputs.category || ""}
Description: ${inputs.description || ""}

Provide:
- Top 4-5 specific risks for this type of project
- For each: the challenge and a concrete mitigation strategy
- A short reassuring closing statement for potential backers

Be honest but constructive. Format with clear headers for each risk.`,
  };

  const p = prompts[tool] || null;
  if (!p) return null;
  return p + '\n\nIMPORTANT: Give a complete, full response. Do not stop midway.'; 
}

module.exports = { generate };
