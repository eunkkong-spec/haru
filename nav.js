// 공통: 모바일 햄버거 메뉴, 공지 띠 닫기
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.matchMedia('(min-width: 701px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  const bar = document.querySelector('.announcement');
  bar?.querySelector('.announcement-close')?.addEventListener('click', () => { bar.hidden = true; });
})();
