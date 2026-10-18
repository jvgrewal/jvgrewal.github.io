/* A B3/S23 glider traveling across a 5x5 torus, wrapping at every edge. */
(() => {
  const icon = document.getElementById('site-favicon');
  if (!icon) return;

  const staticIcon = icon.href;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gridSize = 5;
  const cellPitch = 8;
  const iconSize = gridSize * cellPitch;
  const wrap = value => (value + gridSize) % gridSize;

  function nextGeneration(cells) {
    const living = new Set(cells.map(([x, y]) => y * gridSize + x));
    const neighbors = new Array(gridSize * gridSize).fill(0);
    for (const [x, y] of cells) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) neighbors[wrap(y + dy) * gridSize + wrap(x + dx)]++;
        }
      }
    }
    return neighbors.flatMap((count, index) =>
      count === 3 || (count === 2 && living.has(index))
        ? [[index % gridSize, Math.floor(index / gridSize)]]
        : []
    );
  }

  function render(cells) {
    const pixels = cells.map(([x, y]) =>
      `<rect x="${1 + x * cellPitch}" y="${1 + y * cellPitch}" width="6" height="6"/>`
    ).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconSize} ${iconSize}" shape-rendering="crispEdges"><rect width="${iconSize}" height="${iconSize}" fill="#fff"/><g fill="#222">${pixels}</g></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // After four generations it moves one cell diagonally; after 20 it loops.
  const frames = [];
  let cells = [[2, 1], [3, 2], [1, 3], [2, 3], [3, 3]];
  for (let generation = 0; generation < gridSize * 4; generation++) {
    frames.push(render(cells));
    cells = nextGeneration(cells);
  }

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
