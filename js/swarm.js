/* Swarm build: agent cursors that build page pieces as you scroll. */
"use strict";

/* ================= Swarm build ================= */
var Build = (function () {
  var layer = $("#blLayer"), bar = $("#bbar"), bDone = $("#bDone"), bTot = $("#bTot"), bBar = $("#bProg"), bSt = $("#bSt"), bSpd = $("#bSpd"), bX = $("#bX");
  var SEL = [
    ["header.top .logo", "logo"], ["header.top .swatches", "theme"], ["header.top .langsel", "i18n"], ["#dock", "nav"],
    ["#work .panel-intro", "intro"], ["#work .card", "card"], ["#work .panel-end", "cta"],
    ["#services .sec-head", "heading"], ["#services .svc", "row"], [".mq", "marquee"],
    ["#about .sec-head", "heading"], ["#big", "statement"], ["#about .exp > .k", "label"], ["#about .exp li", "row"],
    ["#contact > .wrap > .k", "label"], ["#ctTitle", "heading"], ["#contact .sub", "text"], ["#contact .row", "actions"], ["#form", "form"], ["footer .wrap", "footer"]
  ];
  // [name, cursor colour, label text colour] — built from theme tokens so every agent reads on dark and light themes
  var AG = [
    ["layout", "var(--fg)", "var(--bg)"],
    ["type", "var(--accent)", "var(--accent-ink)"],
    ["motion", "color-mix(in srgb, var(--accent) 55%, var(--fg))", "var(--bg)"],
    ["3d", "color-mix(in srgb, var(--accent) 45%, var(--bg))", "var(--fg)"],
    ["copy", "color-mix(in srgb, var(--accent) 72%, #000)", "#ffffff"],
    ["qa", "color-mix(in srgb, var(--accent) 65%, #ffb000)", "#140600"]
  ];
  var pieces = [], agents = [], speed = 1, active = !reduce, startT = 0, doneT = 0, finished = false;
  var ARROW = '<svg viewBox="0 0 20 20"><path d="M3 2.5 17.5 9.2 10.8 10.8 9.2 17.5Z"/></svg>';

  SEL.forEach(function (s) {
    $$(s[0]).forEach(function (el) {
      if (pieces.some(function (p) { return p.el === el; })) return;
      var g = document.createElement("div"); g.className = "bl-ghost"; g.innerHTML = "<span>" + s[1] + "</span>"; g.style.display = "none"; layer.appendChild(g);
      pieces.push({ el: el, name: s[1], st: "done", ghost: g, box: null, ag: null });
    });
  });
  bTot.textContent = pieces.length;
  if (!active) bar.style.display = "none";

  var dots = $("#bDots");
  AG.forEach(function (a, i) {
    var c = a[1];
    var el = document.createElement("div"); el.className = "bl-agent";
    el.style.setProperty("--c", c); el.style.setProperty("--ci", a[2]);
    el.innerHTML = ARROW + '<span class="tag">' + a[0] + "</span>";
    layer.appendChild(el);
    var d = document.createElement("i"); d.style.setProperty("--c", c); dots.appendChild(d);
    agents.push({ el: el, x: innerWidth - 120 + i * 14, y: innerHeight + 40, mode: "idle", p: null, t0: 0, fx: 0, fy: 0, dur: 0, i: i });
  });

  function setWait(p) { p.st = "wait"; p.el.classList.add("pc-wait"); p.el.style.clipPath = ""; }
  function finish(p) {
    p.st = "done"; p.el.classList.remove("pc-wait"); p.el.style.clipPath = "";
    p.ghost.style.display = "none";
    p.el.classList.add("on"); if (p.el.classList.contains("card")) p.el.classList.add("seen");
    [].forEach.call(p.el.querySelectorAll(".rv"), function (r) { r.classList.add("on"); });
    if (p.box) { var b = p.box; b.classList.add("out"); b._g.forEach(function (g) { g.style.opacity = 0; }); setTimeout(function () { b.remove(); b._g.forEach(function (g) { g.remove(); }); }, 450); p.box = null; }
  }
  function start() {
    if (!active) return;
    startT = performance.now(); finished = false; doneT = 0;
    pieces.forEach(function (p) { p.el.classList.remove("rv"); if (p.el.id === "ctTitle" || p.el.classList.contains("card")) p.el.classList.remove("on", "seen"); setWait(p); });
    $$(".rv").forEach(function (r) { if (pieces.some(function (p) { return p.el.contains(r); })) r.classList.add("on"); });
    bX.textContent = "✕"; bX.setAttribute("aria-label", T[lang].b_skip);
  }
  function skipAll() {
    pieces.forEach(function (p) { if (p.st !== "done") finish(p); });
    agents.forEach(function (a) { a.mode = "idle"; a.p = null; });
  }
  bX.addEventListener("click", function () {
    if (finished) { active = true; start(); } else { skipAll(); }
  });
  bSpd.addEventListener("click", function () { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; bSpd.textContent = speed + "x"; });

  function inView(r, vw, vh) { return r.width > 0 && r.height > 0 && r.bottom > 30 && r.top < vh - 40 && r.right > 0 && r.left < vw; }
  function mkBox(p) {
    var b = document.createElement("div"); b.className = "bl-box"; b.innerHTML = "<i></i><i></i><i></i><i></i><b></b>";
    var g = ["x", "x", "y", "y"].map(function (k) { var e = document.createElement("div"); e.className = "bl-guide " + k; layer.appendChild(e); return e; });
    b._g = g; layer.appendChild(b); p.box = b;
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var br = null;
  // READ phase: measure everything once per frame, before any style writes
  function read() {
    br = bar.getBoundingClientRect();
    for (var i = 0; i < pieces.length; i++) { var p = pieces[i]; if (p.st !== "done") p.r = p.el.getBoundingClientRect(); }
  }
  function tick(now) {
    var vw = innerWidth, vh = innerHeight, anyBuild = false, done = 0, waitingInView = 0;
    // pieces already scrolled past are finished instantly, so nothing above you is ever left empty
    pieces.forEach(function (p) {
      if (p.st === "wait" && p.r && (p.r.bottom < 0 || p.r.right < 0)) finish(p);
      if (p.st === "wait" && p.r && inView(p.r, vw, vh)) waitingInView++;
    });
    var hurry = waitingInView > agents.length ? 1.8 : 1;
    // ghosts
    pieces.forEach(function (p) {
      if (p.st === "done") { done++; return; }
      var r = p.r;
      var show = (p.st === "wait" || p.st === "fly") && inView(r, vw, vh + 200);
      p.ghost.style.display = show ? "block" : "none";
      if (show) { p.ghost.style.transform = "translate3d(" + r.left.toFixed(1) + "px," + r.top.toFixed(1) + "px,0)"; p.ghost.style.width = r.width + "px"; p.ghost.style.height = r.height + "px"; }
    });
    // agents
    agents.forEach(function (a) {
      if (a.mode === "idle" && active && ready) {
        var next = null;
        for (var i = 0; i < pieces.length; i++) { var q = pieces[i]; if (q.st === "wait" && q.r && inView(q.r, vw, vh)) { next = q; break; } }
        if (next) { next.st = "fly"; next.ag = a; a.p = next; a.mode = "fly"; a.t0 = now; a.fx = a.x; a.fy = a.y; a.dur = (280 + Math.random() * 160) / (speed * hurry); }
      }
      var p = a.p, r = p && p.r;
      if (p && p.st === "done") { a.mode = "idle"; a.p = null; p = null; }
      if (a.mode === "fly") {
        var t = clamp((now - a.t0) / a.dur, 0, 1), e = ease(t);
        var tx = isRtl ? r.right - 6 : r.left + 6, ty = r.top + 6;
        a.x = lerp(a.fx, tx, e) + Math.sin(t * Math.PI) * 30 * (a.i % 2 ? 1 : -1); a.y = lerp(a.fy, ty, e) - Math.sin(t * Math.PI) * 40;
        if (t >= 1) { a.mode = "build"; a.t0 = now; p.st = "build"; a.dur = clamp(380 + (r.width * r.height) / 2500, 450, 950) / (speed * hurry); mkBox(p); p.ghost.style.display = "none"; }
      } else if (a.mode === "build") {
        anyBuild = true;
        var q2 = clamp((now - a.t0) / a.dur, 0, 1), e2 = 1 - Math.pow(1 - q2, 2);
        var pct = ((1 - e2) * 100).toFixed(2) + "%";
        p.el.style.clipPath = isRtl ? "inset(0 0 0 " + pct + ")" : "inset(0 " + pct + " 0 0)";
        var lines = Math.max(1, Math.round(r.height / 70));
        a.x = isRtl ? r.right - r.width * e2 : r.left + r.width * e2;
        a.y = r.top + r.height * (.5 - .5 * Math.cos(q2 * Math.PI * 2 * lines));
        var b = p.box;
        b.style.transform = "translate3d(" + r.left.toFixed(1) + "px," + r.top.toFixed(1) + "px,0)"; b.style.width = r.width + "px"; b.style.height = r.height + "px";
        b.lastChild.textContent = p.name + " · " + Math.round(r.width) + "×" + Math.round(r.height);
        b._g[0].style.transform = "translateY(" + r.top.toFixed(1) + "px)"; b._g[1].style.transform = "translateY(" + r.bottom.toFixed(1) + "px)";
        b._g[2].style.transform = "translateX(" + r.left.toFixed(1) + "px)"; b._g[3].style.transform = "translateX(" + r.right.toFixed(1) + "px)";
        if (q2 >= 1) { finish(p); a.mode = "idle"; a.p = null; }
      } else {
        // park beside the build bar and bob gently
        var px2 = br.left + 26 + a.i * 22, py2 = br.top - 18 - Math.sin(now / 600 + a.i) * 4;
        a.x = lerp(a.x, px2, .08); a.y = lerp(a.y, py2, .08);
      }
      a.el.style.transform = "translate3d(" + a.x.toFixed(1) + "px," + a.y.toFixed(1) + "px,0)";
      a.el.style.opacity = finished && a.mode === "idle" ? 0 : 1;
    });
    layer.classList.toggle("bp", anyBuild);
    // bar
    bDone.textContent = done;
    bBar.style.transform = "scaleX(" + (done / pieces.length).toFixed(3) + ")";
    var d = T[lang];
    if (done === pieces.length) {
      if (!finished) { finished = true; doneT = (now - startT) / 1000; bX.textContent = "↻"; bX.setAttribute("aria-label", d.b_rebuild); }
      bSt.textContent = d.b_done.replace("{s}", doneT.toFixed(1));
    } else {
      bSt.textContent = agents.some(function (a) { return a.mode !== "idle"; }) ? d.b_building : d.b_scroll;
    }
    bSpd.setAttribute("aria-label", d.b_speed);
  }
  return { start: start, read: read, tick: tick, skip: skipAll };
})();

