/* A progressively enhanced paper shelf. Every paper still has a normal URL. */
(() => {
  const library = document.querySelector('[data-reading-library]');
  if (!library) return;
  const links = [...library.querySelectorAll('[data-paper-link]')];
  const panels = [...library.querySelectorAll('[data-paper-panel]')];
  const status = library.querySelector('[data-reading-status]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const row = library.querySelector('[data-paper-row]');
  const shelf = library.querySelector('.paper-shelf');
  const position = library.querySelector('[data-paper-position]');
  let snapTimer = null;
  let touching = false;
  let userScrolling = false;
  let touchOrigin = null;
  let paperAnimations = [];
  let heldKey = null;
  let pendingDirection = 0;
  let keyboardTimer = null;
  let keyboardReadyAt = 0;
  let keyboardSteps = 0;
  library.classList.add('is-enhanced');

  function stopPaperAnimations() {
    paperAnimations.forEach(animation => animation.cancel());
    paperAnimations = [];
  }

  function snapshotPapers() {
    const before = new Map();
    links.forEach(link => {
      const element = link.querySelector('.paper-object');
      if (element) before.set(element, element.getBoundingClientRect());
    });
    return before;
  }

  function animatePapers(before) {
    if (motion.matches) return;
    before.forEach((old, element) => {
      if (typeof element.animate !== 'function') return;
      const next = element.getBoundingClientRect();
      if (!next.width) return;
      const scale = old.width / next.width;
      const x = old.left - next.left;
      const y = old.top - next.top;
      if (Math.abs(x) < .5 && Math.abs(y) < .5 && Math.abs(scale - 1) < .005) return;
      // Map the old sheet onto its new layout, then let it open as neighbors move.
      paperAnimations.push(element.animate([
        {transform: `translate(${x}px, ${y}px) scale(${scale})`},
        {transform: 'none'}
      ], {duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)'}));
    });
  }

  function centerPosition(link) {
    const padding = parseFloat(getComputedStyle(shelf).paddingLeft) || 0;
    const target = link.offsetLeft + link.offsetWidth / 2 + padding - shelf.clientWidth / 2;
    return Math.max(0, Math.min(shelf.scrollWidth - shelf.clientWidth, target));
  }

  function center(link, smooth = true) {
    if (!shelf) return;
    const left = centerPosition(link);
    if (Math.abs(shelf.scrollLeft - left) > .75) {
      shelf.scrollTo({left, behavior: smooth && !motion.matches ? 'smooth' : 'instant'});
    }
  }

  function updatePosition() {
    if (!position) return;
    position.hidden = links.length < 2;
    let index = Math.max(0, links.findIndex(link => link.classList.contains('is-selected')));
    if (userScrolling && shelf && links.length > 1) {
      const centers = links.map(centerPosition);
      const offset = shelf.scrollLeft;
      let lower = 0;
      while (lower < links.length - 1 && offset > centers[lower + 1]) lower++;
      const upper = Math.min(lower + 1, links.length - 1);
      const distance = centers[upper] - centers[lower];
      index = lower + (distance ? Math.max(0, Math.min(1, (offset - centers[lower]) / distance)) : 0);
    }
    position.classList.toggle('is-tracking', userScrolling);
    position.style.setProperty('--position-size', `${100 / Math.max(1, links.length)}%`);
    position.style.setProperty('--position-offset', `${index * 100}%`);
  }

  function select(link, updateURL = true, replaceURL = false) {
    if (snapTimer !== null) clearTimeout(snapTimer);
    snapTimer = null;
    userScrolling = false;
    const changed = !link.classList.contains('is-selected');
    const before = changed && !motion.matches ? snapshotPapers() : null;
    if (changed) stopPaperAnimations();
    links.forEach(item => {
      const active = item === link;
      item.classList.toggle('is-selected', active);
      if (active) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    panels.forEach(panel => {
      const active = panel.id === link.dataset.note;
      panel.hidden = !active;
      panel.classList.toggle('is-selected', active);
    });
    if (updateURL && window.location.pathname !== new URL(link.href).pathname) {
      history[replaceURL ? 'replaceState' : 'pushState'](null, '', link.href);
    }
    const atIndex = window.location.pathname === new URL('../', link.href).pathname;
    document.title = `${atIndex ? 'Reading' : link.dataset.title} · ${library.dataset.siteTitle}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;
    const description = document.querySelector('meta[name="description"]');
    if (description && link.dataset.description) description.content = link.dataset.description;
    if (changed) status.textContent = `${link.dataset.title} selected`;
    updatePosition();
    if (before) animatePapers(before);
    center(link);
  }

  function snapToNearest() {
    snapTimer = null;
    if (!userScrolling || touching || document.hidden || !shelf) return;
    const nearest = links.reduce((best, link) =>
      Math.abs(centerPosition(link) - shelf.scrollLeft) < Math.abs(centerPosition(best) - shelf.scrollLeft) ? link : best
    );
    // Wheel/swipe browsing updates the URL without creating a history entry per card.
    select(nearest, true, true);
  }

  function queueSnap() {
    if (snapTimer !== null) clearTimeout(snapTimer);
    snapTimer = null;
    if (userScrolling && !touching) snapTimer = setTimeout(snapToNearest, 110);
    updatePosition();
  }

  function layout() {
    if (!shelf || !row || !links.length) return;
    stopKeyboard();
    if (snapTimer !== null) clearTimeout(snapTimer);
    snapTimer = null;
    userScrolling = false;
    stopPaperAnimations();
    const style = getComputedStyle(shelf);
    const innerWidth = shelf.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const restWidth = Math.min(...links.map(link => link.offsetWidth));
    row.style.setProperty('--rail-edge', `${Math.max(0, (innerWidth - restWidth) / 2)}px`);
    updatePosition();
    center(links.find(link => link.classList.contains('is-selected')) || links[0], false);
  }

  function stopKeyboard() {
    if (keyboardTimer !== null) clearTimeout(keyboardTimer);
    keyboardTimer = null;
    heldKey = null;
    pendingDirection = 0;
    keyboardReadyAt = 0;
    keyboardSteps = 0;
  }

  function scheduleKeyboard() {
    if (keyboardTimer !== null || (!pendingDirection && !heldKey)) return;
    const delay = Math.max(0, keyboardReadyAt - performance.now());
    if (delay > 0) keyboardTimer = setTimeout(stepKeyboard, delay);
    else stepKeyboard();
  }

  function stepKeyboard() {
    keyboardTimer = null;
    const direction = pendingDirection || (heldKey === 'ArrowRight' ? 1 : heldKey === 'ArrowLeft' ? -1 : 0);
    pendingDirection = 0;
    if (!direction) return;
    const index = Math.max(0, links.findIndex(link => link.classList.contains('is-selected')));
    const nextIndex = Math.max(0, Math.min(links.length - 1, index + direction));
    if (nextIndex === index) { stopKeyboard(); return; }
    const next = links[nextIndex];
    next.focus({preventScroll: true});
    select(next, true, keyboardSteps > 0);
    keyboardSteps++;
    // Let each 440ms cover transition settle; do not follow the OS repeat rate.
    keyboardReadyAt = performance.now() + (motion.matches ? 180 : 480);
    if (heldKey) scheduleKeyboard();
  }

  links.forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      stopKeyboard();
      select(link);
    });
    link.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        if (event.repeat) return;
        heldKey = event.key;
        pendingDirection = event.key === 'ArrowRight' ? 1 : -1;
        keyboardSteps = 0;
        scheduleKeyboard();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        if (event.repeat) return;
        stopKeyboard();
        const next = event.key === 'Home' ? links[0] : links[links.length - 1];
        next.focus({preventScroll: true});
        select(next);
      }
    });
  });
  window.addEventListener('keyup', event => {
    if (event.key !== heldKey) return;
    heldKey = null;
    // A released hold never leaves an automatic step queued behind it.
    if (!pendingDirection && keyboardTimer !== null) {
      clearTimeout(keyboardTimer);
      keyboardTimer = null;
    }
  }, {capture: true});
  library.addEventListener('focusout', event => {
    if (!links.includes(event.relatedTarget)) stopKeyboard();
  });
  window.addEventListener('pointerdown', stopKeyboard, {capture: true, passive: true});
  window.addEventListener('wheel', stopKeyboard, {passive: true});
  window.addEventListener('blur', stopKeyboard);
  window.addEventListener('pagehide', stopKeyboard);
  window.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key === 'Escape') stopKeyboard();
  }, {capture: true});
  window.addEventListener('popstate', () => {
    stopKeyboard();
    const link = links.find(item => new URL(item.href).pathname === window.location.pathname) || links[0];
    select(link, false);
  });
  if (shelf) {
    // Centering and keyboard focus also emit scroll events. Only user gestures
    // should trigger a new scroll-driven selection when they settle.
    shelf.addEventListener('wheel', event => {
      if (!event.ctrlKey && !event.metaKey && (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))) {
        userScrolling = true;
      }
    }, {passive: true});
    shelf.addEventListener('scroll', queueSnap, {passive: true});
    shelf.addEventListener('touchstart', event => {
      stopKeyboard();
      touching = true;
      userScrolling = false;
      const touch = event.touches[0];
      touchOrigin = touch ? {x: touch.clientX, y: touch.clientY} : null;
      if (snapTimer !== null) clearTimeout(snapTimer);
      snapTimer = null;
    }, {passive: true});
    shelf.addEventListener('touchmove', event => {
      const touch = event.touches[0];
      if (!touchOrigin || !touch) return;
      const x = Math.abs(touch.clientX - touchOrigin.x);
      const y = Math.abs(touch.clientY - touchOrigin.y);
      if (x > 3 && x > y) userScrolling = true;
    }, {passive: true});
    shelf.addEventListener('touchend', () => { touching = false; queueSnap(); }, {passive: true});
    shelf.addEventListener('touchcancel', () => { touching = false; queueSnap(); }, {passive: true});
  }
  window.addEventListener('resize', layout);
  window.addEventListener('pageshow', layout);
  document.addEventListener('visibilitychange', () => {
    stopKeyboard();
    if (snapTimer !== null) clearTimeout(snapTimer);
    snapTimer = null;
    userScrolling = false;
    if (document.hidden) stopPaperAnimations();
  });
  motion.addEventListener('change', () => { stopKeyboard(); layout(); });
  layout();
})();
