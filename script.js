// 실시간 플립 시계: 오른쪽 "지금 이 시간" 카드 (시:분:초 + 날짜)
(() => {
  const clock = document.querySelector('[data-clock]');
  const digits = clock ? [...clock.querySelectorAll('[data-flip]')] : [];
  const dateEl = document.querySelector('[data-date]');
  const weekdayEl = document.querySelector('[data-weekday]');
  if (digits.length !== 6) return;

  const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pad = (n) => String(n).padStart(2, '0');

  // 카드 한 장 = 고정된 위/아래 반쪽 + 넘어가는 위/아래 잎
  function build(el, value) {
    el.dataset.value = value;
    el.innerHTML =
      `<span class="flip-half flip-top"><i>${value}</i></span>` +
      `<span class="flip-half flip-bottom"><i>${value}</i></span>` +
      `<span class="flip-half flip-top flip-leaf" aria-hidden="true"><i>${value}</i></span>` +
      `<span class="flip-half flip-bottom flip-leaf" aria-hidden="true"><i>${value}</i></span>`;
    const [top, bottom, leafTop, leafBottom] = el.querySelectorAll('i');
    el._faces = { top, bottom, leafTop, leafBottom };
    leafBottom.parentElement.addEventListener('animationend', () => {
      bottom.textContent = el.dataset.value;
      el.classList.remove('is-flipping');
    });
  }

  function flipTo(el, next) {
    const prev = el.dataset.value;
    if (prev === next) return;
    const { top, bottom, leafTop, leafBottom } = el._faces;
    el.dataset.value = next;

    if (reduceMotion.matches || document.hidden) {
      top.textContent = bottom.textContent = leafTop.textContent = leafBottom.textContent = next;
      el.classList.remove('is-flipping');
      return;
    }
    top.textContent = next;        // 뒤에서 드러날 새 숫자 윗면
    bottom.textContent = prev;     // 잎이 덮을 때까지 남아 있는 이전 숫자 아랫면
    leafTop.textContent = prev;    // 아래로 접히는 이전 숫자
    leafBottom.textContent = next; // 이어서 펼쳐지는 새 숫자
    el.classList.remove('is-flipping');
    void el.offsetWidth; // 애니메이션 재시작
    el.classList.add('is-flipping');
  }

  function render() {
    const now = new Date();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const chars = hh + mm + ss;
    digits.forEach((el, i) => flipTo(el, chars[i]));

    const date = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
    if (dateEl && dateEl.textContent !== date) dateEl.textContent = date;
    if (weekdayEl) weekdayEl.textContent = WEEKDAYS[now.getDay()];
    clock.setAttribute('datetime', `${hh}:${mm}:${ss}`);
    const label = `현재 시각 ${hh}시 ${mm}분`;
    if (clock.getAttribute('aria-label') !== label) clock.setAttribute('aria-label', label);
  }

  // 초가 바뀌는 순간에 맞춰 갱신
  function tick() {
    render();
    setTimeout(tick, 1000 - new Date().getMilliseconds() + 10);
  }

  const now = new Date();
  const initial = pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  digits.forEach((el, i) => build(el, initial[i]));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  tick();
})();

