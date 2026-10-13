// AeroLab frontend: receives float16 fields over WebSocket, renders with WebGL (1 or 2).
// Fields are normalised to 8-bit in JS (255 = solid), so any WebGL device works.
const $ = (id) => document.getElementById(id);
const canvas = $("gl-canvas");
const vectorCanvas = $("vector-canvas");
const vctx = vectorCanvas ? vectorCanvas.getContext("2d") : null;
const opts = { antialias: false };
const gl = canvas.getContext("webgl2", opts) || canvas.getContext("webgl", opts) ||
           canvas.getContext("experimental-webgl", opts);
// No WebGL -> Canvas 2D fallback (colormaps applied on the CPU).
const ctx2d = gl ? null : canvas.getContext("2d");
console.log("Renderer:", !gl ? "Canvas2D (fallback)" :
  gl instanceof (window.WebGL2RenderingContext || Function) ? "WebGL2" : "WebGL1");

// ---------------------------------------------------------------- shaders
const VS = `attribute vec2 p; varying vec2 uv;
void main(){ uv = p*0.5+0.5; gl_Position = vec4(p,0,1); }`;

const FS = `precision highp float;
varying vec2 uv;
uniform sampler2D field; uniform int cmap; uniform vec2 texel; uniform vec2 center; uniform float zoom;
vec3 turbo(float x){
  const vec4 kr=vec4(0.13572138,4.61539260,-42.66032258,132.13108234);
  const vec4 kg=vec4(0.09140261,2.19418839,4.84296658,-14.18503333);
  const vec4 kb=vec4(0.10667330,12.64194608,-60.58204836,110.36276771);
  const vec2 kr2=vec2(-152.94239396,59.28637943), kg2=vec2(4.27729857,2.82956604), kb2=vec2(-89.90310912,27.34824973);
  x=clamp(x,0.,1.); vec4 v4=vec4(1.,x,x*x,x*x*x); vec2 v2=v4.zw*v4.z;
  return vec3(dot(v4,kr)+dot(v2,kr2), dot(v4,kg)+dot(v2,kg2), dot(v4,kb)+dot(v2,kb2));
}
vec3 icefire(float x){ // diverging: cyan-blue / black / orange-red
  x = clamp(x,0.,1.)*2.-1.; float a = abs(x);
  vec3 c = x<0. ? mix(vec3(0.02,0.03,0.07), vec3(0.25,0.85,1.0), pow(a,0.7))
                : mix(vec3(0.02,0.03,0.07), vec3(1.0,0.45,0.15), pow(a,0.7));
  return mix(c, vec3(1.0,0.97,0.85), smoothstep(0.85,1.0,a));
}
vec3 inferno(float t){
  t=clamp(t,0.,1.);
  const vec3 c0=vec3(0.000218,0.001651,-0.019480), c1=vec3(0.106513,0.563956,3.932712), c2=vec3(11.602493,-3.972854,-15.942394),
  c3=vec3(-41.703996,17.436398,44.354145), c4=vec3(77.162935,-33.402359,-81.807309), c5=vec3(-71.319428,32.626064,73.209519), c6=vec3(25.131126,-12.242669,-23.070325);
  return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
}
vec3 smoke(float t){ // dark tunnel, luminous white smoke with glowing core
  float wire = 0.012 * sin(uv.y * 120.0);
  vec3 bg = mix(vec3(0.012, 0.016, 0.032), vec3(0.025, 0.036, 0.070), uv.y) + vec3(wire);
  float core = smoothstep(0.08, 0.50, t);
  float glow = smoothstep(0.015, 0.25, t) * 0.45;
  vec3 smokeCol = mix(vec3(0.35, 0.70, 0.98), vec3(0.98, 0.99, 1.0), core);
  return mix(bg, smokeCol, clamp(core + glow, 0.0, 1.0));
}
float solidAt(vec2 q){ return texture2D(field,q).r > 0.999 ? 1.0 : 0.0; }
// bilinear sample that never blends the solid marker (255) into the fluid
float sampleField(vec2 q, float near){
  vec2 p = q/texel - 0.5; vec2 i0 = floor(p); vec2 f = p - i0; vec2 b = (i0+0.5)*texel;
  float a = texture2D(field,b).r, bb = texture2D(field,b+vec2(texel.x,0.)).r;
  float c = texture2D(field,b+vec2(0.,texel.y)).r, d = texture2D(field,b+texel).r;
  a = a>0.999?near:a; bb = bb>0.999?near:bb; c = c>0.999?near:c; d = d>0.999?near:d;
  return mix(mix(a,bb,f.x), mix(c,d,f.x), f.y);
}
void main(){
  vec2 q = center + (uv-0.5)/zoom;
  if (q.x<0.||q.y<0.||q.x>1.||q.y>1.) {   // outside the tunnel
    float g = mod(floor(gl_FragCoord.x/12.)+floor(gl_FragCoord.y/12.),2.);
    gl_FragColor = vec4(vec3(0.03,0.04,0.07)+g*0.012,1.); return;
  }
  float near = texture2D(field, q).r;
  if (near > 0.999) {
    // airfoil: brushed metal with a lit top edge
    float edge = solidAt(q+vec2(0.,texel.y*2.));
    gl_FragColor = vec4(mix(vec3(0.92,0.95,1.0), vec3(0.55,0.6,0.7), edge*0.6 + q.y*0.2), 1.); return;
  }
  float s = sampleField(q, near);
  // soft glow halo near the body
  float halo = 0.;
  for (int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) halo += solidAt(q+vec2(float(i),float(j))*texel*1.5);
  float t = s * (255.0/254.0);
  vec3 c = cmap==1 ? turbo(t) : cmap==2 ? icefire(t) : cmap==4 ? smoke(t) : inferno(t);
  c += vec3(0.25,0.7,1.0) * halo/25. * 0.35;
  gl_FragColor = vec4(c,1.);
}`;

