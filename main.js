const svg = document.getElementById('signature'),
  NS = 'http://www.w3.org/2000/svg';
const playBtn = document.getElementById('play-button');
const strokeEls = [];
const strokeTimes = [];
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
  pathEl.classList.add('stroke');
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
  strokeEls.push(pathEl);
  strokeTimes.push((endTime - startTime) / 1000);
  // animatePath(pathEl); // Don't animate immediately
  pathEl = null;
  points = [];
}

function pointsToPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

function animateSignature() {
  // Reset all strokes
  strokeEls.forEach((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.style.animation = 'none';
    // Force reflow to ensure animation reset takes effect
    el.getBoundingClientRect();
  });

  let currentDelay = 0;
  let style = document.getElementById('dynamic-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-style';
    document.head.appendChild(style);
  }
  // Clear previous rules to avoid buildup
  while (style.sheet.cssRules.length > 0) {
    style.sheet.deleteRule(0);
  }

  strokeEls.forEach((el, index) => {
    const len = el.getTotalLength();
    const duration = strokeTimes[index];
    const animName = `draw-${Date.now()}-${index}`;

    const keyframes = `@keyframes ${animName} {
      from { stroke-dashoffset: ${len}; }
      to { stroke-dashoffset: 0; }
    }`;
    style.sheet.insertRule(keyframes, style.sheet.cssRules.length);

    el.style.animation = `${animName} ${duration}s ease-in-out forwards ${currentDelay}s`;

    currentDelay += duration;
  });

  const code = document.getElementById('code');

  // Generate HTML (SVG with all paths)
  let htmlContent = '<svg id="signature" width="100%" height="100%">\n';
  strokeEls.forEach((el, index) => {
    const d = el.getAttribute('d');
    htmlContent += `  <path class="stroke" d="${d}" />\n`;
  });
  htmlContent += '</svg>';

  // Generate CSS (all keyframes and animations)
  let cssContent = '';
  let cssDelay = 0;
  strokeEls.forEach((el, index) => {
    const len = el.getTotalLength();
    const duration = strokeTimes[index];
    const animName = `draw-${index}`;

    cssContent += `@keyframes ${animName} {\n`;
    cssContent += `  from { stroke-dashoffset: ${len}; }\n`;
    cssContent += `  to { stroke-dashoffset: 0; }\n`;
    cssContent += `}\n\n`;

    cssContent += `.stroke:nth-child(${index + 1}) {\n`;
    cssContent += `  stroke-dasharray: ${len};\n`;
    cssContent += `  stroke-dashoffset: ${len};\n`;
    cssContent += `  animation: ${animName} ${duration}s ease-in-out forwards ${cssDelay}s;\n`;
    cssContent += `}\n\n`;

    cssDelay += duration;
  });

  // Display HTML and CSS in the code div
  code.innerHTML = `
    <div style="margin-top: 2rem;">
      <h3 style="margin-bottom: 0.5rem; font-size: 16px; font-weight: 500; margin: 0;">HTML:</h3>
      <pre style="margin: 0;"><code style="display: block; padding: 1rem; background: #f5f5f5; border-radius: 4px; overflow-x: auto;">${escapeHtml(
        htmlContent
      )}</code></pre>
    </div>
    <div style="margin-top: 2rem;">
      <h3 style="font-size: 16px; font-weight: 500; margin: 0;">CSS:</h3>
      <pre style="margin: 0;"><code style="display: block; padding: 1rem; background: #f5f5f5; border-radius: 4px; overflow-x: auto;">${escapeHtml(
        cssContent
      )}</code></pre>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

svg.addEventListener('pointerdown', start);
svg.addEventListener('pointermove', draw);
svg.addEventListener('pointerup', stop);
svg.addEventListener('pointerleave', stop);
playBtn.addEventListener('click', animateSignature);
