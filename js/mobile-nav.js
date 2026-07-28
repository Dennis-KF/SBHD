/**
 * Mobile hamburger drawer only.
 * Desktop nav (≥1024px) is always shown and never touched by these rules.
 * Also forces a solid fixed top bar so the menu never disappears when scrolling.
 */
(function () {
    'use strict';

    function isNarrow() {
        return window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;
    }

    function closeMobileNav() {
        var nav = document.getElementById('mobile-nav');
        var btn = document.getElementById('mobile-menu-btn') ||
            document.querySelector('[data-mobile-menu-btn]');
        if (nav) {
            nav.classList.add('hidden');
            nav.setAttribute('aria-hidden', 'true');
        }
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function openMobileNav() {
        var nav = document.getElementById('mobile-nav');
        var btn = document.getElementById('mobile-menu-btn') ||
            document.querySelector('[data-mobile-menu-btn]');
        if (nav) {
            nav.classList.remove('hidden');
            nav.setAttribute('aria-hidden', 'false');
        }
        if (btn) btn.setAttribute('aria-expanded', 'true');
    }

    window.toggleMobileNav = function () {
        var nav = document.getElementById('mobile-nav');
        if (!nav) return;
        if (nav.classList.contains('hidden')) openMobileNav();
        else closeMobileNav();
    };

    window.SBHD_closeMobileNav = closeMobileNav;

    /** Ensure desktop link row is always visible/clickable on wide screens */
    function restoreDesktopNav() {
        document.querySelectorAll('.desktop-nav-links').forEach(function (el) {
            el.removeAttribute('aria-hidden');
            el.style.removeProperty('pointer-events');
            el.style.removeProperty('display');
            el.style.removeProperty('visibility');
            el.style.removeProperty('width');
            el.style.removeProperty('height');
            el.style.removeProperty('position');
            el.style.removeProperty('left');
            el.style.removeProperty('overflow');
            el.style.removeProperty('max-height');
        });
        // Keep the bar fixed and solid white even if page CSS fights it
        document.querySelectorAll('nav.hd-nav, nav.top-nav').forEach(function (nav) {
            nav.style.setProperty('position', 'fixed', 'important');
            nav.style.setProperty('top', '0', 'important');
            nav.style.setProperty('left', '0', 'important');
            nav.style.setProperty('right', '0', 'important');
            nav.style.setProperty('width', '100%', 'important');
            nav.style.setProperty('z-index', '10000', 'important');
            nav.style.setProperty('background', '#ffffff', 'important');
            nav.style.setProperty('background-color', '#ffffff', 'important');
        });
    }

    function injectStyles() {
        if (document.getElementById('sbhd-mobile-nav-ios-fix')) return;
        var style = document.createElement('style');
        style.id = 'sbhd-mobile-nav-ios-fix';
        style.textContent = [
            'nav.hd-nav, nav.top-nav {',
            '  position: fixed !important;',
            '  top: 0 !important;',
            '  left: 0 !important;',
            '  width: 100% !important;',
            '  z-index: 10000 !important;',
            '  background: #ffffff !important;',
            '  background-color: #ffffff !important;',
            '}',
            'body { padding-top: 72px !important; }',
            /* Mobile / tablet only */
            '@media (max-width: 1023px) {',
            '  .desktop-nav-links {',
            '    display: none !important;',
            '  }',
            '  .mobile-menu-toggle {',
            '    display: inline-flex !important;',
            '  }',
            '  #mobile-nav:not(.hidden) {',
            '    display: block !important;',
            '  }',
            '  #mobile-nav a {',
            '    display: block !important;',
            '    padding: 14px 12px !important;',
            '    min-height: 48px !important;',
            '    font-size: 17px !important;',
            '    pointer-events: auto !important;',
            '  }',
            '  nav.hd-nav, nav.top-nav {',
            '    background: #ffffff !important;',
            '  }',
            '}',
            /* Desktop: ALWAYS show the main menu on every page */
            '@media (min-width: 1024px) {',
            '  .desktop-nav-links {',
            '    display: flex !important;',
            '    visibility: visible !important;',
            '    pointer-events: auto !important;',
            '    position: static !important;',
            '    width: auto !important;',
            '    height: auto !important;',
            '    max-height: none !important;',
            '    overflow: visible !important;',
            '    left: auto !important;',
            '  }',
            '  .mobile-menu-toggle {',
            '    display: none !important;',
            '  }',
            '  #mobile-nav, #mobile-nav.hidden {',
            '    display: none !important;',
            '  }',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }

    function bindMobileDrawerLinks() {
        var nav = document.getElementById('mobile-nav');
        if (!nav || nav.getAttribute('data-ios-nav-bound') === '1') return;
        nav.setAttribute('data-ios-nav-bound', '1');

        nav.addEventListener('click', function (e) {
            if (!isNarrow()) return;

            var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!a || !nav.contains(a)) return;

            var raw = a.getAttribute('href') || '';
            if (!raw || raw.indexOf('javascript:') === 0) return;

            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation();
            }
            // Do not hide the menu first — that cancels navigation on iOS
            window.location.href = a.href;
        }, true);
    }

    function onReady() {
        injectStyles();
        restoreDesktopNav();
        bindMobileDrawerLinks();
        if (!isNarrow()) {
            restoreDesktopNav();
            closeMobileNav();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }

    window.addEventListener('resize', function () {
        if (isNarrow()) {
            // mobile: desktop row hidden by CSS only
        } else {
            restoreDesktopNav();
            closeMobileNav();
        }
    });
})();