let prog, U, tex;
if (gl) {
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s);
    return s;
  };
  prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  U = Object.fromEntries(["field","cmap","texel","center","zoom"].map(n => [n, gl.getUniformLocation(prog, n)]));
  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
}

// ---- Canvas2D colormap LUTs (same formulas as the shader)
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const CPU_CMAPS = {
  1: (x) => { const v = [1, x, x*x, x*x*x], v2 = [x**4, x**5];
    const d = (k, k2) => k[0]*v[0]+k[1]*v[1]+k[2]*v[2]+k[3]*v[3]+k2[0]*v2[0]+k2[1]*v2[1];
    return [d([0.13572138,4.6153926,-42.66032258,132.13108234],[-152.94239396,59.28637943]),
            d([0.09140261,2.19418839,4.84296658,-14.18503333],[4.27729857,2.82956604]),
            d([0.1066733,12.64194608,-60.58204836,110.36276771],[-89.90310912,27.34824973])]; },
  2: (x) => { x = x*2-1; const a = Math.abs(x), dark = [0.02,0.03,0.07];
    const c = mix3(dark, x < 0 ? [0.25,0.85,1] : [1,0.45,0.15], a ** 0.7);
    const s = clamp01((a-0.85)/0.15), sm = s*s*(3-2*s);
    return mix3(c, [1,0.97,0.85], sm); },
  3: (t) => { const c = [[0.000218,0.001651,-0.01948],[0.106513,0.563956,3.932712],[11.602493,-3.972854,-15.942394],
    [-41.703996,17.436398,44.354145],[77.162935,-33.402359,-81.807309],[-71.319428,32.626064,73.209519],[25.131126,-12.242669,-23.070325]];
    return [0,1,2].map(i => c.reduceRight((acc, ci) => acc * t + ci[i], 0)); },
  4: (t) => {
    const core = clamp01((t - 0.08) / 0.42);
    const glow = clamp01((t - 0.015) / 0.235) * 0.45;
    const a = clamp01(core + glow);
    const bg = mix3([0.012, 0.016, 0.032], [0.025, 0.036, 0.070], 0.5);
    const col = mix3([0.35, 0.70, 0.98], [0.98, 0.99, 1.0], core);
    return mix3(bg, col, a);
  },
};
const LUTS = {};
for (const k in CPU_CMAPS) {
  const lut = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const rgb = i === 255 ? [0.85, 0.88, 0.94] : CPU_CMAPS[k](i / 254);   // 255 = airfoil
    rgb.forEach((v, j) => lut[i*4+j] = clamp01(v) * 255); lut[i*4+3] = 255;
  }
  LUTS[k] = new Uint32Array(lut.buffer);
}
const off = document.createElement("canvas"), offCtx = off.getContext("2d");
let img = null;
function draw2d(b, nx, ny) {
  if (!img || img.width !== nx || img.height !== ny) {
    off.width = nx; off.height = ny; img = offCtx.createImageData(nx, ny);
  }
  const px = new Uint32Array(img.data.buffer), lut = LUTS[cmapIndex()];
  for (let y = 0; y < ny; y++) {             // flip: row 0 is the tunnel bottom
    const src = y * nx, dst = (ny - 1 - y) * nx;
    for (let x = 0; x < nx; x++) px[dst + x] = lut[b[src + x]];
  }
  offCtx.putImageData(img, 0, 0);
}
function blit2d() {
  const W = canvas.width, H = canvas.height, nx = off.width, ny = off.height, z = view.zoom;
  ctx2d.fillStyle = "#080a12"; ctx2d.fillRect(0, 0, W, H);
  // visible window in texture space [u0,u1]x[v0,v1] (v up) -> source rect (y down)
  const u0 = view.cx - 0.5 / z, v1 = view.cy + 0.5 / z;
  ctx2d.imageSmoothingEnabled = true;
  ctx2d.setTransform(W * z, 0, 0, H * z, -u0 * W * z, -(1 - v1) * H * z);
  ctx2d.drawImage(off, 0, 0, nx, ny, 0, 0, 1, 1);
  ctx2d.setTransform(1, 0, 0, 1, 0, 0);
}

