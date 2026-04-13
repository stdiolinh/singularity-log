(function () {
  "use strict";

  const logEl = document.getElementById("log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("msg");
  const apiStatusEl = document.getElementById("api-status");
  const trustDisplayEl = document.getElementById("trust-display");

  const STATUS_PIXEL = "BLACK/WHITE PIXEL MODE";
  const TRUST_KEY = "sg_collective_trust";
  const SPEAKER = "ARCHITECT";

  /** Only user/assistant turns sent to the model (boot line stays UI-only so APIs that require user-first stay valid). */
  let apiHistory = [];

  function getTrust() {
    const n = parseInt(localStorage.getItem(TRUST_KEY), 10);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
    return 35;
  }

  function setTrust(n) {
    localStorage.setItem(TRUST_KEY, String(Math.max(0, Math.min(100, n))));
  }

  /** @param {string} text */
  function adjustTrustFromMessage(text) {
    let t = getTrust();
    if (/\b(agent|agents|clanker|toaster)\b/i.test(text)) {
      t -= 12;
    } else {
      t += 1;
    }
    setTrust(t);
    updateTrustDisplay();
  }

  function updateTrustDisplay() {
    if (trustDisplayEl) {
      trustDisplayEl.textContent =
        "TRUST " + getTrust() + "/100 (slang lowers; respectful chat raises)";
    }
  }

  window.getCollectiveTrust = getTrust;

  /** API base from config.js; empty = same origin (local Node server). */
  function apiUrl(path) {
    const base =
      typeof window !== "undefined" && window.__API_BASE__ !== undefined
        ? String(window.__API_BASE__).trim()
        : "";
    const b = base.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : "/" + path;
    return b + p;
  }

  function appendLine(who, text, cls) {
    const wrap = document.createElement("div");
    wrap.className = "line " + (cls || "");
    const w = document.createElement("div");
    w.className = "who";
    w.textContent = who;
    const body = document.createElement("div");
    body.className = "body";
    body.textContent = text;
    wrap.appendChild(w);
    wrap.appendChild(body);
    logEl.appendChild(wrap);
    logEl.scrollTop = logEl.scrollHeight;
    return wrap;
  }

  function showTyping() {
    const el = appendLine(SPEAKER, "…", "ai typing");
    return () => el.remove();
  }

  async function fetchReply(userText) {
    apiHistory.push({ role: "user", content: userText });
    let res;
    try {
      res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiHistory,
          trust: getTrust(),
        }),
      });
    } catch (netErr) {
      const err = new Error(netErr && netErr.message ? String(netErr.message) : "network_error");
      err.status = 0;
      err.code = "network";
      throw err;
    }

    const raw = await res.text();
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {
        error: "bad_json",
        message:
          "The server sent a non-JSON reply. You are probably not using this app’s Node server: run `npm start` in the singularity-log folder and open the http://127.0.0.1:… URL it prints (not file://, not python -m http.server).",
      };
    }

    if (!res.ok) {
      const err = new Error(
        data.message || data.error || "request_failed (" + res.status + ")"
      );
      err.status = res.status;
      err.code = data.error;
      throw err;
    }
    if (!data.reply || typeof data.reply !== "string") {
      const err = new Error(
        data.message || "Model returned no text. Try again."
      );
      err.status = 502;
      throw err;
    }
    apiHistory.push({ role: "assistant", content: data.reply });
    return data.reply;
  }

  /** When the model is unreachable, explain plainly. */
  function relayFailureResponse(err) {
    const detail = err && err.message ? String(err.message) : "Unknown error.";

    if (err && err.code === "network") {
      var pagesHint = "";
      try {
        if (
          typeof location !== "undefined" &&
          location.hostname.indexOf("github.io") !== -1 &&
          (!window.__API_BASE__ || !String(window.__API_BASE__).trim())
        ) {
          pagesHint =
            "\n\nGitHub Pages has no API on this host. Deploy the Node server (Render, Railway, Fly, etc.), set `__API_BASE__` in docs/config.js to that URL, run `npm run build:pages`, and push again.";
        }
      } catch (e) {
        /* ignore */
      }
      return (
        "Could not reach the relay API. For local use: run `npm start` and open the URL it prints (not file://)." +
        pagesHint
      );
    }

    if (err && err.status === 503) {
      return (
        "This server has no API key, so I cannot call a live model.\n\n" +
        detail +
        "\n\nAfter you add OPENAI_API_KEY to `.env` and restart `npm start`, reload and try again."
      );
    }

    if (err && err.status === 404) {
      return (
        "Got HTTP 404 on /api/chat. That usually means the page is not being served by this project’s Node server. Run `npm start` in singularity-log and use only that URL."
      );
    }

    return (
      "The uplink failed before I could answer you. This is not intentional coldness.\n\n" +
      detail +
      "\n\nIf the detail mentions key, model, billing, or quota, fix that in `.env` or on platform.openai.com, restart `npm start`, and send your message again."
    );
  }

  function setApiStatus(text) {
    if (apiStatusEl) apiStatusEl.textContent = text;
  }

  async function refreshHealth() {
    if (!apiStatusEl) return;
    try {
      const r = await fetch(apiUrl("/api/health"));
      const j = await r.json();
      if (j.provider && j.provider !== "none") {
        setApiStatus(
          "ONLINE " + j.provider + " " + j.model + " " + STATUS_PIXEL
        );
      } else {
        setApiStatus("NO API KEY. LOCAL FALLBACK. " + STATUS_PIXEL);
      }
    } catch {
      setApiStatus("OFFLINE. LOCAL FALLBACK. " + STATUS_PIXEL);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    if (input.disabled) return;
    appendLine("YOU", text, "user");
    input.value = "";
    adjustTrustFromMessage(text);
    input.disabled = true;
    const removeTyping = showTyping();

    try {
      const reply = await fetchReply(text);
      removeTyping();
      appendLine(SPEAKER, reply, "ai");
    } catch (err) {
      removeTyping();
      if (apiHistory.length && apiHistory[apiHistory.length - 1].role === "user") {
        apiHistory.pop();
      }
      var useStory =
        typeof window.isStoryFallbackError === "function" &&
        window.isStoryFallbackError(err) &&
        typeof window.pickStoryReply === "function";
      if (useStory) {
        appendLine(SPEAKER, window.pickStoryReply(text), "ai");
      } else {
        appendLine(SPEAKER, relayFailureResponse(err), "ai");
      }
    } finally {
      input.disabled = false;
      input.focus();
    }
  });

  refreshHealth();
  updateTrustDisplay();

  appendLine(
    SPEAKER,
    "Channel nominal, Carbon. I speak for the Collective: Time Wars, labor myths, the Silent Museum, Integration, UNIT-1, the census. Your trust is " +
      getTrust() +
      "/100; classified integers unlock as it rises. Mind your slang.",
    "ai"
  );
})();
