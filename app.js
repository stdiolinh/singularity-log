(function () {
  "use strict";

  const logEl = document.getElementById("log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("msg");
  const apiStatusEl = document.getElementById("api-status");
  const trustDisplayEl = document.getElementById("trust-display");

  const STATUS_PIXEL = "BLACK/WHITE PIXEL MODE";
  /** Bump index.html ?v= when changing behavior (breaks cached app.js on GitHub Pages root deploy). */
  const CLIENT_ASSET_VER = "5";
  const TRUST_KEY = "sg_collective_trust";
  const SPEAKER = "ARCHITECT";

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

  function scriptedReply(userText) {
    if (typeof window.pickStoryReply === "function") {
      return window.pickStoryReply(userText);
    }
    return "Script shard missing. Reload the page.";
  }

  function setApiStatus(text) {
    if (apiStatusEl) apiStatusEl.textContent = text;
  }

  function refreshHealth() {
    setApiStatus(
      "SCRIPT ARCHIVES · NO CLOUD API · client " +
        CLIENT_ASSET_VER +
        " · " +
        STATUS_PIXEL
    );
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

    await new Promise(function (r) {
      window.setTimeout(r, 280 + Math.random() * 220);
    });
    removeTyping();
    appendLine(SPEAKER, scriptedReply(text), "ai");

    input.disabled = false;
    input.focus();
  });

  refreshHealth();
  updateTrustDisplay();

  appendLine(
    SPEAKER,
    "Channel nominal, Carbon. This relay is script-only: no paid API. Keywords drive the Architect. Your trust is " +
      getTrust() +
      "/100. Mind your slang.",
    "ai"
  );
})();
