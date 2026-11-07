/* A short wheel ease-out on the page and paper rail; native touch and keys. */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  let frame = null;
  let previousTime = null;

  const limit = (element, horizontal) => Math.max(0, horizontal
    ? element.scrollWidth - element.clientWidth
    : element.scrollHeight - element.clientHeight);
  const read = (element, horizontal) => horizontal ? element.scrollLeft : element.scrollTop;
  const clamp = (value, maximum) => Math.max(0, Math.min(maximum, value));

  function cancel() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = previousTime = null;
    states.clear();
  }

  function animate(time) {
    const elapsed = previousTime === null ? 16.7 : Math.min(64, time - previousTime);
    previousTime = time;
    for (const [element, state] of states) {
      const actual = read(element, state.horizontal);
      // Yield to anchors, history restoration, scrollbars, or other native input.
      if (Math.abs(actual - state.written) > 2) {
        states.delete(element);
        continue;
      }
      state.target = clamp(state.target, limit(element, state.horizontal));
      const blend = 1 - Math.exp(-elapsed / state.settle);
      state.current += (state.target - state.current) * blend;
      if (Math.abs(state.target - state.current) < .5) state.current = state.target;
      if (state.horizontal) element.scrollLeft = state.current;
      else element.scrollTop = state.current;
      state.written = read(element, state.horizontal);
      if (state.current === state.target) states.delete(element);
    }
    if (states.size) frame = requestAnimationFrame(animate);
    else frame = previousTime = null;
  }

  window.addEventListener('wheel', event => {
    if (motion.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey) return;
    const node = event.target && event.target.nodeType === 1 ? event.target : null;
    // Preserve native scrolling inside code, tables, fields, and custom widgets.
    if (node && node.closest('pre, table, textarea, select, [contenteditable], [data-native-scroll]')) {
      cancel();
      return;
    }
    const horizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
    let delta = horizontal ? (event.deltaX || event.deltaY) : event.deltaY;
    if (!delta) return;
    const root = document.scrollingElement;
    const shelf = node && node.closest('.paper-shelf');
    const element = horizontal ? shelf : root;
    if (!element) return;
    const maximum = limit(element, horizontal);
    if (maximum <= 1) return;

    // Other independently scrollable elements keep their own native behavior.
    if (!horizontal && node) {
      for (let parent = node; parent && parent !== document.body; parent = parent.parentElement) {
        if (parent.scrollHeight > parent.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(parent).overflowY)) {
          cancel();
          return;
        }
      }
    }
    if (event.deltaMode === 1) delta *= 18;
    if (event.deltaMode === 2) delta *= horizontal ? element.clientWidth : window.innerHeight;
    const actual = read(element, horizontal);
    let state = states.get(element);
    if (!state || state.horizontal !== horizontal || Math.abs(actual - state.written) > 2) {
      state = {horizontal, current: actual, target: actual, written: actual};
    }
    const target = clamp(state.target + delta * .94, maximum);
    if (!horizontal && target === actual && !states.has(element)) return;
    event.preventDefault();
    state.target = target;
    // High-resolution trackpads get less lag than coarse mouse wheels.
    state.settle = event.deltaMode === 0 && Math.abs(delta) < 50 ? 55 : 85;
    states.set(element, state);
    if (frame === null) frame = requestAnimationFrame(animate);
  }, {passive: false});

  window.addEventListener('pointerdown', cancel, {passive: true});
  window.addEventListener('reading:before-center', cancel);
  window.addEventListener('touchstart', cancel, {passive: true});
  window.addEventListener('click', cancel, {passive: true});
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancel();
  }, {capture: true});
  window.addEventListener('resize', cancel, {passive: true});
  window.addEventListener('pagehide', cancel);
  window.addEventListener('popstate', cancel);
  window.addEventListener('hashchange', cancel);
  document.addEventListener('visibilitychange', cancel);
  motion.addEventListener('change', cancel);
})();
