/* Jump to a section when a nav link or dock button is clicked. */
"use strict";

/* ================= Smooth scroll ================= */
function goTo(name) {
  var y = 0;
  if (name === "process") y = story.offsetTop + innerHeight * 1.02;
  else if (name !== "intro") { var el = document.getElementById(name); if (!el) return; y = el.getBoundingClientRect().top + scrollY; }
  scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-go]");
  if (!t) return;
  e.preventDefault(); goTo(t.getAttribute("data-go"));
});
$("#orb").addEventListener("click", function () { var f = $("#f-name"); var y = $("#form").getBoundingClientRect().top + scrollY - 120; scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); setTimeout(function () { f.focus({ preventScroll: true }); }, 700); });

