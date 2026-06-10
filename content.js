let isHandlingRemoteScroll = false;
let scrollTimeout = null;

// Bind listeners after DOM is fully initialized
function initializeScrollSync() {
  // Receive scroll command from background service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PERFORM_SCROLL') {
      isHandlingRemoteScroll = true;

      const target = document.scrollingElement || document.documentElement;
      const maxScroll = target.scrollHeight - target.clientHeight;

      target.scrollTop = message.scrollPercentage * maxScroll;

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isHandlingRemoteScroll = false;
      }, 50);
    }
  });

  // Send our own scroll position to background
  window.addEventListener('scroll', () => {
    if (isHandlingRemoteScroll) return;

    const target = document.scrollingElement || document.documentElement;
    const maxScroll = target.scrollHeight - target.clientHeight;

    if (maxScroll <= 0) return;

    const scrollPercentage = target.scrollTop / maxScroll;

    chrome.runtime.sendMessage({
      type: 'SCROLL_EVENT',
      scrollPercentage: scrollPercentage
    }).catch(() => {});
  }, { passive: true });
}

// Delay initialization slightly to let page scripts settle
if (document.readyState === 'complete') {
  setTimeout(initializeScrollSync, 200);
} else {
  window.addEventListener('load', () => {
    setTimeout(initializeScrollSync, 200);
  });
}
