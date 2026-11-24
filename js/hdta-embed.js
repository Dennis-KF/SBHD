/**
 * SBHD embed helper for the HDTA preview iframe (#transit-app).
 * Listens only to messages from https://hdta-6-6.vercel.app.
 * Sets the iframe height so the page scrolls as one, and honors
 * in-app scroll requests with the sticky menu offset.
 */
(function () {
  'use strict';

  var APP_ORIGIN = (window.HDTA_EMBED_APP_ORIGIN || 'https://hdta-6-6.vercel.app').replace(/\/$/, '');
  var frame = document.getElementById('transit-app');
  if (!frame) return;

  frame.classList.add('transit-live');
  try {
    frame.setAttribute('scrolling', 'no');
    frame.style.width = '100%';
    frame.style.border = '0';
    frame.style.overflow = 'hidden';
    frame.style.display = 'block';
    if (!frame.style.minHeight) frame.style.minHeight = '640px';
  } catch (e) {}

  function navOffset() {
    var nav = document.querySelector('nav.hd-nav, nav.top-nav, nav');
    if (!nav) return 150;
    var bottom = nav.getBoundingClientRect().bottom;
    // Fixed menu sits at the top; include a small gap under it.
    return Math.max(80, Math.ceil(bottom) + 12);
  }

  function setHeight(height) {
    var h = Math.ceil(Number(height) || 0);
    if (h < 200) return;
    if (h > 80000) h = 80000;
    frame.style.height = h + 'px';
    frame.style.maxHeight = 'none';
    frame.style.overflow = 'hidden';
    // If the visitor landed on a transit hash, keep the heading under the menu
    // after the iframe grows.
    try {
      var hash = window.location.hash || '';
      if (/#(daily-transit-reports|after-uploaded-daily|reports|transit-reports|ask)$/.test(hash)) {
        if (hash === '#ask' && typeof window.sbhdGoToAsk === 'function') return;
        if (typeof window.SBHD_scrollToHash === 'function') {
          window.SBHD_scrollToHash(hash, 'auto');
        }
      }
    } catch (e) {}
  }

  function scrollToFrameY(top, behavior) {
    top = Number(top);
    if (!isFinite(top) || top < 0) return;
    if (top > 80000) top = 80000;
    var y = frame.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) + top - navOffset();
    var how = behavior || 'auto';
    try {
      window.scrollTo({ top: Math.max(0, y), behavior: how === 'smooth' ? 'smooth' : 'auto' });
    } catch (e) {
      try { window.scrollTo(0, Math.max(0, y)); } catch (e2) {}
    }
    frame.classList.add('transit-live');
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== APP_ORIGIN) return;
    if (event.source !== frame.contentWindow) return;
    var data = event.data || {};
    var type = data.type;
    if (type === 'hdta-embed-height' || type === 'transit-frame-height') {
      setHeight(data.height);
      return;
    }
    if (type === 'hdta-embed-scroll' || type === 'transit-ask-position' || type === 'transit-scroll') {
      scrollToFrameY(data.top, data.behavior || 'auto');
      return;
    }
    if (type === 'showJoinModal') {
      if (typeof showJoinModal === 'function') showJoinModal();
      try { event.source.postMessage({ type: 'showJoinModal', ok: true }, APP_ORIGIN); } catch (e) {}
    }
  });

  var askWanted = false;
  var askTimer = null;
  var askFallback = null;

  window.sbhdGoToAsk = function () {
    askWanted = true;
    var tries = 0;
    function ask() {
      tries += 1;
      if (!askWanted || tries > 40) {
        if (askTimer) { clearInterval(askTimer); askTimer = null; }
        return;
      }
      try { frame.contentWindow.postMessage({ type: 'sbhd-scroll-to-ask' }, APP_ORIGIN); } catch (err) {}
    }
    if (askTimer) clearInterval(askTimer);
    askTimer = setInterval(ask, 250);
    ask();
    if (askFallback) clearTimeout(askFallback);
    askFallback = setTimeout(function () {
      if (askWanted) {
        var section = document.getElementById('daily-transit-reports') || document.getElementById('reports');
        if (section) {
          var y = section.getBoundingClientRect().top + (window.pageYOffset || 0) - navOffset();
          try { window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } catch (e) {}
        }
      }
    }, 4000);
    return false;
  };

  if (window.location.hash === '#ask') {
    setTimeout(function () {
      if (typeof window.sbhdGoToAsk === 'function') window.sbhdGoToAsk();
    }, 800);
  }
})();