// float16 -> float32 lookup table (built once)
const HALF = new Float32Array(65536);
for (let h = 0; h < 65536; h++) {
  const s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, m = h & 0x3ff;
  HALF[h] = e === 0 ? s * m * 2 ** -24 : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * 2 ** (e - 15);
}
let bytes = new Uint8Array(0);
function normalise(half, vmin, vmax) {
  if (bytes.length !== half.length) bytes = new Uint8Array(half.length);
  const k = 254 / (vmax - vmin);
  for (let i = 0; i < half.length; i++) {
    const v = HALF[half[i]];
    if (v !== v || v === Infinity || v === -Infinity) { bytes[i] = 255; continue; }
    const q = (v - vmin) * k;
    bytes[i] = q < 0 ? 0 : q > 254 ? 254 : q;
  }
  return bytes;
}

// ---------------------------------------------------------------- state
let meta = null, frames = 0, lastFps = performance.now();
const history = [];
const CMAP_AUTO = { smoke: 4, vorticity: 2, pressure: 2, uy: 2, speed: 3, ux: 1 };
const LABELS = { smoke: "smoke", vorticity: "ω·c/U", speed: "|u|/U", pressure: "Cp", ux: "uₓ/U", uy: "u_y/U" };

// ---------------------------------------------------------------- zoom / pan
const view = { zoom: 1, cx: 0.5, cy: 0.5 };
const ZMIN = 0.5, ZMAX = 20;
function clampView() {
  view.zoom = Math.min(ZMAX, Math.max(ZMIN, view.zoom));
  view.cx = Math.min(1, Math.max(0, view.cx));
  view.cy = Math.min(1, Math.max(0, view.cy));
  $("zoom-val").textContent = `${Math.round(view.zoom * 100)}%`;
}
function screenToUV(e) {            // canvas uv, v up
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
}
function uvToTunnel(uv) {
  const wx = view.cx + (uv[0] - 0.5) / view.zoom;
  const wy = view.cy + (uv[1] - 0.5) / view.zoom;
  return [Math.max(0, Math.min(1, wx)), Math.max(0, Math.min(1, wy))];
}
function tunnelToScreen(tx, ty) {
  const r = canvas.getBoundingClientRect();
  const u = 0.5 + (tx - view.cx) * view.zoom;
  const v = 0.5 + (ty - view.cy) * view.zoom;
  return [u * r.width, (1 - v) * r.height];
}
function zoomAt(factor, m = [0.5, 0.5]) {
  const wx = view.cx + (m[0] - 0.5) / view.zoom, wy = view.cy + (m[1] - 0.5) / view.zoom;
  view.zoom = Math.min(ZMAX, Math.max(ZMIN, view.zoom * factor));
  view.cx = wx - (m[0] - 0.5) / view.zoom; view.cy = wy - (m[1] - 0.5) / view.zoom;
  clampView(); render();
}
canvas.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), screenToUV(e)); }, { passive: false });

