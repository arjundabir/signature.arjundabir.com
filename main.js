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
const codeHTML = (code, type) => {
  const codeId = `code-${type.toLowerCase()}-${Date.now()}`;
  return `<h3 class="mb-2 text-base font-medium">${type}</h3>
<div class="relative">
  <pre class="m-0"><code class="select-all block p-4 bg-gray-100 rounded overflow-x-auto" id="${codeId}">${escapeHtml(
    code
  )}</code></pre>
  <button 
    onclick="navigator.clipboard.writeText(document.getElementById('${codeId}').textContent)"
    class="absolute top-2 right-2 p-2 bg-transparent border-none cursor-pointer opacity-60 rounded flex items-center justify-center hover:opacity-100" 
  >
    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-copy"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" /><path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" /></svg>
  </button>
</div>`;
};

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
  <div class="relative mt-8">
  ${codeHTML(htmlContent, 'HTML')}
  ${codeHTML(cssContent, 'CSS')}
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
