// Sync Scroll Pro - content script
//
// Reports this tab's scroll position (as a 0..1 fraction) to the background worker
// and applies positions that other tabs send us.
//
// Notes:
//  * Works for normal pages (the document scrolls) and for app-style pages where an
//    inner container does the scrolling instead of the document.
//  * Can be injected more than once (manifest + programmatic injection after an
//    install/update). A newer instance always takes over from the older one, so an
//    "orphaned" script left behind by an extension reload is cleaned up.
(() => {
  'use strict';

  const TAKEOVER = 'sync-scroll-pro:takeover';
  const ECHO_WINDOW_MS = 400;   // ignore scroll events that merely echo a position we just applied
  const ECHO_TOLERANCE_PX = 2;

  // Hand over from any older instance (still alive in this page, possibly orphaned).
  window.dispatchEvent(new Event(TAKEOVER));

  let applied = null;          // { el, top, until } - last remotely applied position
  let pendingEl = null;        // scroller waiting for the next animation frame
  let rafId = 0;
  let cachedScroller = null;   // inner scroller found by search (app-style pages)
  let dead = false;

  // ── Scroller detection ───────────────────────────────────────────────────
  const docScroller = () => document.scrollingElement || document.documentElement;
  const canScroll = (el) => !!el && el.scrollHeight - el.clientHeight > 1;

  // An inner element counts as "the page's scroller" only if it fills most of the viewport.
  // This keeps small widgets (code blocks, chat boxes, sidebars) from driving the sync.
  function isMainScroller(el) {
    if (el === docScroller()) return true;
    if (!(el instanceof Element) || !canScroll(el)) return false;
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') return false;
    return el.clientWidth * el.clientHeight >= 0.5 * window.innerWidth * window.innerHeight;
  }

  function searchInnerScroller() {
    const root = document.body || document.documentElement;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let best = null;
    let bestArea = 0;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!canScroll(n)) continue;
      const overflowY = getComputedStyle(n).overflowY;
      if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') continue;
      const area = n.clientWidth * n.clientHeight;
      if (area > bestArea) { best = n; bestArea = area; }
    }
    return best && bestArea >= 0.5 * window.innerWidth * window.innerHeight ? best : null;
  }

  function getMainScroller() {
    const doc = docScroller();
    if (canScroll(doc)) return doc;
    if (cachedScroller && cachedScroller.isConnected && canScroll(cachedScroller)) return cachedScroller;
    cachedScroller = searchInnerScroller();
    return cachedScroller;
  }

  // ── Outgoing: report our own scrolling ───────────────────────────────────
  function onScroll(event) {
    const target = event.target;
    const el = target === document ? docScroller() : target;
    if (!(el instanceof Element) || !isMainScroller(el)) return;
    if (el !== docScroller()) cachedScroller = el;

    // Echo of a position another tab just pushed to us -> do not bounce it back.
    if (applied && el === applied.el && performance.now() < applied.until &&
        Math.abs(el.scrollTop - applied.top) <= ECHO_TOLERANCE_PX) {
      return;
    }

    pendingEl = el;
    if (!rafId) rafId = requestAnimationFrame(flush);
  }

  function flush() {
    rafId = 0;
    const el = pendingEl;
    pendingEl = null;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    send(el.scrollTop / max);
  }

  function send(fraction) {
    if (!extensionAlive()) { teardown(); return; }
    try {
      chrome.runtime.sendMessage({ type: 'SCROLL_EVENT', scrollPercentage: fraction }).catch(() => {});
    } catch (_) {
      teardown(); // "Extension context invalidated" - the extension was reloaded
    }
  }

  // ── Incoming: apply another tab's position ───────────────────────────────
  function onRuntimeMessage(message) {
    if (!message || message.type !== 'PERFORM_SCROLL') return;
    const fraction = Number(message.scrollPercentage);
    if (!Number.isFinite(fraction)) return;
    const el = getMainScroller();
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const top = Math.round(Math.min(1, Math.max(0, fraction)) * max);
    applied = { el, top, until: performance.now() + ECHO_WINDOW_MS };
    // 'instant' beats a page's CSS `scroll-behavior: smooth`, which would otherwise animate
    // for longer than the echo window and bounce back to the source tab.
    el.scrollTo({ top, behavior: 'instant' });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  function extensionAlive() {
    try { return !!(chrome.runtime && chrome.runtime.id); } catch (_) { return false; }
  }

  function teardown() {
    if (dead) return;
    dead = true;
    window.removeEventListener(TAKEOVER, teardown);
    document.removeEventListener('scroll', onScroll, true);
    if (rafId) cancelAnimationFrame(rafId);
    try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (_) { /* context already gone */ }
  }

  // Capture phase: scroll events from inner elements do not bubble, but they can be captured.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  chrome.runtime.onMessage.addListener(onRuntimeMessage);
  window.addEventListener(TAKEOVER, teardown);
})();
