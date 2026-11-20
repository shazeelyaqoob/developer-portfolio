/* Element lookups, layout measuring and the counter. */
"use strict";

/* ================= Elements ================= */
var story = $("#story"), chaps = $$(".chap"), dial = $("#dial"), dialLbl = $("#dialLbl");
var rail = $("#rail"), railBar = $("#railBar"), railNum = $("#railNum"), hint = $("#hint");
var reel = $("#work"), track = $("#track"), reelBar = $("#reelBar"), reelNum = $("#reelNum"), cards = $$(".card");
var contact = $("#contact"), big = $("#big"), cnt = $("#cnt"), mqA = $("#mqA"), mqB = $("#mqB");
var dockBtns = $$("#dockBtns button"), pill = $("#pill"), dockStat = $("#dockStat");
var lastChap = -1, cntAnim = 0;

function layout() {
  // Reel height = horizontal travel + one screen
  var travel = Math.max(0, track.scrollWidth - innerWidth);
  reel.style.height = (travel + innerHeight) + "px";
  reel._travel = travel;
  mqA._w = mqA.scrollWidth; mqB._w = mqB.scrollWidth;
  dockBtns.forEach(function (b) { b._w = b.offsetWidth; b._l = b.offsetLeft; });
  frame._act = -1;
}

/* Reveal on view */
var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting && !e.target.classList.contains("pc-wait")) { e.target.classList.add("on"); if (e.target.classList.contains("card")) e.target.classList.add("seen"); } });
}, { threshold: 0.18 }) : null;
$$(".rv, .card, #ctTitle").forEach(function (el) { if (io) io.observe(el); else el.classList.add("on", "seen"); });

function runCounter() {
  var start = performance.now(), to = 40, dur = reduce ? 1 : 1400; cancelAnimationFrame(cntAnim);
  (function tick(now) { var t = clamp((now - start) / dur, 0, 1), e = 1 - Math.pow(1 - t, 4); cnt.textContent = Math.round(to * e); if (t < 1) cntAnim = requestAnimationFrame(tick); })(start);
}

