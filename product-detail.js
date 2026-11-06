// 제품 상세(서브페이지): 타일을 누르면 그 자리에서 커져 상세 내용을 보여 줌
// - 타일에 data-detail="주소이름"(예: day-focus), data-scene-at="히어로 영상 초"를 달면 같은 방식으로 동작
// - 열리면 주소에 #day-focus가 붙어 바로 열 수 있고, 뒤로가기·Esc·×로 닫힘
(() => {
  const side = document.querySelector('.hero-side');
  const tiles = [...document.querySelectorAll('.product-tile[data-detail]')];
  const video = document.querySelector('.hero-video');
  if (!side || !tiles.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = null;
  let resumeVideo = false;

  // 히어로 영상을 그 제품 장면에 멈춤 → script.js가 시계·문구를 장면에 맞춰 바꿈
  function holdScene(tile) {
    if (!video) return;
    const at = parseFloat(tile.dataset.sceneAt);
    if (Number.isNaN(at)) return;
    resumeVideo = !video.paused;
    const seek = () => { video.currentTime = at; video.pause(); };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
  }
  function releaseScene() {
    if (video && resumeVideo) video.play().catch(() => {});
    resumeVideo = false;
  }

  function transition(tile, update, animate) {
    if (!animate || reduceMotion.matches || !document.startViewTransition) { update(); return; }
    tile.style.viewTransitionName = 'detail-tile';
    document.startViewTransition(update).finished.finally(() => { tile.style.viewTransitionName = ''; });
  }

  function open(tile, { animate = true, push = true } = {}) {
    if (current === tile) return;
    if (current) close({ animate: false, updateUrl: false });
    const detail = tile.querySelector('.tile-detail');
    transition(tile, () => {
      side.classList.add('is-detail');
      tile.classList.add('is-open');
      detail.hidden = false;
      tile.querySelector('.tile-open')?.setAttribute('aria-expanded', 'true');
    }, animate);
    current = tile;
    holdScene(tile);
    if (push) history.pushState({ detail: tile.dataset.detail }, '', `#${tile.dataset.detail}`);
    requestAnimationFrame(() => detail.querySelector('.detail-close')?.focus({ preventScroll: true }));
  }

  function close({ animate = true, updateUrl = true } = {}) {
    const tile = current;
    if (!tile) return;
    transition(tile, () => {
      side.classList.remove('is-detail');
      tile.classList.remove('is-open');
      tile.querySelector('.tile-detail').hidden = true;
      tile.querySelector('.tile-open')?.setAttribute('aria-expanded', 'false');
    }, animate);
    current = null;
    releaseScene();
    if (updateUrl && location.hash === `#${tile.dataset.detail}`) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    tile.querySelector('.tile-open')?.focus({ preventScroll: true });
  }

  // 닫기는 가능하면 뒤로가기로 → 열 때 쌓은 기록이 남지 않음
  function requestClose() {
    if (history.state && history.state.detail) history.back();
    else close();
  }

  tiles.forEach((tile) => {
    tile.querySelector('.tile-open')?.addEventListener('click', () => open(tile));
    tile.querySelector('.detail-close')?.addEventListener('click', requestClose);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) requestClose(); });

  function syncFromUrl(animate) {
    const id = location.hash.slice(1);
    const tile = tiles.find((t) => t.dataset.detail === id);
    if (tile) open(tile, { animate, push: false });
    else if (current) close({ animate, updateUrl: false });
  }
  window.addEventListener('popstate', () => syncFromUrl(true));
  syncFromUrl(false);
})();
