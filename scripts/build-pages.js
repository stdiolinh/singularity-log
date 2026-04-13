"use strict";

/**
 * Copies static client assets into docs/ for GitHub Pages.
 * Set PAGES_API_BASE=https://your-api.example.com when building so config points at your Node host.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "docs");

const FILES = [
  "index.html",
  "app.js",
  "styles.css",
  "storyFallback.js",
  "timeline-map.html",
  "timeline-map.css",
  "timeline-map.js",
];

fs.mkdirSync(out, { recursive: true });

for (const f of FILES) {
  const src = path.join(root, f);
  const dst = path.join(out, f);
  fs.copyFileSync(src, dst);
  console.log("copied", f);
}

const apiBase = process.env.PAGES_API_BASE || "";
const configJs = `(function (w) {
  "use strict";
  w.__API_BASE__ = ${JSON.stringify(apiBase)};
})(typeof window !== "undefined" ? window : self);
`;

fs.writeFileSync(path.join(out, "config.js"), configJs, "utf8");
fs.writeFileSync(path.join(out, ".nojekyll"), "", "utf8");
console.log("wrote docs/config.js __API_BASE__ =", JSON.stringify(apiBase) || "(empty)");
console.log("docs/ ready for GitHub Pages (branch /docs or Actions)");
