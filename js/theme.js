/* Colour themes and the swatch buttons. */
"use strict";

/* ================= Theme ================= */
var PALETTES = [
  { id: "scarlet", name: "Scarlet", c: "#ff2b2b" },
  { id: "dusk", name: "Dark Sunset", c: "#ff6a13" },
  { id: "paper", name: "Paper Red", c: "#e62020", light: true },
  { id: "sunset", name: "Sunset", c: "#f05a0a", light: true }
];
var sw = $("#swatches");
PALETTES.forEach(function (p) {
  var b = document.createElement("button");
  b.type = "button"; b.className = "swatch" + (p.light ? " lt" : ""); b.style.setProperty("--c", p.c);
  b.title = p.name; b.setAttribute("aria-label", p.name); b.dataset.id = p.id;
  b.addEventListener("click", function () { vt(function () { setPalette(p.id); }); });
  sw.appendChild(b);
});
function vt(fn) { if (document.startViewTransition && !reduce) document.startViewTransition(fn); else fn(); }
var isLight = false;
function setPalette(id) {
  var pal = PALETTES.filter(function (p) { return p.id === id; })[0];
  if (!pal) { pal = PALETTES[0]; id = pal.id; }
  if (id === "scarlet") root.removeAttribute("data-palette"); else root.setAttribute("data-palette", id);
  isLight = !!pal.light;
  root.classList.toggle("is-light", isLight);
  $$(".swatch").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.id === id)); });
  store("pf-palette", id);
  readColors();
}
$("#lang").addEventListener("change", function (e) { vt(function () { setLang(e.target.value); }); });

