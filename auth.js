// 로그인 · 회원가입: 소셜 버튼과 약관 동의
// 실제 연동 시 AUTH_URLS에 각 서비스의 OAuth 인가 주소(서버에서 발급한 client_id·redirect_uri 포함)를 넣으면 그 주소로 이동한다.
(() => {
  const AUTH_URLS = {
    kakao: '',  // 예: https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code
    naver: '',  // 예: https://nid.naver.com/oauth2.0/authorize?client_id=...&redirect_uri=...&response_type=code&state=...
    google: '', // 예: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid%20email%20profile
  };
  const NAMES = { kakao: '카카오', naver: '네이버', google: 'Google' };

  const toast = document.querySelector('.auth-toast');
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  const isSignup = document.body.dataset.authMode === 'signup';
  const mode = isSignup ? '가입' : '로그인';

  // 시연용 로그인: 키가 없는 서비스는 이 브라우저에만 로그인 상태를 저장 (nav.js가 헤더에 표시)
  function demoLogin(provider) {
    const user = {
      name: `${NAMES[provider]} 회원`,
      provider,
      demo: true,
      marketing: isSignup ? !!document.querySelector('[data-terms-item]:not([required])')?.checked : undefined,
      at: new Date().toISOString(),
    };
    try { localStorage.setItem('haru:user', JSON.stringify(user)); } catch (e) { /* 저장이 막힌 브라우저 */ }
    showToast(isSignup ? `${NAMES[provider]}로 가입했어요 · 첫 구매 10% 쿠폰이 발급됐어요` : `${NAMES[provider]}로 로그인했어요`);
    document.querySelectorAll('[data-provider]').forEach((b) => { b.disabled = true; });
    setTimeout(() => { location.href = 'index.html'; }, 1200);
  }

  document.querySelectorAll('[data-provider]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      if (AUTH_URLS[provider]) {
        location.href = AUTH_URLS[provider];
        return;
      }
      demoLogin(provider);
    });
  });

  // 회원가입: 필수 약관에 모두 동의해야 소셜 가입 버튼이 켜짐
  const all = document.querySelector('[data-terms-all]');
  const items = [...document.querySelectorAll('[data-terms-item]')];
  if (!all || !items.length) return;
  const socialBtns = [...document.querySelectorAll('[data-provider]')];

  function sync() {
    const requiredOk = items.filter((i) => i.required).every((i) => i.checked);
    all.checked = items.every((i) => i.checked);
    all.indeterminate = !all.checked && items.some((i) => i.checked);
    socialBtns.forEach((b) => { b.disabled = !requiredOk; });
  }
  all.addEventListener('change', () => {
    items.forEach((i) => { i.checked = all.checked; });
    sync();
  });
  items.forEach((i) => i.addEventListener('change', sync));
  sync();
})();
