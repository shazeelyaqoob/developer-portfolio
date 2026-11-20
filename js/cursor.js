/* Custom cursor, magnetic buttons and the copy-email button. */
"use strict";

/* ================= Cursor + magnetic ================= */
var cur = $(".cur"), ring = $(".cur-ring");
var px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py, nmx = 0, nmy = 0;
addEventListener("pointermove", function (e) {
  if (!document.body.classList.contains("moved")) { document.body.classList.add("moved"); rx = e.clientX; ry = e.clientY; }
  px = e.clientX; py = e.clientY;
  nmx = (px / innerWidth) * 2 - 1; nmy = (py / innerHeight) * 2 - 1;
  var t = e.target.closest ? e.target.closest("a, button, select, input, textarea, .svc, .card") : null;
  ring.classList.toggle("hover", !!t);
  ring.classList.toggle("drag", !!(t && t.classList.contains("card")));
}, { passive: true });
var magnets = $$(".magnetic");
magnets.forEach(function (m) {
  m.addEventListener("pointermove", function (e) {
    if (coarse || reduce) return;
    var r = m.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    m.style.setProperty("--mx", (dx * 0.28).toFixed(1) + "px"); m.style.setProperty("--my", (dy * 0.35).toFixed(1) + "px");
  });
  m.addEventListener("pointerleave", function () { m.style.setProperty("--mx", "0px"); m.style.setProperty("--my", "0px"); });
});

/* Card tilt + glare */
$$(".card").forEach(function (c) {
  var inn = c.querySelector(".in");
  c.addEventListener("pointermove", function (e) {
    if (coarse || reduce) return;
    var r = inn.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    inn.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
    inn.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
    inn.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); inn.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
  });
  c.addEventListener("pointerleave", function () { inn.style.setProperty("--rx", "0deg"); inn.style.setProperty("--ry", "0deg"); });
});

/* Copy + form */
var copyBtn = $("#copy");
copyBtn.addEventListener("click", function () {
  var el = $("#email");
  function ok() { copyBtn.textContent = T[lang].copied; setTimeout(function () { copyBtn.textContent = T[lang].copy; }, 1600); }
  function fb() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  try { navigator.clipboard.writeText(el.textContent).then(ok, fb); } catch (e) { fb(); }
});
$("#form").addEventListener("submit", function (e) {
  e.preventDefault();
  var em = $("#f-email"), msg = $("#formMsg");
  if (!/^\S+@\S+\.\S+$/.test(em.value.trim())) { msg.textContent = T[lang].err_email; em.focus(); return; }
  msg.textContent = T[lang].sent;
});
$("#f-email").addEventListener("input", function () { $("#formMsg").textContent = ""; });

