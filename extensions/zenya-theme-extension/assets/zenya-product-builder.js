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

  const boot = () => {
    const nodes = document.querySelectorAll('.zenya-product-builder');
    if (!nodes.length) return;

    nodes.forEach((node) => {
      const design = parseJson(node.getAttribute('data-zenya-design') || '');
      if (!design) return;
      render(node, design);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
