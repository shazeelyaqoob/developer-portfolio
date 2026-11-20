/* Dial ticks and arc around the planet. */
"use strict";

/* ================= Dial ticks ================= */
(function () {
  var g = $("#ticks"), s = "";
  for (var i = 0; i < 120; i++) {
    var a = i / 120 * Math.PI * 2, long = i % 10 === 0, r1 = long ? 84 : 88, r2 = 92;
    s += '<line x1="' + (Math.cos(a) * r1).toFixed(2) + '" y1="' + (Math.sin(a) * r1).toFixed(2) + '" x2="' + (Math.cos(a) * r2).toFixed(2) + '" y2="' + (Math.sin(a) * r2).toFixed(2) + '" stroke="var(--fg)" stroke-opacity="' + (long ? .55 : .2) + '" stroke-width="' + (long ? 1.2 : .8) + '"/>';
  }
  g.innerHTML = s;
})();
var arc = $("#arc"), ARC_LEN = 2 * Math.PI * 96;
arc.style.strokeDasharray = ARC_LEN; arc.style.strokeDashoffset = ARC_LEN;

