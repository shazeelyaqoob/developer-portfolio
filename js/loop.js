/* Main animation loop: scroll, chapters, work reel and rendering. */
"use strict";

/* ================= Main loop ================= */
var intro = reduce ? 1 : 0, introStart = 0, ready = false;
var fSmooth = 0, lastT = performance.now();

var svcEl = $("#services"), aboutEl = $("#about"), lastScrollY = scrollY, vel = 0;
var perf = { n: 0, sum: 0, checked: false, lite: false };
function frame(now) {
  requestAnimationFrame(frame);
  try { step(now); } catch (err) { if (!frame._warned) { frame._warned = true; console.error(err); } }
}
function step(now) {
  var dt = Math.min(.05, (now - lastT) / 1000), rawDt = now - lastT; lastT = now;
  var vh = innerHeight, vw = innerWidth;

  /* ---- READ phase (all layout measurements, before any writes) ---- */
  var sr = story.getBoundingClientRect(), cr = contact.getBoundingClientRect(), rr = reel.getBoundingClientRect();
  var bigR = big.getBoundingClientRect(), svcTop = svcEl.getBoundingClientRect().top, aboutTop = aboutEl.getBoundingClientRect().top;
  var sy = scrollY, docH = document.documentElement.scrollHeight;
  Build.read();

  /* adaptive quality: if frames are slow on this computer, lower the 3D cost */
  if (ready && !perf.checked && rawDt > 0 && rawDt < 500) {
    perf.n++; perf.sum += rawDt;
    if (perf.n >= 90) { perf.checked = true; if (perf.sum / perf.n > 24) goLite(); }
  }

  /* scroll velocity (for the marquee lean) */
  vel = lerp(vel, (sy - lastScrollY) / Math.max(dt, .001) / 60, .2); lastScrollY = sy;

  /* story progress */
  var span = sr.height - vh;
  var sp = span > 0 ? clamp(-sr.top / span, 0, 1) : 0;
  var fs = sp * 5;
  var cp = clamp((vh - cr.top) / (vh * .9), 0, 1);
  var fTarget = cp > 0 ? 5 + cp : fs;
  fSmooth = reduce ? fTarget : lerp(fSmooth, fTarget, 1 - Math.pow(.0009, dt));
  if (Math.abs(fSmooth - fTarget) < .0005) fSmooth = fTarget;
  var f = fSmooth;

  /* chapters */
  var inStory = sr.bottom > vh * .5;
  var chap = clamp(Math.round(fs), 0, 5);
  if (ready && chap !== lastChap) {
    chaps.forEach(function (c, i) { c.classList.toggle("on", i === chap && inStory); });
    if (chap === 1 && lastChap !== 1) runCounter();
    lastChap = chap;
    dialLbl.innerHTML = "<b>0" + chap + "</b> / 05 · " + (T[lang][CH_KEYS[chap]] || "");
  }
  if (ready) chaps.forEach(function (c, i) { if (!inStory && c.classList.contains("on")) c.classList.remove("on"); else if (inStory && i === chap && !c.classList.contains("on")) c.classList.add("on"); });
  rail.classList.toggle("show", ready && sp > 0.01 && sp < .995);
  railBar.style.transform = "scaleY(" + sp.toFixed(4) + ")";
  railNum.textContent = "0" + chap;
  hint.style.opacity = sp > .015 ? 0 : 1;
  arc.style.strokeDashoffset = (ARC_LEN * (1 - sp)).toFixed(1);

  /* reel horizontal */
  var travel = reel._travel || 0;
  var rp = travel > 0 ? clamp(-rr.top / travel, 0, 1) : 0;
  track.style.transform = "translate3d(" + (-rp * travel).toFixed(1) + "px,0,0)";
  reelBar.style.transform = "scaleX(" + rp.toFixed(4) + ")";
  reelNum.textContent = "0" + clamp(Math.floor(rp * 3) + 1, 1, 3) + " / 03";

  /* marquee with scroll velocity */
  var halfA = (mqA._w || 2) / 2, halfB = (mqB._w || 2) / 2;
  mqA._x = ((mqA._x || 0) - (40 + Math.abs(vel) * 6) * dt) % halfA;
  mqB._x = ((mqB._x || 0) + (40 + Math.abs(vel) * 6) * dt) % halfB;
  if (!reduce) {
    mqA.style.transform = "translate3d(" + mqA._x.toFixed(1) + "px,0,0) skewX(" + clamp(-vel * .25, -8, 8).toFixed(2) + "deg)";
    mqB.style.transform = "translate3d(" + (mqB._x - halfB).toFixed(1) + "px,0,0) skewX(" + clamp(-vel * .25, -8, 8).toFixed(2) + "deg)";
  }

  /* about scrub */
  var bp = clamp((vh * .85 - bigR.top) / (bigR.height + vh * .35), 0, 1);
  var ws = big._ws || (big._ws = big.getElementsByClassName("w2"));
  var lit = Math.round(bp * ws.length);
  if (big._lit !== lit) { for (var i = 0; i < ws.length; i++) ws[i].classList.toggle("lit", i < lit); big._lit = lit; }

  /* dock: active section */
  var secs = ["intro", "process", "work", "services", "about", "contact"], act = 0;
  if (sp > 0.17) act = 1;
  if (rr.top < vh * .5) act = 2;
  if (svcTop < vh * .5) act = 3;
  if (aboutTop < vh * .5) act = 4;
  if (cr.top < vh * .5) act = 5;
  if (frame._act !== act) {
    frame._act = act;
    dockBtns.forEach(function (b, i) { b.classList.toggle("on", i === act); });
    var b = dockBtns[act]; pill.style.width = (b._w || b.offsetWidth) + "px"; pill.style.transform = "translateX(" + (b._l != null ? b._l : b.offsetLeft) + "px)";
  }
  dockStat.textContent = act <= 1 ? "0" + chap + " / 05" : secs[act].toUpperCase().slice(0, 3) + " · " + String(Math.round((sy / Math.max(1, docH - vh)) * 100)).padStart(3, "0") + "%";

  Build.tick(now);

  /* cursor */
  rx = lerp(rx, px, 1 - Math.pow(.0005, dt)); ry = lerp(ry, py, 1 - Math.pow(.0005, dt));
  cur.style.transform = "translate3d(" + px + "px," + py + "px,0)";
  ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";

  /* WebGL */
  if (gl) {
    var t = now / 1000;
    gl.uni.uTime.value = reduce ? 0 : t;
    var k, mix;
    if (intro < 1) {
      intro = ready ? clamp((now - introStart) / 1800, 0, 1) : 0;
      if (gl.pairK !== -1) { gl.setPair(gl.DUST, gl.SH[0]); gl.pairK = -1; }
      mix = 1 - Math.pow(1 - intro, 3); gl.uni.uScatter.value = .8; gl.uni.uTunF.value = 0; gl.uni.uTunT.value = 0;
      k = 0;
    } else {
      k = Math.min(5, Math.floor(f)); mix = f - k;
      if (gl.pairK !== k) { gl.setPair(gl.SH[k], gl.SH[k + 1]); gl.pairK = k; }
      gl.uni.uScatter.value = gl.SCATTER[k]; gl.uni.uTunF.value = gl.TUN[k]; gl.uni.uTunT.value = gl.TUN[k + 1];
    }
    gl.uni.uMix.value = mix;

    // pose
    var P = vw < 1000 ? gl.POSE_M : gl.POSE_D, k2 = Math.min(6, k + 1), em = mix * mix * (3 - 2 * mix);
    var tx = lerp(P[k][0], P[k2][0], em) * (isRtl ? -1 : 1), ty = lerp(P[k][1], P[k2][1], em), ts = lerp(P[k][2], P[k2][2], em);
    if (vw >= 1000) { var aspectFix = clamp((vw / vh) / 1.6, .7, 1.2); tx *= aspectFix; }
    gl.pos[0] = tx; gl.pos[1] = ty; gl.pos[2] = ts;
    gl.group.position.set(tx, ty, 0); gl.group.scale.setScalar(ts);

    // rotation: spin on 3D stages, settle to a readable sway on flat ones
    var spin = lerp(gl.SPIN[k], gl.SPIN[k2], em);
    gl.rotY += dt * (.14 * spin + .02);
    if (spin < .99) {
      var tgt = Math.round(gl.rotY / (Math.PI * 2)) * Math.PI * 2 + Math.sin(t * .45) * .38;
      gl.rotY = lerp(gl.rotY, tgt, (1 - spin) * (1 - Math.pow(.05, dt)));
    }
    gl.tiltY = lerp(gl.tiltY, nmx * .25, 1 - Math.pow(.02, dt)); gl.tiltX = lerp(gl.tiltX, nmy * .18, 1 - Math.pow(.02, dt));
    gl.group.rotation.set(.18 + gl.tiltX + (k >= 5 ? -.18 : 0) * em, gl.rotY + gl.tiltY, 0);

    // per-stage extras
    var wPlanet = intro < 1 ? intro : clamp(1 - (f - 1), 0, 1);
    gl.atmo.material.uniforms.uO.value = wPlanet * (k < 2 ? 1 : 0);
    gl.atmo.visible = wPlanet > .01;
    var wBeam = clamp(1 - Math.abs(f - 1) * 2, 0, 1);
    gl.beams.material.opacity = wBeam * (.55 + .25 * Math.sin(t * 3));
    gl.beams.visible = wBeam > .01;
    gl.orbit.material.opacity = .35 * wPlanet; gl.orbit.visible = wPlanet > .01;
    gl.orbitG.rotation.y = t * .05;

    // canvas opacity: full in story & contact, faint behind middle sections
    var afterStory = sr.bottom < vh;
    var op = afterStory ? lerp(.28, 1, cp) : 1;
    gl.uni.uAlpha.value = op * (intro < 1 ? .3 + .7 * intro : 1);

    if (sr.bottom > 0 || cp > 0 || !afterStory || op > 0.01) gl.renderer.render(gl.scene, gl.camera);

    // dial follows the 3D object on screen
    var showDial = inStory && f < 4.6 && vw >= 1000;
    dial.style.opacity = showDial ? 1 : 0;
    if (showDial) {
      // project the object's centre and a point on its edge (camera-facing), so the ring matches what is drawn
      var cx = gl.group.position.x, cy = gl.group.position.y;
      gl.v3.set(cx, cy, 0).project(gl.camera);
      gl.v3b.set(cx + 1.78 * ts, cy, 0).project(gl.camera);
      var dsx = (gl.v3.x * .5 + .5) * vw, dsy = (-gl.v3.y * .5 + .5) * vh;
      var pxR = Math.abs((gl.v3b.x - gl.v3.x) * .5 * vw);
      dial.style.width = dial.style.height = (pxR * 2).toFixed(0) + "px";
      dial.style.transform = "translate3d(" + (dsx - pxR).toFixed(1) + "px," + (dsy - pxR).toFixed(1) + "px,0)";
    }
  }
}

function goLite() {
  if (perf.lite) return; perf.lite = true;
  root.classList.add("lite");
  if (gl) { gl.renderer.setPixelRatio(1); gl.resize(); gl.points.geometry.setDrawRange(0, Math.floor(gl.N * .55)); }
}

