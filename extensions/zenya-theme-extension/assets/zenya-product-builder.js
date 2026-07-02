(() => {
  const parseJson = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const getText = (input) => (typeof input === 'string' ? input : '');

  const setCssVars = (root, colors) => {
    if (!colors || typeof colors !== 'object') return;
    if (typeof colors.primary === 'string') root.style.setProperty('--zenya-primary', colors.primary);
    if (typeof colors.secondary === 'string') root.style.setProperty('--zenya-secondary', colors.secondary);
  };

  const render = (mount, design) => {
    const content = design && typeof design === 'object' ? design.content : null;
    const colors = design && typeof design === 'object' ? design.colors : null;
    if (!content || typeof content !== 'object') return;

    setCssVars(mount, colors);

    const hero = content.hero && typeof content.hero === 'object' ? content.hero : {};
    const headline = getText(hero.headline);
    const subheadline = getText(hero.subheadline);
    const ctaLabel = getText(hero.cta) || 'Shop now';

    const container = document.createElement('div');
    container.className = 'zenya-product-builder__container';

    const heroEl = document.createElement('div');
    heroEl.className = 'zenya-product-builder__hero';

    const h1 = document.createElement('h2');
    h1.className = 'zenya-product-builder__headline';
    h1.textContent = headline || 'Zenya landing';

    const p = document.createElement('p');
    p.className = 'zenya-product-builder__subheadline';
    p.textContent = subheadline;

    const a = document.createElement('a');
    a.className = 'zenya-product-builder__cta';
    a.href = '#purchase';
    a.textContent = ctaLabel;

    heroEl.appendChild(h1);
    if (subheadline) heroEl.appendChild(p);
    heroEl.appendChild(a);

    container.appendChild(heroEl);

    const features = Array.isArray(content.features) ? content.features : [];
    if (features.length) {
      const featuresWrap = document.createElement('div');
      featuresWrap.className = 'zenya-product-builder__features';

      features.slice(0, 6).forEach((f) => {
        if (!f || typeof f !== 'object') return;
        const title = getText(f.title);
        const text = getText(f.text);
        if (!title && !text) return;

        const card = document.createElement('div');
        card.className = 'zenya-product-builder__feature';

        if (title) {
          const t = document.createElement('div');
          t.className = 'zenya-product-builder__feature-title';
          t.textContent = title;
          card.appendChild(t);
        }

        if (text) {
          const tx = document.createElement('p');
          tx.className = 'zenya-product-builder__feature-text';
          tx.textContent = text;
          card.appendChild(tx);
        }

        featuresWrap.appendChild(card);
      });

      container.appendChild(featuresWrap);
    }

    mount.innerHTML = '';
    mount.appendChild(container);
  };

  // ── License gate ──────────────────────────────────────────────────────
  // The premium Zenya content only renders while the store's linked Zenya
  // account holds an active subscription. We ask our backend through the
  // Shopify app proxy (same-origin on the storefront). One shared request
  // for the whole page.
  //
  // Fail-open policy: only an explicit, verified { active: false } degrades
  // the content. Any network/parse error renders normally, so a Zenya-side
  // outage never makes a paying merchant's storefront look broken.
  let licensePromise = null;
  const checkLicense = () => {
    if (licensePromise) return licensePromise;
    licensePromise = fetch('/apps/zenya/license', {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    })
      .then((r) => (r.ok ? r.json() : { active: true }))
      .then((d) => d && d.active !== false)
      .catch(() => true);
    return licensePromise;
  };

  const renderDisconnected = (mount) => {
    const box = document.createElement('div');
    box.className = 'zenya-product-builder__disconnected';
    box.setAttribute('dir', 'rtl');
    box.style.cssText =
      'border:1px solid #e5e2d9;border-radius:14px;background:#faf8f3;padding:22px;text-align:center;color:#5f5f5d;font-family:inherit;line-height:1.7;';

    const ar = document.createElement('p');
    ar.style.cssText = 'margin:0 0 8px;font-size:15px;font-weight:600;color:#16171b;';
    ar.textContent = 'محتوى زينيا متوقّف مؤقتًا';

    const arSub = document.createElement('p');
    arSub.style.cssText = 'margin:0 0 12px;font-size:13px;';
    arSub.textContent =
      'اشتراكك غير مفعّل. أعِد التفعيل من لوحة تحكم زينيا لاستعادة هذا القسم.';

    const en = document.createElement('p');
    en.setAttribute('dir', 'ltr');
    en.style.cssText = 'margin:0;font-size:12px;color:#8a8a83;';
    en.textContent =
      'Zenya content is paused — your subscription is inactive. Reactivate it in your Zenya dashboard to restore this section.';

    box.appendChild(ar);
    box.appendChild(arSub);
    box.appendChild(en);

    mount.innerHTML = '';
    mount.appendChild(box);
  };

  const boot = () => {
    const nodes = document.querySelectorAll('.zenya-product-builder');
    if (!nodes.length) return;

    const pending = [];
    nodes.forEach((node) => {
      const design = parseJson(node.getAttribute('data-zenya-design') || '');
      if (!design) return;
      pending.push({ node, design });
    });
    if (!pending.length) return;

    checkLicense().then((active) => {
      pending.forEach(({ node, design }) => {
        if (active) render(node, design);
        else renderDisconnected(node);
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
