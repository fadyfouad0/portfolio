/* Screen frames — direction 02: bottom fade + standing cue.
   Frames are INERT until the reader clicks/taps them, so passing the cursor
   over a device while scrolling the page never hijacks the scroll. Once
   activated, the frame scrolls with wheel / trackpad / touch / drag and
   releases on mouse-out, Esc, a click elsewhere, or leaving the viewport. */
(function(){
  var SEL = [
    '[data-ss-frame]',
    '.bw-view', '.pf-view',
    '.iph .ishot',
    '.mobile-card .phone .mscroll',
    '.stage-vis .stage-browser .scroll-inner',
    '.browser .scroll-inner',
    '.browser-dark .scroll-inner'
  ].join(',');

  var CHEV = '<svg viewBox="0 0 12 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1v12M2 9l4 4 4-4"/></svg>';
  var COARSE = matchMedia('(hover: none)').matches;
  var active = null;

  function release(){
    if (!active) return;
    active.frame.classList.remove('ss-on');
    active.setCue(active.idleLabel);
    active = null;
  }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') release(); });
  document.addEventListener('pointerdown', function(e){
    if (active && !active.frame.contains(e.target)) release();
  }, true);

  function mount(frame){
    if (frame.dataset.ssMounted) return;
    frame.dataset.ssMounted = '1';
    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';
    frame.classList.add('ss-frame');

    var scroller = document.createElement('div');
    scroller.className = 'ss-scroller';
    while (frame.firstChild) scroller.appendChild(frame.firstChild);
    frame.appendChild(scroller);

    var fadeBot = document.createElement('div'); fadeBot.className = 'ss-fade bot';
    var cue = document.createElement('div'); cue.className = 'ss-cue';
    var cueText = document.createElement('span');
    cue.innerHTML = CHEV; cue.appendChild(cueText);
    var guard = document.createElement('button');
    guard.type = 'button'; guard.className = 'ss-guard';
    frame.appendChild(guard); frame.appendChild(fadeBot); frame.appendChild(cue);

    var base = frame.dataset.ssLabel || 'scroll';
    var idleLabel = (COARSE ? 'Tap to ' : 'Click to ') + base;
    var liveLabel = COARSE ? 'Scroll · tap out to exit' : 'Scroll · Esc to exit';
    function setCue(t){ cueText.textContent = t; }
    setCue(idleLabel);
    guard.setAttribute('aria-label', idleLabel);

    var engaged = false;
    function sync(){
      var max = scroller.scrollHeight - scroller.clientHeight;
      frame.classList.toggle('ss-sm', frame.clientWidth < 340);
      frame.classList.toggle('ss-static', max < 24);
      if (max < 24) return;
      fadeBot.classList.toggle('gone', engaged || scroller.scrollTop > 4);
      if (scroller.scrollTop > 4 && !engaged){ engaged = true; cue.classList.add('gone'); }
    }
    scroller.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    scroller.querySelectorAll('img').forEach(function(img){
      if (!img.complete) img.addEventListener('load', sync, { once: true });
    });
    if ('ResizeObserver' in window){
      var ro = new ResizeObserver(sync); ro.observe(scroller);
      if (scroller.firstElementChild) ro.observe(scroller.firstElementChild);
    }
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){ es.forEach(function(e){
        if (e.isIntersecting) sync();
        else if (active && active.frame === frame) release();
      }); }, { threshold: 0.05 }).observe(frame);
    }
    setTimeout(sync, 60); setTimeout(sync, 600); sync();

    var api = { frame: frame, setCue: setCue, idleLabel: idleLabel };
    function activate(){
      if (active && active.frame === frame) return;
      release();
      if (frame.classList.contains('ss-static')) return;
      active = api;
      frame.classList.add('ss-on');
      cue.classList.remove('gone');
      setCue(engaged ? liveLabel : liveLabel);
      if (!engaged) setTimeout(function(){ if (active === api && !engaged) cue.classList.add('gone'); }, 1800);
    }
    guard.addEventListener('click', function(e){ e.preventDefault(); activate(); });
    /* mouse readers: leaving the frame hands the wheel back to the page */
    frame.addEventListener('pointerleave', function(e){
      if (e.pointerType !== 'touch' && active === api) release();
    });

    /* drag to push the page around, once active */
    var down = false, sy = 0, st = 0, moved = false;
    scroller.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'touch') return;
      down = true; moved = false; sy = e.clientY; st = scroller.scrollTop;
    });
    scroller.addEventListener('pointermove', function(e){
      if (!down) return;
      var d = e.clientY - sy;
      if (Math.abs(d) > 2) moved = true;
      scroller.scrollTop = st - d;
      if (moved) e.preventDefault();
    });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
      scroller.addEventListener(ev, function(){ down = false; });
    });
    scroller.addEventListener('click', function(e){ if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  function boot(){ document.querySelectorAll(SEL).forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