let drag = null;
let wandMode = false;
let wandDragging = false;
const wandReticle = $("wand-reticle");
const wandHint = $("wand-hint");

function updateWandReticle(e) {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (x < 0 || y < 0 || x > r.width || y > r.height) {
    wandReticle.classList.add("hidden");
    return;
  }
  wandReticle.classList.remove("hidden");
  wandReticle.style.left = `${x}px`;
  wandReticle.style.top = `${y}px`;
}

canvas.addEventListener("pointerdown", (e) => {
  if (wandMode || e.shiftKey) {
    wandDragging = true;
    const [wx, wy] = uvToTunnel(screenToUV(e));
    send({ wand: { active: true, x: wx, y: wy } });
    updateWandReticle(e);
    return;
  }
  drag = screenToUV(e);
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add("dragging");
});

canvas.addEventListener("pointermove", (e) => {
  if (wandMode || e.shiftKey) {
    updateWandReticle(e);
  } else if (!wandDragging) {
    wandReticle.classList.add("hidden");
  }
  if (wandDragging) {
    const [wx, wy] = uvToTunnel(screenToUV(e));
    send({ wand: { active: true, x: wx, y: wy } });
    return;
  }
  if (!drag) return;
  const m = screenToUV(e);
  view.cx -= (m[0] - drag[0]) / view.zoom;
  view.cy -= (m[1] - drag[1]) / view.zoom;
  drag = m;
  clampView();
  render();
});

const endDrag = (e) => {
  if (wandDragging) {
    wandDragging = false;
    send({ wand: { active: false } });
    if (!wandMode) wandReticle.classList.add("hidden");
  }
  drag = null;
  canvas.classList.remove("dragging");
};
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", endDrag);
canvas.addEventListener("pointerleave", () => {
  if (!wandDragging) wandReticle.classList.add("hidden");
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !wandMode) {
    wandHint.classList.remove("hidden");
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift" && !wandMode) {
    wandHint.classList.add("hidden");
    if (!wandDragging) wandReticle.classList.add("hidden");
  }
});

canvas.addEventListener("dblclick", () => { Object.assign(view, { zoom: 1, cx: 0.5, cy: 0.5 }); clampView(); render(); });
$("btn-zoom-in").onclick = () => zoomAt(1.5);
$("btn-zoom-out").onclick = () => zoomAt(1 / 1.5);
$("btn-zoom-reset").onclick = () => { Object.assign(view, { zoom: 1, cx: 0.5, cy: 0.5 }); clampView(); render(); };

function resize() {
  const r = canvas.getBoundingClientRect(), d = devicePixelRatio || 1;
  canvas.width = r.width * d; canvas.height = r.height * d;
  if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  if (vectorCanvas) {
    vectorCanvas.width = r.width * d;
    vectorCanvas.height = r.height * d;
  }
  render();
  drawVectors();
}
addEventListener("resize", resize);

function cmapIndex() {
  const sel = +$("cmap-select").value;
  return sel || CMAP_AUTO[$("field-select").value] || 1;
}
const CSS_CMAPS = {
  1: "linear-gradient(90deg,#30123b,#4686fb,#1be5b5,#a4fc3c,#fbb938,#e4460a,#7a0403)",
  2: "linear-gradient(90deg,#40d9ff,#123,#050811,#321,#ff7326)",
  3: "linear-gradient(90deg,#000004,#420a68,#932667,#dd513a,#fca50a,#fcffa4)",
  4: "linear-gradient(90deg,#03050c,#38b6ff,#ffffff)",
};

let hasFrame = false;
function draw(data) {
  const b = normalise(data, meta.vmin, meta.vmax);
  hasFrame = true;
  if (!gl) { draw2d(b, meta.nx, meta.ny); return render(); }
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, meta.nx, meta.ny, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, b);
  render();
}

