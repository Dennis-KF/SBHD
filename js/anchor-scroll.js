/**
 * SBHD hash helpers — load-time hash scrolling only.
 * Does NOT intercept clicks/taps (critical for iOS Safari navigation).
 */
(function () {
    'use strict';

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
    }

    var cfg = window.SBHD_HASH_CONFIG || {};
    var ALIASES = Object.assign({
        'what-is-human-design': 'discover',
        'five-types': 'types',
        'reports': 'reports',
        'transit-reports': 'reports',
        'custom-reports': 'custom-reports',
        'gatherings': 'gather'
    }, cfg.aliases || {});

    var SCROLL_TARGETS = Object.assign({
        'what-is-human-design': 'discover',
        'reports': 'reports',
        'transit-reports': 'reports',
        'custom-reports': 'custom-reports',
        'five-types': 'types',
        'gatherings': 'gather',
        'testimonials': 'testimonials',
        'guides': 'guides',
        'bio': 'bio',
        'resources': 'resources',
        'discover': 'discover',
        'community': 'community',
        'types': 'types',
        'gather': 'gather'
    }, cfg.scrollTargets || {});

    function hashRaw(hash) {
        return decodeURIComponent((hash || '').replace(/^#/, ''));
    }

    function getNavOffset() {
        if (typeof cfg.getNavOffset === 'function') return cfg.getNavOffset();
        var nav = document.querySelector('nav.hd-nav, nav.top-nav, nav');
        return nav ? Math.ceil(nav.getBoundingClientRect().height) + 12 : 80;
    }

    function resolveHashTarget(hash) {
        if (!hash || hash === '#') return null;
        var raw = hashRaw(hash);
        var preferredId = SCROLL_TARGETS[raw] || ALIASES[raw] || raw;
        var el =
            document.getElementById(preferredId) ||
            document.getElementById(ALIASES[raw] || '') ||
            document.getElementById(raw);
        if (el && el.classList && el.classList.contains('anchor-alias')) {
            var section = el.closest('section[id]');
            if (section) return section;
            var alt = document.getElementById(SCROLL_TARGETS[raw] || '');
            if (alt && alt !== el) return alt;
        }
        return el;
    }

    function ensurePageScrollable() {
        var html = document.documentElement;
        var body = document.body;
        if (!html || !body) return;
        // Do not use overflow:visible — it breaks scrolling on iOS Safari
        html.style.overflowX = 'hidden';
        html.style.overflowY = 'auto';
        html.style.height = 'auto';
        body.style.overflowX = 'hidden';
        body.style.overflowY = 'auto';
        body.style.height = 'auto';
        body.style.position = '';
    }

    function scrollToHash(hash, behavior) {
        var target = resolveHashTarget(hash);
        if (!target) return false;
        ensurePageScrollable();
        var top = target.getBoundingClientRect().top + window.pageYOffset - getNavOffset();
        window.scrollTo({ top: Math.max(0, top), behavior: behavior || 'auto' });
        return true;
    }

    function setupHashScrollOnLoad() {
        if (!window.location.hash) return;
        var hash = window.location.hash;
        var run = function () { scrollToHash(hash, 'auto'); };
        run();
        requestAnimationFrame(run);
        window.addEventListener('load', run, { once: true });
        setTimeout(run, 150);
        setTimeout(run, 400);
    }

    function finalizePageScroll() {
        ensurePageScrollable();
        setupHashScrollOnLoad();
    }

    // No-op: never intercept taps (iOS-safe)
    function setupSmoothScrollLinks() {
        return;
    }

    window.SBHD_scrollToHash = scrollToHash;
    window.SBHD_setupHashScroll = setupHashScrollOnLoad;
    window.SBHD_finalizePageScroll = finalizePageScroll;
    window.SBHD_resolveHashTarget = resolveHashTarget;
    window.SBHD_ensurePageScrollable = ensurePageScrollable;
    window.SBHD_setupSmoothScrollLinks = setupSmoothScrollLinks;
    window.SBHD_stopScrollRetries = function () {};
    window.SBHD_afterLayoutShift = function () {};
    window.SBHD_shouldCorrectScroll = function () { return false; };

    document.addEventListener('DOMContentLoaded', function () {
        ensurePageScrollable();
        setupHashScrollOnLoad();
    });

    window.addEventListener('pageshow', function () {
        ensurePageScrollable();
        if (window.location.hash) {
            setTimeout(function () {
                scrollToHash(window.location.hash, 'auto');
            }, 50);
        }
    });

    window.addEventListener('hashchange', function () {
        scrollToHash(window.location.hash, 'auto');
    });
})();
