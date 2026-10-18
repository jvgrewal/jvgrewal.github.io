/* Four B3/S23 glider generations, following the glider to keep it in view. */
(() => {
  const icon = document.getElementById('site-favicon');
  if (!icon) return;

  const staticIcon = icon.href;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phases = [
    [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [2, 0], [1, 1], [2, 1], [1, 2]],
    [[2, 0], [0, 1], [2, 1], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 1], [0, 2], [1, 2]]
  ];
  const frames = phases.map(cells => {
    const pixels = cells.map(([x, y]) =>
      `<rect x="${5 + x * 8}" y="${5 + y * 8}" width="6" height="6"/>`
    ).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" fill="#fff"/><g fill="#222">${pixels}</g></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  });

  let timer = null;
  let phase = 0;
  function updateAnimation() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    phase = 0;
    icon.href = staticIcon;
    if (document.hidden || reducedMotion.matches) return;

    icon.href = frames[0];
    timer = setInterval(() => {
      phase = (phase + 1) % frames.length;
      icon.href = frames[phase];
    }, 500);
  }

  document.addEventListener('visibilitychange', updateAnimation);
  reducedMotion.addEventListener('change', updateAnimation);
  window.addEventListener('pagehide', () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  });
  window.addEventListener('pageshow', updateAnimation);
  updateAnimation();
})();