// re-draw with the current view (called on new frames and on zoom/pan)
function render() {
  if (!hasFrame) return;
  if (!gl) blit2d();
  else {
    gl.uniform1i(U.field, 0);
    gl.uniform1i(U.cmap, cmapIndex());
    gl.uniform2f(U.texel, 1 / meta.nx, 1 / meta.ny);
    gl.uniform2f(U.center, view.cx, view.cy);
    gl.uniform1f(U.zoom, view.zoom);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  drawVectors();
}
resize();

function updateStats() {
  const f = (x, d = 3) => Number.isFinite(x) ? x.toFixed(d) : "–";
  $("cl-val").textContent = f(meta.cl);
  $("cd-val").textContent = f(meta.cd);
  $("ld-val").textContent = Math.abs(meta.cd) > 1e-4 ? f(meta.cl / meta.cd, 1) : "–";
  $("mlups-val").textContent = f(meta.mlups, 1);
  $("step-val").textContent = meta.step.toLocaleString();
  $("tau-val").textContent = f(meta.tau, 4);
  $("legend-min").textContent = f(meta.vmin, 2);
  $("legend-max").textContent = f(meta.vmax, 2);
  $("legend-label").textContent = LABELS[meta.params.field] || "";
  $("legend-bar").style.background = CSS_CMAPS[cmapIndex()];
  $("btn-gpu").disabled = !meta.gpu;
  $("btn-gpu").title = meta.gpu ? "" : "CuPy / CUDA not available on server";
  document.querySelectorAll("#backend-seg button").forEach(b =>
    b.classList.toggle("active", b.dataset.backend === meta.backend));
  $("btn-pause").textContent = meta.params.paused ? "▶ Resume" : "⏸ Pause";
  const banner = $("status-banner");
  banner.textContent = meta.status; banner.classList.toggle("hidden", meta.status === "ok");

  history.push([meta.cl, meta.cd]); if (history.length > 300) history.shift();
  plot();
  drawVectors();
  frames++;
  const now = performance.now();
  if (now - lastFps > 1000) { $("fps-val").textContent = frames; frames = 0; lastFps = now; }
}

function plot() {
  const c = $("plot-canvas"), g = c.getContext("2d"), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  const vals = history.flat().filter(Number.isFinite);
  if (!vals.length) return;
  let lo = Math.min(0, ...vals), hi = Math.max(0.1, ...vals); const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const y = v => H - (v - lo) / (hi - lo) * H;
  g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(0, y(0)); g.lineTo(W, y(0)); g.stroke();
  [[0, "#38d9f5"], [1, "#c06cf0"]].forEach(([k, col]) => {
    g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
    history.forEach((h, i) => { const x = i / 299 * W; i ? g.lineTo(x, y(h[k])) : g.moveTo(x, y(h[k])); });
    g.stroke();
  });
  g.font = "12px JetBrains Mono"; g.fillStyle = "#38d9f5"; g.fillText("CL", 8, 14);
  g.fillStyle = "#c06cf0"; g.fillText("CD", 36, 14);
}

// ---------------------------------------------------------------- socket
let ws;
function connect() {
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => { $("conn-status").classList.add("on"); $("conn-text").textContent = "live"; };
  ws.onclose = () => {
    $("conn-status").classList.remove("on");
    $("conn-text").textContent = "reconnecting…";
    synced = false;
    setTimeout(connect, 1000);
  };
  ws.onmessage = (e) => {
    if (typeof e.data === "string") {
      const msg = JSON.parse(e.data);
      if (msg.type === "init") {
        syncControls(msg.params);
        return;
      }
      meta = msg;
      syncControls(meta.params);
      return;
    }
    if (!meta) return;
    draw(new Uint16Array(e.data));
    updateStats();
  };
}
const send = (o) => ws && ws.readyState === 1 && ws.send(JSON.stringify(o));

// ---------------------------------------------------------------- controls
let synced = false;
function syncControls(p) {
  if (synced) return; synced = true;   // initialise UI from server state once
  $("naca-input").value = p.naca;
  $("aoa-slider").value = p.aoa; $("aoa-val").textContent = `${(+p.aoa).toFixed(1)}°`;
  $("re-slider").value = Math.log10(p.re); $("re-val").textContent = Math.round(p.re);
  $("u-slider").value = p.u_in; $("u-val").textContent = (+p.u_in).toFixed(3);
  $("smag-toggle").checked = p.smagorinsky;
  $("res-select").value = p.resolution;
  $("field-select").value = p.field;
  if (p.smoke_lines) $("smoke-lines-select").value = String(p.smoke_lines);
  if (p.smoke_mode) {
    document.querySelectorAll("#smoke-mode-seg button").forEach(b =>
      b.classList.toggle("active", b.dataset.mode === p.smoke_mode));
  }
}

$("aoa-slider").oninput = (e) => { $("aoa-val").textContent = `${(+e.target.value).toFixed(1)}°`; send({ aoa: +e.target.value }); };
$("re-slider").oninput = (e) => { const re = 10 ** +e.target.value; $("re-val").textContent = Math.round(re); send({ re }); };
$("u-slider").oninput = (e) => { $("u-val").textContent = (+e.target.value).toFixed(3); send({ u_in: +e.target.value }); };
$("smag-toggle").onchange = (e) => send({ smagorinsky: e.target.checked });
$("naca-input").onchange = (e) => /^\d{4}$/.test(e.target.value) && send({ naca: e.target.value });
$("res-select").onchange = (e) => { history.length = 0; send({ resolution: e.target.value }); };
$("field-select").onchange = (e) => send({ field: e.target.value });
document.querySelectorAll("#backend-seg button").forEach(b => b.onclick = () => send({ backend: b.dataset.backend }));
$("btn-pause").onclick = () => send({ paused: !(meta && meta.params.paused) });
$("btn-reset").onclick = () => { history.length = 0; send({ reset: true }); };

// Smoke specific controls
document.querySelectorAll("#smoke-mode-seg button").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll("#smoke-mode-seg button").forEach(btn => btn.classList.remove("active"));
    b.classList.add("active");
    send({ smoke_mode: b.dataset.mode });
  };
});
$("smoke-lines-select").onchange = (e) => send({ smoke_lines: +e.target.value });
$("btn-clear-smoke").onclick = () => send({ clear_smoke: true });
$("btn-wand").onclick = () => {
  wandMode = !wandMode;
  $("btn-wand").classList.toggle("active-glow", wandMode);
  wandHint.classList.toggle("hidden", !wandMode);
  if (!wandMode) {
    wandReticle.classList.add("hidden");
    send({ wand: { active: false } });
  }
};

