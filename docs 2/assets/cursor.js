/* ============================================================
   Fady Fouad — shared site cursor
   A precise ink dot + a smoothly-trailing ring, difference-blended
   so it reads over cream, dark sections, imagery and any brand colour.
   Replaces all per-page cursors. Self-contained: injects its own
   styles + DOM + behaviour. Load once per page before </body>.
   ============================================================ */
(() => {
  if (window.__fcurLoaded) return;
  window.__fcurLoaded = true;

  // --- styles (also neutralises any legacy cursor on the page) ---
  const css = `
    #cursorDot, #cursorRing, .cursor-dot, .cursor-ring, #cursor,
    .cursor-label { display: none !important; }
    html, body, a, button, .magnet, [data-cta] { cursor: none !important; }

    .fcur-dot, .fcur-ring {
      position: fixed; top: 0; left: 0;
      pointer-events: none;
      z-index: 100000;
      transform: translate(-50%, -50%);
      mix-blend-mode: difference;
      will-change: transform;
    }
    .fcur-dot {
      width: 7px; height: 7px; border-radius: 999px;
      background: #fff;
      transition: width .28s cubic-bezier(.2,.8,.2,1),
                  height .28s cubic-bezier(.2,.8,.2,1),
                  opacity .25s;
    }
    .fcur-ring {
      width: 30px; height: 30px; border-radius: 999px;
      border: 1.4px solid #fff;
      background: transparent;
      opacity: .55;
      transition: width .35s cubic-bezier(.2,.8,.2,1),
                  height .35s cubic-bezier(.2,.8,.2,1),
                  opacity .3s, background .3s, border-width .3s;
    }
    /* hover over interactive elements */
    .fcur-ring.is-hover { width: 56px; height: 56px; opacity: 1;
      background: rgba(255,255,255,0.06); }
    .fcur-dot.is-hover  { width: 4px; height: 4px; }
    /* click feedback */
    .fcur-ring.is-down  { width: 22px; height: 22px; opacity: 1; }
    .fcur-dot.is-down   { width: 10px; height: 10px; }
    /* CTA: ring fills, label appears */
    .fcur-ring.is-cta {
      width: 92px; height: 92px;
      background: #fff; border-width: 0; opacity: 1;
    }
    .fcur-dot.is-cta { opacity: 0; }
    .fcur-label {
      position: absolute; inset: 0;
      display: grid; place-items: center;
      color: #000;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      white-space: nowrap;
      mix-blend-mode: normal;
      opacity: 0; transition: opacity .22s;
    }
    .fcur-ring.is-cta .fcur-label { opacity: 1; }

    @media (hover: none), (pointer: coarse) {
      .fcur-dot, .fcur-ring { display: none !important; }
      html, body, a, button, .magnet, [data-cta] { cursor: auto !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .fcur-ring { transition: opacity .2s, background .2s, width .2s, height .2s; }
    }
  `;
  const style = document.createElement('style');
  style.id = 'fcur-style';
  style.textContent = css;
  document.head.appendChild(style);

  // --- elements ---
  const ring = document.createElement('div');
  ring.className = 'fcur-ring';
  ring.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'fcur-label';
  ring.appendChild(label);

  const dot = document.createElement('div');
  dot.className = 'fcur-dot';
  dot.setAttribute('aria-hidden', 'true');

  const mount = () => { document.body.appendChild(ring); document.body.appendChild(dot); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  // --- motion ---
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;
  let seen = false;
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; dot.style.opacity = ''; ring.style.opacity = ''; }
  }, { passive: true });

  function raf() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform  = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  }
  raf();

  // --- click feedback ---
  addEventListener('mousedown', () => { ring.classList.add('is-down'); dot.classList.add('is-down'); });
  addEventListener('mouseup',   () => { ring.classList.remove('is-down'); dot.classList.remove('is-down'); });

  // --- hover states (delegated so it survives DOM changes) ---
  const interactive = el => el && el.closest && el.closest('a, button, .magnet, [data-cta], input, textarea, [role="button"]');
  document.addEventListener('mouseover', e => {
    const el = interactive(e.target);
    if (!el) return;
    ring.classList.add('is-hover');
    dot.classList.add('is-hover');
    const cta = el.getAttribute && el.getAttribute('data-cta');
    if (cta) { ring.classList.add('is-cta'); dot.classList.add('is-cta'); label.textContent = cta; }
  });
  document.addEventListener('mouseout', e => {
    const el = interactive(e.target);
    if (!el) return;
    // ignore moves landing on a child of the same interactive element
    if (e.relatedTarget && interactive(e.relatedTarget) === el) return;
    ring.classList.remove('is-hover', 'is-cta');
    dot.classList.remove('is-hover', 'is-cta');
    label.textContent = '';
  });

  // hide when leaving the window
  addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  addEventListener('mouseenter', () => { dot.style.opacity = ''; ring.style.opacity = ''; });
})();
