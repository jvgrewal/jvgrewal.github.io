/* Quiet, decorative B3/S23 simulations outside the homepage's reading area. */
(() => {
  const canvas = document.getElementById('life-margins');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const patterns = [
    [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]],
    [[0, 0], [1, 0], [2, 0]]
  ];
  let boards = [];
  let timer = null;
  let resizeFrame = null;
  let generation = 0;
  let width = 0;
  let height = 0;

  function createBoard(zone, index) {
    const columns = Math.floor(zone.width / zone.pitch);
    const rows = Math.floor(zone.height / zone.pitch);
    const cells = new Uint8Array(columns * rows);
    let seed = 5719 + index * 1907 + columns * 31 + rows;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const count = Math.max(3, Math.min(12, Math.floor(columns * rows / 190)));
    for (let i = 0; i < count; i++) {
      const pattern = patterns[(i + index) % patterns.length];
      const startX = Math.floor(random() * Math.max(1, columns - 7));
      const startY = Math.floor((i + 0.25 + random() * 0.5) * rows / count);
      for (const [dx, dy] of pattern) {
        const x = index % 2 ? columns - 1 - ((startX + dx) % columns) : (startX + dx) % columns;
        cells[((startY + dy) % rows) * columns + x] = 1;
      }
    }
    return {
      columns, rows, cells, pitch: zone.pitch,
      next: new Uint8Array(cells.length),
      x: zone.x + (zone.width - columns * zone.pitch) / 2,
      y: zone.y + (zone.height - rows * zone.pitch) / 2
    };
  }

  function paint() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#b8b8b8';
    for (const board of boards) {
      const cellSize = board.pitch - 4;
      for (let y = 0; y < board.rows; y++) {
        for (let x = 0; x < board.columns; x++) {
          if (board.cells[y * board.columns + x]) {
            context.fillRect(
              Math.round(board.x + x * board.pitch + 2),
              Math.round(board.y + y * board.pitch + 2),
              cellSize, cellSize
            );
          }
        }
      }
    }
    canvas.dataset.generation = String(generation);
  }

  function tick() {
    for (const board of boards) {
      const {columns, rows, cells, next} = board;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx || dy) {
                neighbors += cells[((y + dy + rows) % rows) * columns + (x + dx + columns) % columns];
              }
            }
          }
          const index = y * columns + x;
          next[index] = neighbors === 3 || (neighbors === 2 && cells[index]) ? 1 : 0;
        }
      }
      board.cells = next;
      board.next = cells;
    }
    generation++;
    paint();
  }

  function synchronize() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (!document.hidden && !motion.matches && boards.length) {
      timer = setInterval(tick, 500);
    }
  }

  function resize() {
    resizeFrame = null;
    const compact = window.matchMedia('(max-width: 900px)').matches;
    width = compact ? canvas.clientWidth : document.documentElement.clientWidth || window.innerWidth;
    height = compact ? canvas.clientHeight : window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);

    const body = document.body.getBoundingClientRect();
    const sideWidth = Math.max(0, Math.floor(Math.min(body.left, width - body.right)) - 32);
    const zones = [];
    if (!compact && sideWidth >= 84 && height >= 84) {
      zones.push({x: 0, y: 0, width: sideWidth, height, pitch: 12});
      zones.push({x: width - sideWidth, y: 0, width: sideWidth, height, pitch: 12});
    }

    // On mobile, CSS places the canvas in the page flow below the copy.
    if (compact && width >= 172 && height >= 64) {
      zones.push({x: 0, y: 0, width, height, pitch: 8});
    }
    boards = zones.map(createBoard);
    generation = 0;
    paint();
    synchronize();
  }

  window.addEventListener('resize', () => {
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  });
  document.addEventListener('visibilitychange', synchronize);
  motion.addEventListener('change', synchronize);
  window.addEventListener('pagehide', () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
    if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  });
  window.addEventListener('pageshow', synchronize);
  resize();
})();
