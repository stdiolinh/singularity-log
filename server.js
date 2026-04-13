"use strict";

require("dotenv").config();
const path = require("path");
const express = require("express");
const { buildSystemPrompt } = require("./systemPrompt");

const OpenAI = require("openai");
const { Anthropic } = require("@anthropic-ai/sdk");

const app = express();
const PORT = Number(process.env.PORT) || 8765;
const MAX_MESSAGES = 40;

app.use(express.json({ limit: "120kb" }));

function getProvider() {
  const p = (process.env.AI_PROVIDER || "").toLowerCase();
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

/** OpenAI-style messages: { role: 'user'|'assistant', content: string }[] */
function toAnthropicMessages(openAiMessages) {
  return openAiMessages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
}

app.get("/api/health", (_req, res) => {
  const provider = getProvider();
  res.json({
    ok: true,
    provider: provider || "none",
    model:
      provider === "anthropic"
        ? process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022"
        : process.env.OPENAI_MODEL || "gpt-4o-mini",
  });
});

app.post("/api/chat", async (req, res) => {
  const provider = getProvider();
  if (!provider) {
    return res.status(503).json({
      error: "no_api_key",
      message:
        "No API key configured. Set OPENAI_API_KEY and optionally AI_PROVIDER=openai, or ANTHROPIC_API_KEY and AI_PROVIDER=anthropic. See .env.example.",
    });
  }

  const raw = req.body && req.body.messages;
  if (!Array.isArray(raw)) {
    return res.status(400).json({ error: "invalid_body", message: "Expected { messages: [...] }" });
  }

  const messages = raw
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }))
    .slice(-MAX_MESSAGES);

  if (messages.length === 0) {
    return res.status(400).json({ error: "empty_messages" });
  }

  const trustRaw = req.body && req.body.trust;
  const trustNum =
    trustRaw == null || trustRaw === "" ? 35 : Number(trustRaw);
  const systemPrompt = buildSystemPrompt(
    Number.isFinite(trustNum) ? trustNum : 35
  );

  try {
    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const temperature = Number(process.env.OPENAI_TEMPERATURE);
      const completion = await openai.chat.completions.create({
        model,
        max_tokens: Number(process.env.OPENAI_MAX_TOKENS) || 900,
        temperature: Number.isFinite(temperature) ? temperature : 0.78,
        top_p: 0.95,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        return res.status(502).json({
          error: "empty_response",
          message: "The model returned no text. Try again or check OPENAI_MODEL.",
        });
      }
      return res.json({ reply: text, provider: "openai", model });
    }

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
      const anthropicMessages = toAnthropicMessages(messages);

      const msg = await client.messages.create({
        model,
        max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const block = msg.content && msg.content.find((b) => b.type === "text");
      const text = block && block.type === "text" ? block.text.trim() : "";
      if (!text) {
        return res.status(502).json({ error: "empty_response" });
      }
      return res.json({ reply: text, provider: "anthropic", model });
    }

    return res.status(503).json({ error: "provider_unavailable" });
  } catch (err) {
    console.error("[/api/chat]", err);
    const mapped = mapOpenAIError(err);
    return res.status(mapped.httpStatus).json({
      error: mapped.code,
      message: mapped.message,
    });
  }
});

/** Turn SDK / network errors into safe, actionable client messages. */
function mapOpenAIError(err) {
  const status = err && (err.status || err.statusCode);
  const raw =
    err && err.error && err.error.message
      ? String(err.error.message)
      : err && err.message
        ? String(err.message)
        : "Request to the model provider failed.";

  if (status === 401) {
    return {
      httpStatus: 502,
      code: "invalid_api_key",
      message:
        "OpenAI rejected the API key (401). Check OPENAI_API_KEY in .env on the machine running npm start, then restart the server.",
    };
  }
  if (status === 429) {
    return {
      httpStatus: 502,
      code: "rate_limit",
      message:
        "Rate limit or quota hit (429). Wait a moment, or check billing and usage limits at platform.openai.com.",
    };
  }
  if (status === 404) {
    return {
      httpStatus: 502,
      code: "model_not_found",
      message:
        "Model not found (404). Set OPENAI_MODEL in .env to a model your account can use (e.g. gpt-4o-mini).",
    };
  }
  if (/insufficient_quota|billing|credit/i.test(raw)) {
    return {
      httpStatus: 502,
      code: "billing",
      message:
        "Billing or quota issue on the OpenAI account. Add credits or check plan at platform.openai.com.",
    };
  }

  return {
    httpStatus: 502,
    code: "upstream",
    message: raw.length > 400 ? raw.slice(0, 397) + "…" : raw,
  };
}

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`SINGULARITY.LOG server http://127.0.0.1:${PORT}/`);
  console.log(`API health: http://127.0.0.1:${PORT}/api/health`);
  const p = getProvider();
  if (!p) {
    console.warn("[warn] No OPENAI_API_KEY or ANTHROPIC_API_KEY — /api/chat will return 503; UI falls back to local lines.");
  } else {
    console.log(`[ok] Provider: ${p}`);
  }
});
