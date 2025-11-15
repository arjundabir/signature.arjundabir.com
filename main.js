const svg = document.getElementById('signature'),
  NS = 'http://www.w3.org/2000/svg';
let isDrawing = false,
  points = [],
  pathEl = null,
  startTime = 0,
  endTime = 0;
function getPos(e) {
  const r = svg.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function start(e) {
  isDrawing = true;
  startTime = Date.now();
  points = [getPos(e)];
  pathEl = document.createElementNS(NS, 'path');
  pathEl.classList.add('stroke', 'hidden');
  svg.appendChild(pathEl);
}
function draw(e) {
  if (!isDrawing) return;
  const p = getPos(e);
  points.push(p);
  pathEl.setAttribute('d', pointsToPath(points));
}
function stop() {
  if (!isDrawing) return;
  isDrawing = false;
  endTime = Date.now();
  animatePath(pathEl);
  pathEl = null;
  points = [];
}
function pointsToPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}
function animatePath(el) {
  const len = el.getTotalLength();
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = len;
  const animName = `draw-${Date.now()}`;
  const keyframes = `@keyframes ${animName}{from{stroke-dashoffset:${len};}to{stroke-dashoffset:0;}}`;
  let style = document.getElementById('dynamic-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-style';
    document.head.appendChild(style);
  }
  style.sheet.insertRule(keyframes, style.sheet.cssRules.length);
  timeDiff = (endTime - startTime) / 1000;
  el.style.animation = `${animName} ${timeDiff}s ease-in-out forwards`;
}
svg.addEventListener('pointerdown', start);
svg.addEventListener('pointermove', draw);
svg.addEventListener('pointerup', stop);
svg.addEventListener('pointerleave', stop);