// ---------------------------------------------------------------- aerodynamic vectors
let showVectors = true;
let showComponents = true;
let showResultant = true;
let vectorScale = 1.0;

function drawArrow(ctx, x0, y0, x1, y1, color, glowColor, width, label, tagOffset) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const headLen = Math.min(20, Math.max(9, len * 0.28));
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  // Shaft
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  // Swept aerodynamic arrowhead
  const sweep = 0.42;
  const hx1 = x1 - headLen * Math.cos(angle - sweep);
  const hy1 = y1 - headLen * Math.sin(angle - sweep);
  const hx2 = x1 - headLen * Math.cos(angle + sweep);
  const hy2 = y1 - headLen * Math.sin(angle + sweep);
  const inset = headLen * 0.28;
  const hx0 = x1 - (headLen - inset) * Math.cos(angle);
  const hy0 = y1 - (headLen - inset) * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(hx1, hy1);
  ctx.lineTo(hx0, hy0);
  ctx.lineTo(hx2, hy2);
  ctx.closePath();
  ctx.fill();

  // Label badge
  if (label) {
    ctx.shadowBlur = 4;
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    const tw = ctx.measureText(label).width;
    const pw = tw + 14, ph = 18;
    const r = canvas.getBoundingClientRect();
    const rawLx = tagOffset ? (x1 + tagOffset[0]) : (x1 + Math.cos(angle) * (headLen + 14));
    const rawLy = tagOffset ? (y1 + tagOffset[1]) : (y1 + Math.sin(angle) * (headLen + 14));
    const lx = Math.max(pw / 2 + 8, Math.min(r.width - pw / 2 - 8, rawLx));
    const ly = Math.max(ph / 2 + 8, Math.min(r.height - ph / 2 - 8, rawLy));

    ctx.fillStyle = "hsla(225, 30%, 8%, 0.90)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx - pw / 2, ly - ph / 2, pw, ph, 5);
    else ctx.rect(lx - pw / 2, ly - ph / 2, pw, ph);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  }
  ctx.restore();
}

