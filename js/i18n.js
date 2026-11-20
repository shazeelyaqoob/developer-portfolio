/* Language switching. The text itself lives in translations.js. */
"use strict";

/* i18n: the T object lives in translations.js */
var RTL = { ur: 1, ar: 1 };
var CH_KEYS = ["intro", "ch1_k", "ch2_k", "ch3_k", "ch4_k", "ch5_k"];
var lang = "en", isRtl = false;

function splitWords(el, html) {
  var tmp = document.createElement("div"); tmp.innerHTML = html;
  var out = "", i = 0;
  function words(text, em) {
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { out += " "; return; }
      out += '<span class="w"><span style="--i:' + (i++) + '">' + (em ? "<em>" + part + "</em>" : part) + "</span></span>";
    });
  }
  [].forEach.call(tmp.childNodes, function (n) {
    if (n.nodeType === 3) words(n.textContent, false);
    else words(n.textContent, n.nodeName === "EM");
  });
  el.innerHTML = out;
}
function splitScrub(el, text) {
  el.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w2">' + w + "</span>"; }).join(" ");
}

function setLang(l) {
  if (!T[l]) l = "en";
  lang = l; isRtl = !!RTL[l];
  var d = T[l];
  root.lang = l; root.dir = isRtl ? "rtl" : "ltr";
  $$("[data-i18n]").forEach(function (el) {
    var k = el.getAttribute("data-i18n"); if (!d[k]) return;
    if (el.id === "big") splitScrub(el, d[k]); else el.textContent = d[k];
  });
  $$("[data-i18n-html]").forEach(function (el) {
    var k = el.getAttribute("data-i18n-html"); if (!d[k]) return;
    if (el.classList.contains("split")) splitWords(el, d[k]); else el.innerHTML = d[k];
  });
  $("#lang").value = l;
  store("pf-lang", l);
  lastChap = -1; layout();
}

