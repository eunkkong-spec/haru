// 모달: 맞춤 추천 신청 · 정기구독 신청 · 상담 안내 · 구매하기(쇼핑몰 이동) 안내
// - data-dialog-open="dialog id"가 붙은 링크·버튼을 누르면 그 모달이 열림
// - 시연용: 입력값은 저장하거나 보내지 않고 완료 안내만 보여 줌
// - 실제 연동 시 submit에서 서버(상담 접수·구독 API)로 보내면 됨. 건강정보가 있어 브라우저 저장소에는 두지 않음
(() => {
  const won = (n) => `${n.toLocaleString('ko-KR')}원`;

  const MESSAGES = {
    name: '이름을 입력해 주세요.',
    age: '나이를 숫자로 입력해 주세요.',
    gender: '성별을 선택해 주세요.',
    height: '키를 cm 단위로 입력해 주세요.',
    weight: '몸무게를 kg 단위로 입력해 주세요.',
    phone: '연락처를 010-1234-5678 형식으로 입력해 주세요.',
    address: '배송지를 입력해 주세요.',
    product: '구독할 제품을 하나 이상 골라 주세요.',
    cycle: '배송 주기를 선택해 주세요.',
    'agree-privacy': '개인정보 수집·이용에 동의해 주세요.',
    'agree-health': '건강정보 처리에 동의해 주세요.',
  };

  // 정기구독: 고른 제품의 1개월분 정가 × 주기(개월) − 주기별 할인
  function subscription(form) {
    const products = [...form.querySelectorAll('[name=product]:checked')];
    const cycle = form.querySelector('[name=cycle]:checked');
    const months = Number(cycle?.value || 1);
    const rate = Number(cycle?.dataset.discount || 0);
    const list = products.reduce((sum, p) => sum + Number(p.dataset.price), 0) * months;
    const off = Math.floor((list * rate) / 100 / 10) * 10; // 10원 단위 절사
    return { products: products.map((p) => p.value), months, rate, list, off, total: list - off };
  }

  function renderSubscription(form) {
    const s = subscription(form);
    form.querySelector('[data-sub-list]').textContent = won(s.list);
    form.querySelector('[data-sub-rate]').textContent = `${s.rate}%`;
    form.querySelector('[data-sub-off]').textContent = `-${won(s.off)}`;
    form.querySelector('[data-sub-total]').textContent = won(s.total);
    // 제품을 하나도 안 고르면 첫 체크박스에 오류를 걸어 둠
    const first = form.querySelector('[name=product]');
    first.setCustomValidity(s.products.length ? '' : MESSAGES.product);
    if (s.products.length) form.querySelectorAll('[name=product]').forEach((p) => p.removeAttribute('aria-invalid'));
    return s;
  }

  function setup(dialog) {
    const form = dialog.querySelector('form');
    const done = form && dialog.querySelector('.rec-done');
    const error = form?.querySelector('.rec-error');
    const isSub = !!form?.classList.contains('sub-form');

    dialog.querySelectorAll('[data-rec-close]').forEach((btn) => btn.addEventListener('click', () => dialog.close()));
    // 바깥(배경)을 누르면 닫힘
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    if (!form) return { reset() {} };

    // 전체 동의 ↔ 필수 동의
    const all = form.querySelector('[data-rec-all]');
    const agrees = [...form.querySelectorAll('.rec-term input[type=checkbox]')];
    all?.addEventListener('change', () => {
      agrees.forEach((el) => { el.checked = all.checked; el.removeAttribute('aria-invalid'); });
    });
    if (all) agrees.forEach((el) => el.addEventListener('change', () => { all.checked = agrees.every((a) => a.checked); }));

    // 동의 내용 보기/접기
    const mores = [...form.querySelectorAll('.rec-term-more')];
    mores.forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = document.getElementById(btn.getAttribute('aria-controls'));
        const show = body.hidden;
        body.hidden = !show;
        btn.setAttribute('aria-expanded', String(show));
        btn.textContent = show ? '접기' : '보기';
      });
    });

    form.addEventListener('input', (e) => {
      if (e.target.validity?.valid) e.target.removeAttribute('aria-invalid');
    });
    if (isSub) form.addEventListener('change', () => renderSubscription(form));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (isSub) renderSubscription(form);
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      if (invalid.length) {
        invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
        error.textContent = MESSAGES[invalid[0].name] || '필수 항목을 확인해 주세요.';
        error.hidden = false;
        invalid[0].focus();
        return;
      }
      if (isSub) {
        const s = subscription(form);
        done.querySelector('[data-sub-done]').innerHTML =
          `<strong>${s.products.join(' · ')}</strong><br>${s.months}개월마다 ${s.months}개월분씩 배송돼요.<br>` +
          `회당 <strong>${won(s.total)}</strong> (정기구독 ${s.rate}% 할인 적용)`;
      }
      form.hidden = true;
      done.hidden = false;
      done.querySelector('h2').focus();
    });

    return {
      reset() {
        form.reset();
        form.hidden = false;
        done.hidden = true;
        error.hidden = true;
        form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
        mores.forEach((btn) => {
          btn.setAttribute('aria-expanded', 'false');
          btn.textContent = '보기';
          document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
        });
        if (isSub) renderSubscription(form);
      },
    };
  }

  const dialogs = new Map();
  document.querySelectorAll('dialog.rec-dialog').forEach((d) => {
    if (typeof d.showModal === 'function') dialogs.set(d.id, { el: d, ...setup(d) });
  });

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-dialog-open]');
    const target = opener && dialogs.get(opener.dataset.dialogOpen);
    if (!target) return;
    e.preventDefault();
    dialogs.forEach((d) => { if (d.el.open) d.el.close(); }); // 상담 → 맞춤 추천처럼 모달끼리 넘어갈 때
    target.reset();
    target.el.showModal();
    (target.el.querySelector('form input') || target.el.querySelector('h2'))?.focus();
  });

  // 카카오톡 채널 주소가 아직 없어서 안내만 띄움
  document.querySelectorAll('[data-consult-kakao]').forEach((a) => {
    if (a.getAttribute('href') !== '#consult') return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const small = a.querySelector('small');
      small.textContent = '시연용 · 카카오톡에서 HARU 채널을 검색해 주세요';
    });
  });
})();
