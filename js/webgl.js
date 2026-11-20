/* Three.js particle world: shapes for each story chapter. */
"use strict";

/* ================= WebGL world ================= */
var gl = null;
var canvas = $("#gl");
var accentC = null, fgC = null;
function readColors() {
  var cs = getComputedStyle(root);
  var a = cs.getPropertyValue("--accent").trim() || "#ff2b2b", f = cs.getPropertyValue("--fg").trim() || "#ffffff";
  if (gl) {
    var THREE = gl.THREE;
    gl.uni.uAccent.value.set(a); gl.uni.uColor.value.set(f); gl.atmo.material.uniforms.uColor.value.set(a); gl.beams.material.color.set(a);
    gl.orbit.material.color.set(f);
    // Glowing additive light only shows on black; on white, particles are drawn as solid ink dots instead
    var blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    [gl.points.material, gl.atmo.material, gl.beams.material, gl.orbit.material].forEach(function (m) { m.blending = blend; m.needsUpdate = true; });
    gl.points.material.premultipliedAlpha = isLight;
    gl.uni.uLight.value = isLight ? 1 : 0;
  }
  accentC = a; fgC = f;
}

function initGL() {
  if (!window.THREE) return null;
  var THREE = window.THREE, renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, powerPreference: "high-performance" }); } catch (e) { return null; }
  // Software rendering (no GPU acceleration) gets a lighter scene from the start
  var soft = false;
  try { var ctxGL = renderer.getContext(), dbg = ctxGL.getExtension("WEBGL_debug_renderer_info"); var rname = dbg ? String(ctxGL.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ""; soft = /swiftshader|llvmpipe|software|basic render/i.test(rname); } catch (e) {}
  var DPR = soft ? 1 : Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR); renderer.setClearColor(0x000000, 0);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);
  var small = innerWidth < 700;
  var N = soft ? 6000 : small ? 8000 : 14000;

  /* --- noise for planet continents --- */
  function hash(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    function c(a, b, d) { return hash(xi + a, yi + b, zi + d); }
    var x00 = lerp(c(0,0,0), c(1,0,0), u), x10 = lerp(c(0,1,0), c(1,1,0), u), x01 = lerp(c(0,0,1), c(1,0,1), u), x11 = lerp(c(0,1,1), c(1,1,1), u);
    return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
  }
  function fbm(x, y, z) { var s = 0, a = .5, f = 1; for (var o = 0; o < 5; o++) { s += a * vnoise(x * f + 11, y * f + 7, z * f + 3); f *= 2.03; a *= .5; } return s; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* --- shapes: {p: Float32Array(N*3), b: Float32Array(N)} ; b > 1 means red/hot --- */
  function mk() { return { p: new Float32Array(N * 3), b: new Float32Array(N) }; }
  var cities = [];
  function planet(R) {
    var s = mk(), g = Math.PI * (3 - Math.sqrt(5)), land = 0;
    for (var i = 0; i < N; i++) {
      var y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), t = g * i, x = Math.cos(t) * r, z = Math.sin(t) * r;
      var n = fbm(x * 1.7, y * 1.7, z * 1.7);
      var isLand = n > 0.53;
      s.p[i*3] = x * R; s.p[i*3+1] = y * R; s.p[i*3+2] = z * R;
      if (isLand) { land++; s.b[i] = Math.random() < 0.045 ? 1.7 : rnd(.55, .9); if (s.b[i] > 1 && cities.length < 70) cities.push([x * R, y * R, z * R]); }
      else s.b[i] = Math.abs(y) > .9 ? .25 : .07;
    }
    return s;
  }
  function dust() { var s = mk(); for (var i = 0; i < N; i++) { var u = rnd(-1, 1), th = rnd(0, 6.283), r = Math.cbrt(Math.random()) * 9 + 3, q = Math.sqrt(1 - u * u); s.p[i*3] = Math.cos(th) * q * r; s.p[i*3+1] = u * r; s.p[i*3+2] = Math.sin(th) * q * r - 4; s.b[i] = rnd(.05, .35); } return s; }
  function nebula() {
    var s = mk();
    for (var i = 0; i < N; i++) {
      var k = i * 3, arm = i % 4, rad, a;
      if (i < N * .18) { var u = rnd(-1, 1), th = rnd(0, 6.283), q = Math.sqrt(1 - u * u), rr = Math.pow(Math.random(), 2) * .45; s.p[k] = Math.cos(th) * q * rr; s.p[k+1] = u * rr * .7; s.p[k+2] = Math.sin(th) * q * rr; s.b[i] = Math.random() < .05 ? 1.6 : rnd(.7, 1); continue; }
      rad = Math.pow(Math.random(), .8) * 2.3 + .25; a = arm * Math.PI / 2 + rad * 2.2 + rnd(-.32, .32) / (rad * .6 + .4);
      s.p[k] = Math.cos(a) * rad + rnd(-.06, .06); s.p[k+1] = rnd(-.08, .08) * (2.6 - rad); s.p[k+2] = Math.sin(a) * rad + rnd(-.06, .06);
      s.b[i] = Math.random() < .022 ? 1.5 : rnd(.25, .75) * (1.3 - rad / 3);
    }
    return s;
  }
  function sampler(draw, w, h) {
    var oc = document.createElement("canvas"); oc.width = w; oc.height = h;
    var c = oc.getContext("2d"); draw(c, w, h);
    var d = c.getImageData(0, 0, w, h).data, white = [], red = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var o = (y * w + x) * 4; if (d[o + 3] > 140) { if (d[o + 1] < 90 && d[o] > 150) red.push(x, y); else white.push(x, y); } }
    return { white: white, red: red, w: w, h: h };
  }
  function pick(arr) { var i = (Math.random() * (arr.length / 2)) | 0; return [arr[i * 2], arr[i * 2 + 1]]; }
  function layers() {
    var s = mk(), W = 520, H = 340;
    var planes = [
      sampler(function (c, w, h) { c.strokeStyle = "#fff"; c.lineWidth = 5; c.strokeRect(10, 10, w - 20, h - 20); c.beginPath(); c.moveTo(10, 52); c.lineTo(w - 10, 52); c.stroke(); c.fillStyle = "#f00"; c.beginPath(); c.arc(36, 31, 8, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(62, 31, 8, 0, 7); c.fill(); c.beginPath(); c.arc(88, 31, 8, 0, 7); c.fill(); c.fillRect(140, 25, 220, 12); }, W, H),
      sampler(function (c, w, h) { c.fillStyle = "#fff"; c.fillRect(46, 92, 250, 26); c.fillRect(46, 130, 190, 26); c.fillStyle = "#f00"; c.fillRect(46, 180, 120, 36); c.fillStyle = "#fff"; c.lineWidth = 5; c.strokeStyle = "#fff"; c.strokeRect(320, 86, 156, 130); c.beginPath(); c.moveTo(320, 216); c.lineTo(370, 150); c.lineTo(410, 190); c.lineTo(440, 160); c.lineTo(476, 216); c.stroke(); }, W, H),
      sampler(function (c, w, h) { c.strokeStyle = "#fff"; c.lineWidth = 5; [46, 190, 334].forEach(function (x, i) { c.strokeRect(x, 238, 128, 76); c.fillStyle = i === 1 ? "#f00" : "#fff"; c.fillRect(x + 14, 254, 64, 10); c.fillStyle = "#fff"; c.fillRect(x + 14, 274, 90, 7); }); }, W, H)
    ];
    var zs = [-.8, 0, .8];
    for (var i = 0; i < N; i++) {
      var L = i % 3, pl = planes[L], isRed = pl.red.length && Math.random() < (L === 1 ? .22 : .12), pt = pick(isRed ? pl.red : pl.white);
      var sc = 3.5 / W;
      s.p[i*3] = (pt[0] - W / 2) * sc + L * .18 - .18; s.p[i*3+1] = -(pt[1] - H / 2) * sc + L * .12 - .12; s.p[i*3+2] = zs[L] + rnd(-.02, .02);
      s.b[i] = isRed ? 1.6 : rnd(.45, .85);
    }
    return s;
  }
  function code() {
    var W = 560, H = 300;
    var smp = sampler(function (c, w, h) {
      c.font = "800 250px Unbounded, 'Segoe UI', sans-serif"; c.textBaseline = "middle";
      var a = c.measureText("<").width, b = c.measureText("/").width, d = c.measureText(">").width, gap = 14, tot = a + b + d + gap * 2, x = (w - tot) / 2, y = h / 2 + 10;
      c.fillStyle = "#fff"; c.fillText("<", x, y); c.fillStyle = "#f00"; c.fillText("/", x + a + gap, y); c.fillStyle = "#fff"; c.fillText(">", x + a + b + gap * 2, y);
    }, W, H);
    var s = mk(), sc = 4.6 / W;
    for (var i = 0; i < N; i++) {
      var isRed = smp.red.length && Math.random() < .3, pt = pick(isRed ? smp.red : smp.white);
      s.p[i*3] = (pt[0] - W / 2) * sc; s.p[i*3+1] = -(pt[1] - H / 2) * sc; s.p[i*3+2] = rnd(-.32, .32);
      s.b[i] = isRed ? 1.6 : rnd(.5, .9);
    }
    return s;
  }
  function tunnel() { var s = mk(); for (var i = 0; i < N; i++) { var a = rnd(0, 6.283), r = rnd(1.2, 4.2); s.p[i*3] = Math.cos(a) * r; s.p[i*3+1] = Math.sin(a) * r; s.p[i*3+2] = rnd(-30, 5); s.b[i] = Math.random() < .03 ? 1.6 : rnd(.2, .7); } return s; }
  function portal() {
    var s = mk();
    for (var i = 0; i < N; i++) {
      var k = i * 3, a = rnd(0, 6.283);
      if (i < N * .7) { var R = 2.5, tA = rnd(0, 6.283), tr = Math.abs(rnd(-1, 1) * rnd(-1, 1)) * .32; s.p[k] = Math.cos(a) * (R + Math.cos(tA) * tr); s.p[k+1] = Math.sin(a) * (R + Math.cos(tA) * tr); s.p[k+2] = Math.sin(tA) * tr; s.b[i] = Math.random() < .08 ? 1.6 : rnd(.4, .9); }
      else { var r2 = rnd(2.9, 5.5); s.p[k] = Math.cos(a) * r2; s.p[k+1] = Math.sin(a) * r2; s.p[k+2] = rnd(-1.5, 1.5); s.b[i] = rnd(.05, .3); }
    }
    return s;
  }

  var PL = planet(1.45);
  var PL2 = { p: PL.p, b: new Float32Array(N) };
  for (var i = 0; i < N; i++) PL2.b[i] = PL.b[i] > 1 ? 2.2 : PL.b[i] * 1.15;
  var SH = [PL, PL2, nebula(), layers(), code(), tunnel(), portal()];
  var DUST = dust();
  var SCATTER = [0, 1.3, 1.1, 1.0, 1.5, 1.2];
  var SPIN = [1, 1, 1, 0, 0, 0, .35];
  var TUN = [0, 0, 0, 0, 0, 1, 0];
  // Poses: [x, y, scale]
  var POSE_D = [[2.0, 0, 1], [1.85, -.05, 1.1], [1.95, 0, .92], [2.0, .05, .95], [2.05, 0, .95], [0, 0, 1], [0, 0, 1]];
  var POSE_M = [[0, 1.25, .62], [0, 1.2, .7], [0, 1.15, .6], [0, 1.25, .56], [0, 1.3, .56], [0, 0, 1], [0, .3, .72]];

  /* --- geometry --- */
  var geo = new THREE.BufferGeometry();
  var aFrom = new Float32Array(N * 3), aTo = new Float32Array(N * 3), bFrom = new Float32Array(N), bTo = new Float32Array(N), aRand = new Float32Array(N * 4);
  for (i = 0; i < N; i++) { var th = rnd(0, 6.283), u = rnd(-1, 1), q = Math.sqrt(1 - u * u); aRand[i*4] = Math.random(); aRand[i*4+1] = Math.cos(th) * q; aRand[i*4+2] = u; aRand[i*4+3] = Math.sin(th) * q; }
  geo.setAttribute("position", new THREE.BufferAttribute(aTo, 3));
  geo.setAttribute("aFrom", new THREE.BufferAttribute(aFrom, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(aTo, 3));
  geo.setAttribute("bFrom", new THREE.BufferAttribute(bFrom, 1));
  geo.setAttribute("bTo", new THREE.BufferAttribute(bTo, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  var uni = {
    uMix: { value: 0 }, uTime: { value: 0 }, uScatter: { value: 0 }, uTunF: { value: 0 }, uTunT: { value: 0 },
    uSize: { value: 0.028 }, uScale: { value: renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(20 * Math.PI / 180)) },
    uColor: { value: new THREE.Color("#ffffff") }, uAccent: { value: new THREE.Color("#ff2b2b") }, uAlpha: { value: 1 }, uFlow: { value: reduce ? 0 : 1 }, uLight: { value: 0 }
  };
  var mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      "attribute vec3 aFrom; attribute vec3 aTo; attribute float bFrom; attribute float bTo; attribute vec4 aRand;",
      "uniform float uMix, uTime, uScatter, uTunF, uTunT, uSize, uScale, uFlow;",
      "varying float vB; varying float vHot; varying float vFade;",
      "vec3 flow(vec3 p, float on){ if(on > .5){ p.z = mod(p.z + uTime * 7.0 * uFlow + 30.0, 35.0) - 30.0; } return p; }",
      "void main(){",
      "  float d = aRand.x * .38;",
      "  float t = clamp((uMix - d) / .62, 0., 1.); t = t * t * (3. - 2. * t);",
      "  vec3 a = flow(aFrom, uTunF); vec3 b = flow(aTo, uTunT);",
      "  vec3 p = mix(a, b, t) + aRand.yzw * sin(3.14159 * t) * uScatter;",
      "  p += aRand.yzw * .012 * sin(uTime * 1.3 + aRand.x * 60.) * uFlow;",
      "  vec4 mv = modelViewMatrix * vec4(p, 1.);",
      "  float br = mix(bFrom, bTo, t);",
      "  vHot = step(1.0, br); vB = min(br, 1.0);",
      "  float depth = -mv.z;",
      "  vFade = smoothstep(.6, 3.2, depth) * (1. - smoothstep(26., 34., depth));",
      "  float sz = uSize * (vHot > .5 ? 1.75 : 1.) * (.55 + vB * .8);",
      "  gl_PointSize = clamp(sz * uScale / depth, 0., 48.);",
      "  gl_Position = projectionMatrix * mv;",
      "}"].join("\n"),
    fragmentShader: [
      "uniform vec3 uColor; uniform vec3 uAccent; uniform float uAlpha; uniform float uLight;",
      "varying float vB; varying float vHot; varying float vFade;",
      "void main(){",
      "  vec2 c = gl_PointCoord - .5; float d = length(c);",
      "  float a = smoothstep(.5, .0, d); a = pow(a, 1.6);",
      "  vec3 col = mix(uColor, uAccent, vHot);",
      "  float alpha = min(1., a * (vHot > .5 ? 1. : vB) * (1. + uLight * .35)) * vFade * uAlpha;",
      "  if (alpha < .01) discard;",
      "  gl_FragColor = vec4(col * alpha, alpha);",
      "}"].join("\n")
  });
  var points = new THREE.Points(geo, mat);
  var group = new THREE.Group(); group.add(points); scene.add(group);

  /* Atmosphere rim glow */
  var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.45 * 1.16, 64, 64), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ff2b2b") }, uO: { value: 1 }, uLight: uni.uLight },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 uColor; uniform float uO; uniform float uLight; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0., 1.), 2.4); float i = smoothstep(.0, 1., f) * .55 * uO; gl_FragColor = uLight > .5 ? vec4(uColor, i * .45) : vec4(uColor * i, i); }"
  }));
  group.add(atmo);

  /* Location beams (chapter 01) */
  var bp = new Float32Array(cities.length * 6);
  cities.forEach(function (c, j) { var l = rnd(.18, .55) + 1; bp[j*6] = c[0]; bp[j*6+1] = c[1]; bp[j*6+2] = c[2]; bp[j*6+3] = c[0] * l; bp[j*6+4] = c[1] * l; bp[j*6+5] = c[2] * l; });
  var bgeo = new THREE.BufferGeometry(); bgeo.setAttribute("position", new THREE.BufferAttribute(bp, 3));
  var beams = new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: "#ff2b2b", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(beams);

  /* Orbit ring (hero accent) */
  var orbN = small ? 500 : 900, op = new Float32Array(orbN * 3);
  for (i = 0; i < orbN; i++) { var oa = i / orbN * 6.283; op[i*3] = Math.cos(oa) * 1.95; op[i*3+1] = rnd(-.01, .01); op[i*3+2] = Math.sin(oa) * 1.95; }
  var ogeo = new THREE.BufferGeometry(); ogeo.setAttribute("position", new THREE.BufferAttribute(op, 3));
  var orbit = new THREE.Points(ogeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.012, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending }));
  var orbitG = new THREE.Group(); orbitG.rotation.x = 1.25; orbitG.rotation.z = .25; orbitG.add(orbit); group.add(orbitG);

  function setPair(A, B) {
    aFrom.set(A.p); bFrom.set(A.b); aTo.set(B.p); bTo.set(B.b);
    geo.attributes.aFrom.needsUpdate = true; geo.attributes.aTo.needsUpdate = true; geo.attributes.bFrom.needsUpdate = true; geo.attributes.bTo.needsUpdate = true;
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    uni.uScale.value = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(20 * Math.PI / 180));
  }
  resize();
  setPair(DUST, PL);
  return {
    THREE: THREE, renderer: renderer, scene: scene, camera: camera, group: group, points: points, atmo: atmo, beams: beams, orbit: orbit, orbitG: orbitG,
    uni: uni, SH: SH, DUST: DUST, SCATTER: SCATTER, SPIN: SPIN, TUN: TUN, POSE_D: POSE_D, POSE_M: POSE_M, setPair: setPair, resize: resize,
    N: N, soft: soft, pairK: -2, rotY: 0, tiltX: 0, tiltY: 0, pos: [POSE_D[0][0], 0, 1], v3: new THREE.Vector3(), v3b: new THREE.Vector3(),
    rebuildCode: function () { SH[4] = code(); this.pairK = -2; }
  };
}

