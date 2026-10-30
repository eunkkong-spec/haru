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

  // 로그인 상태: auth.js가 저장한 회원 정보가 있으면 로그인·회원가입 자리를 '○○님 · 로그아웃'으로 바꿈
  let user = null;
  try { user = JSON.parse(localStorage.getItem('haru:user') || 'null'); } catch (e) { user = null; }
  if (user && user.name) {
    document.querySelectorAll('.site-header a[href$="login.html"]').forEach((a) => {
      a.textContent = `${user.name}님`;
      a.href = 'index.html';
      a.classList.add('is-user');
      a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.site-header a[href$="signup.html"]').forEach((a) => {
      a.textContent = '로그아웃';
      a.href = '#';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.removeItem('haru:user'); } catch (err) { /* 무시 */ }
        location.reload();
      });
    });
  }

  const bar = document.querySelector('.announcement');
  bar?.querySelector('.announcement-close')?.addEventListener('click', () => { bar.hidden = true; });
})();