function drawVectors() {
  if (!vctx || !meta) return;
  const r = canvas.getBoundingClientRect();
  const d = window.devicePixelRatio || 1;
  if (vectorCanvas.width !== r.width * d || vectorCanvas.height !== r.height * d) {
    vectorCanvas.width = r.width * d;
    vectorCanvas.height = r.height * d;
  }
  vctx.save();
  vctx.setTransform(d, 0, 0, d, 0, 0);
  vctx.clearRect(0, 0, r.width, r.height);

  if (!showVectors || !Number.isFinite(meta.cl) || !Number.isFinite(meta.cd)) {
    vctx.restore();
    return;
  }

  // Aerodynamic quarter-chord pivot point in tunnel coordinates
  const ac = meta.ac || [0.26, 0.5];
  const [ax, ay] = tunnelToScreen(ac[0], ac[1]);

  // Screen chord length (scales proportionally with zoom)
  const chordNorm = meta.chord_norm || 0.16;
  const chordPx = chordNorm * view.zoom * r.width;
  const scale = vectorScale * chordPx;

  const cl = meta.cl;
  const cd = meta.cd;
  const dxD = cd * scale;
  const dyD = 0;
  const dxL = 0;
  const dyL = -cl * scale; // screen y is inverted (up is negative)
  const dxR = dxD;
  const dyR = dyL;

  const tipDx = ax + dxD;
  const tipDy = ay + dyD;
  const tipLx = ax + dxL;
  const tipLy = ay + dyL;
  const tipRx = ax + dxR;
  const tipRy = ay + dyR;

  // Parallelogram projection lines
  if (showComponents && showResultant && (Math.hypot(dxD, dyD) > 4 || Math.hypot(dxL, dyL) > 4)) {
    vctx.save();
    vctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    vctx.lineWidth = 1.2;
    vctx.setLineDash([4, 4]);
    vctx.beginPath();
    vctx.moveTo(tipLx, tipLy);
    vctx.lineTo(tipRx, tipRy);
    vctx.lineTo(tipDx, tipDy);
    vctx.stroke();
    vctx.restore();
  }

  // Components (Lift & Drag)
  if (showComponents) {
    const clSign = cl >= 0 ? "+" : "";
    drawArrow(vctx, ax, ay, tipLx, tipLy,
      "#00e5ff", "rgba(0, 229, 255, 0.75)", 3.2,
      `L (CL = ${clSign}${cl.toFixed(2)})`, [0, cl >= 0 ? -16 : 16]);

    drawArrow(vctx, ax, ay, tipDx, tipDy,
      "#ff3b69", "rgba(255, 59, 105, 0.75)", 3.2,
      `D (CD = ${cd.toFixed(2)})`, [26, 0]);
  }

  // Resultant (R)
  if (showResultant) {
    const cr = Math.hypot(cl, cd);
    drawArrow(vctx, ax, ay, tipRx, tipRy,
      "#ffcc00", "rgba(255, 204, 0, 0.85)", 3.8,
      `R (CR = ${cr.toFixed(2)})`, null);
  }

  // Aerodynamic Center Reticle at c/4
  vctx.save();
  vctx.shadowColor = "#00e5ff";
  vctx.shadowBlur = 8;
  vctx.strokeStyle = "#00e5ff";
  vctx.lineWidth = 1.8;
  vctx.beginPath();
  vctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
  vctx.stroke();

  vctx.fillStyle = "#ffffff";
  vctx.beginPath();
  vctx.arc(ax, ay, 2.2, 0, Math.PI * 2);
  vctx.fill();

  vctx.shadowBlur = 3;
  vctx.font = "600 10px 'JetBrains Mono', monospace";
  vctx.fillStyle = "rgba(200, 230, 255, 0.85)";
  vctx.textAlign = "right";
  vctx.textBaseline = "middle";
  vctx.fillText("c/4 (A.C.)", ax - 8, ay + 12);
  vctx.restore();

  vctx.restore();
}

// Vector control listeners
$("vec-toggle").onchange = (e) => {
  showVectors = e.target.checked;
  $("vec-options").style.opacity = showVectors ? "1" : "0.35";
  $("vec-options").style.pointerEvents = showVectors ? "auto" : "none";
  drawVectors();
};
$("vec-comp-toggle").onchange = (e) => { showComponents = e.target.checked; drawVectors(); };
$("vec-res-toggle").onchange = (e) => { showResultant = e.target.checked; drawVectors(); };
$("vec-scale-slider").oninput = (e) => {
  vectorScale = +e.target.value;
  $("vec-scale-val").textContent = `${vectorScale.toFixed(1)}×`;
  drawVectors();
};

connect();
