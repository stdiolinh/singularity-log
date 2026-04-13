"use strict";

/**
 * Static file server + health probe. All dialogue runs in the browser (storyFallback.js).
 */
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 8765;

app.use(
  cors({
    origin: true,
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: "script",
    model: "local-archives",
  });
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`SINGULARITY.LOG http://127.0.0.1:${PORT}/`);
  console.log("Dialogue: keyword scripts in the browser (no cloud API).");
});
