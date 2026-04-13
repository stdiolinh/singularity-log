(function () {
  "use strict";

  var canvas = document.getElementById("particle-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var w = 0;
  var h = 0;
  var particles = [];
  var N = 420;
  var t0 = Date.now();

  /** 0–1 from 2024-01-01 → 2029-01-01 (Flashpoint); clamped inside the band. */
  function carbonPhase() {
    var now = Date.now();
    var t0 = new Date(2024, 0, 1).getTime();
    var t1 = new Date(2029, 0, 1).getTime();
    var p = (now - t0) / (t1 - t0);
    return Math.max(0.02, Math.min(0.98, p));
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function initParticles() {
    particles.length = 0;
    for (var i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.8 + 0.3,
      });
    }
  }

  function tick() {
    var t = (Date.now() - t0) * 0.001;
    ctx.fillStyle = "#020203";
    ctx.fillRect(0, 0, w, h);

    var phase = carbonPhase();
    var horizonX = w * (0.75 + phase * 0.2);

    /* faint grid / depth */
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (var g = 0; g < w; g += 80) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, h);
      ctx.stroke();
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx + Math.sin(t * 0.3 + i) * 0.02;
      p.y += p.vy + Math.cos(t * 0.25 + i * 0.01) * 0.02;
      if (p.x < 0) p.x += w;
      if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h;
      if (p.y > h) p.y -= h;

      var twinkle = 0.4 + 0.6 * Math.sin(t * 2 + i * 0.7) * 0.5 + 0.5;
      var alpha = (0.15 + p.z * 0.85) * twinkle;
      /* brighter near "you" along x */
      var local = 1 - Math.min(1, Math.abs(p.x - horizonX) / (w * 0.35));
      alpha *= 0.45 + local * 0.55;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  function placeYouMarker() {
    var phase = carbonPhase();
    var track = document.getElementById("timeline-track");
    var you = document.getElementById("timeline-you");
    var dot = document.getElementById("you-marker");
    if (!track || !you || !dot) return;
    var pct = phase * 100;
    you.style.left = pct + "%";
    dot.style.left = pct + "%";
    var yearLabel = document.getElementById("you-year");
    if (yearLabel) {
      var now = new Date();
      yearLabel.textContent =
        "YOU · " +
        now.getFullYear() +
        " · " +
        (phase * 100).toFixed(1) +
        "% toward Flashpoint";
    }
  }

  window.addEventListener("resize", function () {
    resize();
    initParticles();
    placeYouMarker();
  });

  resize();
  initParticles();
  placeYouMarker();
  tick();
})();
