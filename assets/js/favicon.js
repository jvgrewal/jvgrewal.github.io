/* Four B3/S23 glider generations, following the glider to keep it in view. */
(() => {
  const icon = document.getElementById('site-favicon');
  if (!icon) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const theme = window.matchMedia('(prefers-color-scheme: dark)');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  if (!context) return; // Keep the theme-aware SVG when canvas is unavailable.
  const phases = [
    [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    [[0, 0], [2, 0], [1, 1], [2, 1], [1, 2]],
    [[2, 0], [0, 1], [2, 1], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 1], [0, 2], [1, 2]]
  ];
  function makeFrames(dark) {
    return phases.map(cells => {
      context.fillStyle = dark ? '#000' : '#fff';
      context.fillRect(0, 0, 32, 32);
      context.fillStyle = dark ? '#ddd' : '#222';
      for (const [x, y] of cells) {
        context.fillRect(5 + x * 8, 5 + y * 8, 6, 6);
      }
      return canvas.toDataURL('image/png');
    });
  }
  const frames = {light: makeFrames(false), dark: makeFrames(true)};
  icon.type = 'image/png';
  icon.sizes = '32x32';

  let timer = null;
  let phase = 0;
  function paint() {
    icon.href = frames[theme.matches ? 'dark' : 'light'][phase];
  }
  function updateAnimation() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    phase = 0;
    // A paused tab still needs the right colors, without relying on SVG caching.
    paint();
    if (document.hidden || reducedMotion.matches) return;

    timer = setInterval(() => {
      phase = (phase + 1) % phases.length;
      paint();
    }, 500);
  }

  document.addEventListener('visibilitychange', updateAnimation);
  reducedMotion.addEventListener('change', updateAnimation);
  theme.addEventListener('change', updateAnimation);
  window.addEventListener('pagehide', () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
    phase = 0;
    paint();
  });
  window.addEventListener('pageshow', updateAnimation);
  window.addEventListener('focus', updateAnimation);
  updateAnimation();
})();
