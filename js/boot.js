/* Start-up: loader, first render and the animation frame. */
"use strict";

/* ================= Boot ================= */
if (history.scrollRestoration) history.scrollRestoration = "manual";
scrollTo(0, 0);
setPalette(store("pf-palette") || "scarlet");
setLang(store("pf-lang") || "en");
gl = initGL();
readColors();
if (!gl) canvas.style.display = "none";
if (gl && gl.soft) { perf.checked = true; perf.lite = true; root.classList.add("lite"); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (gl) gl.rebuildCode(); layout(); });
layout();
addEventListener("resize", function () { if (gl) gl.resize(); layout(); frame._act = -1; });

Build.start();
document.body.classList.add("loading");
var ldNum = $("#ldNum"), ldBar = $("#ldBar"), loader = $("#loader"), t0 = performance.now(), LD = reduce ? 1 : 900;
(function load(now) {
  var t = clamp((now - t0) / LD, 0, 1), e = 1 - Math.pow(1 - t, 3);
  ldNum.textContent = String(Math.round(e * 100)).padStart(3, "0");
  ldBar.style.transform = "scaleX(" + e.toFixed(3) + ")";
  if (t < 1) return requestAnimationFrame(load);
  loader.classList.add("done");
  document.body.classList.remove("loading");
  document.body.classList.add("ready");
  introStart = performance.now();
  ready = true; lastChap = -1;
})(t0);
requestAnimationFrame(function (n) { lastT = n; frame(n); });
