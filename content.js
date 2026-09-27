(() => {
  'use strict';
  const ACTIVE = 'data-yss-active';
  const roles = ['primary', 'inner', 'player', 'sidebar'];
  const selectors = {
    watch: ['ytd-watch-flexy', 'ytd-watch-grid'],
    header: ['#masthead-container', 'ytd-masthead', 'header[role="banner"]', '[role="banner"]'],
    player: ['#player', 'ytd-player'],
    related: ['#secondary', 'ytd-watch-next-secondary-results-renderer', '#related'],
  };
  let current = null;
  let observed = [];
  let frame = 0;
  let navigating = false;
  const sizes = new ResizeObserver(schedule);

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function visible(node) {
    if (!node || node.closest('[hidden]')) return false;
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return box.width > 0 && box.height > 0 &&
      style.display !== 'none' && style.visibility !== 'hidden';
  }

  function find(root, candidates, accept = visible) {
    for (const selector of candidates) {
      for (const node of root.querySelectorAll(selector)) {
        if (accept(node)) return node;
      }
    }
    return null;
  }

  // Find the two sibling columns by their content, not their IDs.
  function columns(watch, player, related) {
    for (let primary = player; primary && primary !== watch; primary = primary.parentElement) {
      const parent = primary.parentElement;
      if (!parent || !parent.contains(related) || primary.contains(related)) continue;
      let sidebar = related;
      while (sidebar.parentElement !== parent) sidebar = sidebar.parentElement;
      return { primary, sidebar };
    }
    return null;
  }

  function detect() {
    const watch = find(document, selectors.watch);
    if (!watch) return null;
    const header = find(document, selectors.header, node => {
      if (!visible(node)) return false;
      const box = node.getBoundingClientRect();
      return box.top <= 32 && box.bottom > 0 &&
        box.bottom < window.innerHeight * 0.4 && box.width >= window.innerWidth / 2;
    });
    const seed = find(watch, selectors.player, node => visible(node) && !!node.querySelector('video'));
    const related = find(watch, selectors.related);
    if (!header || !seed || !related) return null;
    const pair = columns(watch, seed, related);
    if (!pair) return null;

    // Prefer the known outer player wrapper. If its ID changed, climb from
    // ytd-player only through wrappers containing neither metadata nor comments.
    let player = seed;
    const metadata = 'ytd-watch-metadata, ytd-comments, #comments, #below';
    while (seed.id !== 'player' && player.parentElement && player.parentElement !== pair.primary &&
      !player.parentElement.querySelector(metadata) &&
      Math.abs(player.parentElement.getBoundingClientRect().height - seed.getBoundingClientRect().height) <= 2) {
      player = player.parentElement;
    }
    if (player === pair.primary) return null;
    return { watch, header, ...pair, player, inner: player.parentElement };
  }

  function clear() {
    if (!current) return;
    current.watch.removeAttribute(ACTIVE);
    current.watch.style.removeProperty('--yt-sidebar-scroll-top');
    current.watch.style.removeProperty('--yt-sidebar-scroll-height');
    for (const role of roles) current[role].removeAttribute(`data-yss-${role}`);
    current = null;
  }

  function observe(nodes) {
    const next = [...new Set(nodes.filter(Boolean))];
    if (next.length === observed.length && next.every((node, i) => node === observed[i])) return;
    sizes.disconnect();
    next.forEach(node => sizes.observe(node));
    observed = next;
  }

  function update() {
    frame = 0;
    const layout = detect();
    observe(layout ? Object.values(layout) : [document.documentElement]);
    const top = layout ? Math.max(0, layout.header.getBoundingClientRect().bottom) + 12 : 0;
    const available = window.innerHeight - top - 12;
    const p = layout?.player.getBoundingClientRect();
    const s = layout?.sidebar.getBoundingClientRect();
    const enabled = layout && !navigating && location.pathname === '/watch' &&
      new URLSearchParams(location.search).has('v') &&
      !layout.watch.hasAttribute('theater') && !layout.watch.hasAttribute('fullscreen') &&
      !document.fullscreenElement && p.height < available &&
      s.left >= p.right - 1 && s.width >= 160;

    if (!enabled) {
      clear();
      return;
    }
    if (!current || Object.keys(layout).some(key => layout[key] !== current[key])) {
      clear();
      current = layout;
      for (const role of roles) current[role].setAttribute(`data-yss-${role}`, '');
      current.watch.setAttribute(ACTIVE, '');
    }
    for (const [key, value] of [['top', top], ['height', available]]) {
      const property = `--yt-sidebar-scroll-${key}`;
      if (current.watch.style.getPropertyValue(property) !== `${value}px`) {
        current.watch.style.setProperty(property, `${value}px`);
      }
    }
  }

  new MutationObserver(records => {
    // Watch-root sizing is covered by ResizeObserver. Excluding its inline style
    // avoids reacting to our custom-property writes. Role attributes are not watched.
    if (records.some(record => !(record.type === 'attributes' &&
      record.attributeName === 'style' &&
      record.target.matches(selectors.watch.join(','))))) schedule();
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'class', 'style', 'is-two-columns_', 'theater', 'fullscreen', 'hidden'],
  });
  document.addEventListener('yt-navigate-start', () => {
    navigating = true;
    clear();
  });
  document.addEventListener('yt-navigate-finish', () => {
    navigating = false;
    schedule();
  });
  document.addEventListener('yt-page-data-updated', schedule);
  document.addEventListener('fullscreenchange', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  // Re-measure headers that collapse or move as the page scrolls.
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('popstate', schedule);
  schedule();
})();