// 히어로 영상 속 시각: 영상 장면에 맞춰 바뀜
// at = 장면이 시작하는 영상 초, roll = 그 장면 직전에 시곗바늘이 도는 구간 [시작초, 끝초]
// 초 값은 haru_hero.mp4의 장면 전환(키프레임) 기준. index.html?scene-debug 로 열면 영상 왼쪽 위에 현재 초가 보임
(() => {
  const SCENES = [
    { at: 0,     time: '06:30' },                      // 알람 · 일어나서 Morning charge
    { at: 4.33,  time: '07:30' },                      // 출근길 걷기
    { at: 5.71,  time: '08:00' },                      // 출근 지하철
    { at: 7.04,  time: '08:50' },                      // 사무실 도착 · 타이핑
    { at: 9.25,  time: '15:00', roll: [8.17, 9.0] },   // 벽시계가 돌고 → 눈을 비빌 때
    { at: 12.9,  time: '18:00', roll: [12.0, 12.9] },  // 다시 벽시계가 돌고 → 퇴근 준비
    { at: 14.88, time: '19:00' },                      // 퇴근 지하철 · 귀가
    { at: 19.33, time: '23:00' },                      // Night rest · 잠들 때
  ];

  const video = document.querySelector('.hero-video');
  const timeEl = document.querySelector('[data-scene-time]');
  const labelEl = document.querySelector('[data-scene-label]');
  const careEl = document.querySelector('[data-scene-care]');
  if (!video || !timeEl) return;

  // 시간대별 제품군 문구: 아침 Morning charge → 낮 Day focus → 저녁·밤 Night rest
  const CARE = {
    MORNING: '[아침 활력 케어] Morning charge',
    DAY:     '[눈 건강 케어] Day focus',
    EVENING: '[편안한 숙면 케어] Night rest',
    NIGHT:   '[편안한 숙면 케어] Night rest',
  };

  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const labelFor = (min) => (min < 600 ? 'MORNING' : min < 1020 ? 'DAY' : min < 1260 ? 'EVENING' : 'NIGHT');

  function minutesAt(t) {
    let i = 0;
    while (i + 1 < SCENES.length && t >= SCENES[i + 1].at) i++;
    const next = SCENES[i + 1];
    if (next && next.roll && t >= next.roll[0]) {
      const [s, e] = next.roll;
      const p = Math.min(1, (t - s) / (e - s));
      const from = toMin(SCENES[i].time);
      return Math.round(from + (toMin(next.time) - from) * p);
    }
    return toMin(SCENES[i].time);
  }

  // 영상에 제품 병이 보이는 구간 → 오른쪽 제품 카드 강조 + 병 딸깍
  const PRODUCT_CUES = [
    { tile: document.querySelector('.product-tile.morning'), from: 2.92,  to: 4.1 },
    { tile: document.querySelector('.product-tile.day'),     from: 10.6,  to: 12.0 },
    { tile: document.querySelector('.product-tile.night'),   from: 19.4,  to: 21.13 },
  ].filter((c) => c.tile);

  function tilt(tile) {
    tile.classList.remove('is-tilt');
    void tile.offsetWidth; // 애니메이션 재시작
    tile.classList.add('is-tilt');
  }
  PRODUCT_CUES.forEach(({ tile }) => {
    tile.querySelector('img')?.addEventListener('animationend', () => tile.classList.remove('is-tilt'));
  });

  let activeTile = null;
  function syncProducts(t) {
    const cue = PRODUCT_CUES.find((c) => t >= c.from && t < c.to);
    const tile = cue ? cue.tile : null;
    if (tile === activeTile) return;
    activeTile?.classList.remove('is-active');
    activeTile = tile;
    if (tile) {
      tile.classList.add('is-active');
      tilt(tile);
    }
  }

  let shown = -1;
  function render() {
    const min = minutesAt(video.currentTime);
    if (min !== shown) {
      shown = min;
      timeEl.textContent = fmt(min);
      const label = labelFor(min);
      if (labelEl) labelEl.textContent = label;
      if (careEl && careEl.textContent !== CARE[label]) careEl.textContent = CARE[label];
    }
    syncProducts(video.currentTime);
    if (debugEl) debugEl.textContent = `${video.currentTime.toFixed(1)}s`;
  }

  let debugEl = null;
  if (new URLSearchParams(location.search).has('scene-debug')) {
    debugEl = document.createElement('span');
    debugEl.style.cssText = 'position:absolute;left:28px;top:70px;z-index:5;background:#000c;color:#fff;font:600 14px monospace;padding:4px 8px;border-radius:6px';
    video.parentElement.append(debugEl);
  }

  (function loop() { render(); requestAnimationFrame(loop); })();
})();
