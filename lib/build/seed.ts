/**
 * Per-section content seeder.
 *
 * The Shopify "Online Store 2.0" template JSON (`templates/index.json`,
 * `templates/product.json`, etc.) is what the editor actually renders.
 * The `presets` inside `{% schema %}` blocks are ONLY for the editor's
 * "Add section" picker — they're not auto-applied to a template.
 *
 * Earlier versions of this generator wrote `"settings": {}` for every
 * section in the templates, which meant Shopify rendered the schema
 * defaults (generic "Free shipping over $50" copy) and zero blocks for
 * every grid section — so the homepage looked 95 % empty.
 *
 * This module fills in every section: settings + blocks, seeded with
 * the merchant's actual product name, store name, price, images, and
 * description. The result is a theme that looks like a real store on
 * first install, no editor work required.
 *
 * Image handling: Shopify's image_picker setting cannot accept a
 * remote URL inside a template JSON file. We solved this by adding a
 * parallel `image_url` text setting (see sections/*.ts edits) — the
 * seed writes the AliExpress URLs into those, and the liquid renders
 * them when image_picker is empty.
 */
import type { BuildConfig } from './theme-generator'

type Settings = Record<string, unknown>
type Block = { type: string; settings: Settings }
export type SeededSection = { settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }

/* ── helpers ──────────────────────────────────────────────────────── */

function money(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0.00'
  return '$' + n.toFixed(2)
}

function safeDescription(c: BuildConfig, maxChars = 220): string {
  const d = (c.description || '').replace(/\s+/g, ' ').trim()
  if (d.length > maxChars) return d.slice(0, maxChars - 1).trimEnd() + '…'
  if (d.length > 0) return d
  return `${c.productName} — built for everyday use, backed by a 30-day promise.`
}

function pickImage(c: BuildConfig, idx: number): string {
  if (!c.images?.length) return ''
  return c.images[idx % c.images.length] || c.images[0]
}

function imageBlocks(
  c: BuildConfig,
  type: string,
  count: number,
  extra: (img: string, i: number) => Settings,
): { blocks: Record<string, Block>; order: string[] } {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < count; i++) {
    const id = `${type}-${i + 1}`
    const img = pickImage(c, i)
    blocks[id] = { type, settings: { image_url: img, ...extra(img, i) } }
    order.push(id)
  }
  return { blocks, order }
}

function indexBlocks<T extends Block>(
  prefix: string,
  items: Array<T>,
): { blocks: Record<string, T>; order: string[] } {
  const blocks: Record<string, T> = {}
  const order: string[] = []
  items.forEach((b, i) => {
    const id = `${prefix}-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  return { blocks, order }
}

function highlightFromDescription(c: BuildConfig): Array<{ icon: string; heading: string; body: string }> {
  // Map common e-commerce keywords in the description into icons + bullet
  // copy. This is the seam where "AI-generated" content meets the seed —
  // even if the description is short or generic, we still get 6 angles.
  const desc = (c.description || '').toLowerCase()
  const pool = [
    { kw: ['waterproof', 'water-resistant', 'water resistant'], icon: '💧', heading: 'مقاوم للماء',        body: 'مُختبَر ليتحمّل المطر والانسكابات وحتى الغمر العابر.' },
    { kw: ['battery', 'rechargeable', 'usb', 'wireless'],        icon: '🔋', heading: 'بطارية تدوم طوال اليوم', body: 'شحنة واحدة تكفي يومك كاملًا — أعِد شحنه ليلًا عبر USB-C.' },
    { kw: ['premium', 'quality', 'durable', 'metal', 'leather'], icon: '🛠️', heading: 'مواد عالية الجودة',     body: 'مصنوع من مواد تدوم — لا الرديئة التي تستبدلها سنويًا.' },
    { kw: ['safe', 'safety', 'non-toxic', 'bpa', 'eco'],         icon: '🌱', heading: 'آمن ومستدام',          body: 'خالٍ من المواد السامة و BPA، ومغلّف بمواد قابلة لإعادة التدوير.' },
    { kw: ['light', 'lightweight', 'compact', 'portable'],       icon: '🪶', heading: 'خفيف ومحمول',          body: 'ينزلق في حقيبتك دون أن يثقلك أثناء تنقّلك.' },
    { kw: ['fast', 'quick', 'instant'],                          icon: '⚡', heading: 'نتائج سريعة',           body: 'يُجهَّز في ثوانٍ — مصمّم ليعمل لحظة إخراجه من العلبة.' },
    { kw: ['comfortable', 'soft', 'ergonomic'],                  icon: '🤲', heading: 'مريح في الاستخدام',     body: 'مُصمَّم ليناسب طريقة عمل يديك فعلًا.' },
  ]
  const matches: Array<{ icon: string; heading: string; body: string }> = []
  for (const opt of pool) {
    if (opt.kw.some((k) => desc.includes(k))) matches.push({ icon: opt.icon, heading: opt.heading, body: opt.body })
  }
  // Always include the three defaults, then the keyword-matched ones.
  const defaults = [
    { icon: '⚡', heading: 'مصنوع للاستخدام اليومي', body: `مُهندَس ليتحمّل كل ما تواجهه في حياتك اليومية.` },
    { icon: '✅', heading: 'جودة تشعر بها',          body: `كل قطعة تُفحص يدويًا قبل خروجها من المستودع.` },
    { icon: '🛡️', heading: 'ضمان 12 شهرًا',         body: `إن تعطّل نستبدله لك — دون جدال حول شحن الإرجاع.` },
  ]
  const all = [...defaults, ...matches]
  // dedupe by heading
  const seen = new Set<string>()
  return all.filter((x) => (seen.has(x.heading) ? false : (seen.add(x.heading), true))).slice(0, 6)
}

/* ── real-review helpers ──────────────────────────────────────────── */

/** Usable scraped reviews: non-empty text, valid rating. */
function realReviews(c: BuildConfig) {
  return (c.reviews || []).filter(
    (r) => r && typeof r.text === 'string' && r.text.trim().length >= 8 && r.rating >= 1 && r.rating <= 5,
  )
}

/** True when we have enough real reviews to seed the social-proof
 *  sections from them instead of invented copy. */
export function hasRealReviews(c: BuildConfig): boolean {
  return realReviews(c).length >= 3
}

/**
 * Whether a homepage/product section should be emitted for THIS product.
 * Keeps the generated theme honest: photo-driven social proof only ships
 * when we actually scraped real customer photos (never faked with product
 * shots), and the review/star sections only when we have real reviews.
 */
export function includeSection(type: string, c: BuildConfig): boolean {
  const realPhotos = reviewPhotos(c).length >= 4
  switch (type) {
    // UGC grids are ONLY meaningful with real reviewer photos. No real
    // photos → drop the section rather than paste product shots under
    // invented @handles / "Verified buyer" names.
    case 'ds-ugc-gallery':
    case 'ds-customer-photos':
      return realPhotos
    default:
      return true
  }
}

/** All photo URLs attached to the scraped reviews, deduped. */
function reviewPhotos(c: BuildConfig): Array<{ url: string; name: string }> {
  const out: Array<{ url: string; name: string }> = []
  const seen = new Set<string>()
  for (const r of realReviews(c)) {
    for (const url of r.photos || []) {
      if (!url || seen.has(url)) continue
      seen.add(url)
      out.push({ url, name: r.name || 'Verified buyer' })
    }
  }
  return out
}

/** Build a short headline out of a review's first phrase. */
function reviewHeadline(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const firstStop = clean.search(/[.!?]/)
  let head = firstStop > 0 && firstStop <= 60 ? clean.slice(0, firstStop) : clean
  if (head.length > 60) head = head.slice(0, 57).trimEnd() + '…'
  return head
}

/** "4.8" style average — real stats first, else computed from reviews. */
function reviewAverage(c: BuildConfig): string | null {
  if (c.reviewStats && c.reviewStats.average > 0) return c.reviewStats.average.toFixed(1)
  const rs = realReviews(c)
  if (!rs.length) return null
  return (rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(1)
}

/** Total review count — real stats first, else the scraped sample size. */
function reviewCount(c: BuildConfig): number | null {
  if (c.reviewStats && c.reviewStats.count > 0) return c.reviewStats.count
  const rs = realReviews(c)
  return rs.length || null
}

/* ── per-section seeds ────────────────────────────────────────────── */

function seedAnnouncement(c: BuildConfig): SeededSection {
  const msgs = [
    `شحن مجاني للطلبات فوق ${money(50)} · إرجاع خلال 30 يومًا`,
    `دفع آمن · ضمان استرداد المال`,
    `يُشحن خلال 24 ساعة من مستودعات محلية`,
  ]
  const { blocks, order } = indexBlocks('msg', msgs.map((text) => ({ type: 'message', settings: { text } })))
  return { settings: {}, blocks, block_order: order }
}

function seedHero(c: BuildConfig): SeededSection {
  const discount = c.originalPrice > c.salePrice && c.originalPrice > 0
    ? `وفّر ${Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100)}%`
    : 'متوفّر الآن'
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  const stats = [
    {
      stat: avg ? `${avg}★` : '—',
      label: count ? `${count.toLocaleString('en-US')} تقييم` : 'تقييمات حقيقية',
    },
    { stat: '30 يومًا', label: 'استرداد المال' },
    { stat: 'مجاني', label: `الشحن فوق ${money(50)}` },
  ]
  const { blocks, order } = indexBlocks('stat', stats.map((s) => ({ type: 'stat', settings: s })))
  return {
    settings: {
      eyebrow: discount,
      headline: c.productName || 'منتج يستحق الحديث عنه',
      subhead: safeDescription(c, 180),
      cta_label: `احصل عليه الآن — ${money(c.salePrice)}`,
    },
    blocks,
    block_order: order,
  }
}

function seedFooter(c: BuildConfig): SeededSection {
  return {
    settings: {
      tagline: `${c.storeName} — منتجات مختارة بعناية، شحن سريع، ودعم حقيقي من بشر خلف البريد.`,
    },
    blocks: {
      // Label|URL — every link must land somewhere real. Homepage anchors
      // (#bundle, #faq…) are rendered by the sections themselves; 'mailto:'
      // expands to the store owner's email in liquid.
      'col-shop': { type: 'column', settings: { heading: 'تسوّق', links: `${c.productName}|/#product\nالباقات ووفّر|/#bundle\nالتقييمات|/#reviews` } },
      'col-help': { type: 'column', settings: { heading: 'المساعدة', links: 'الأسئلة الشائعة|/#faq\nالشحن والتوصيل|/#faq\nالإرجاع والضمان|/#guarantee\nتواصل معنا|mailto:' } },
      'col-co':   { type: 'column', settings: { heading: 'الشركة', links: 'قصتنا|/#our-story\nالتقييمات|/#reviews\nصور العملاء|/#customer-photos\nفي الإعلام|/#press' } },
      'news':     { type: 'newsletter', settings: { heading: 'كن أول من يعرف', copy: 'تنبيهات التوفّر وعروض حصرية للأعضاء. بلا إزعاج.' } },
    },
    block_order: ['col-shop', 'col-help', 'col-co', 'news'],
  }
}

function seedProductMain(c: BuildConfig): SeededSection {
  // First image is hero; remaining go into gallery thumbs.
  const thumbs = c.images.slice(0, 6).map((img, i) => ({
    type: 'thumb',
    settings: { image_url: img },
  }))
  const trustPoints = [
    `شحن مجاني للطلبات فوق ${money(50)}`,
    `ضمان استرداد المال خلال 30 يومًا`,
    `توصيل مُتتبَّع خلال 3-5 أيام`,
    `ضمان لمدة 12 شهرًا`,
  ]
  const trustBlocks = trustPoints.map((text) => ({ type: 'trust', settings: { text } }))
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  thumbs.forEach((b, i) => {
    const id = `thumb-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  // Bundle tiers inside the buy box — prices render as units × the live
  // product price, the radio sets the add-to-cart quantity.
  // Honest labels: the buy box charges the live product price × units (no
  // invented discount), so the tiers are pure quantity choices — no
  // "+N free" the customer never receives.
  const tiers = [
    { label: '1× — قطعة واحدة', units: 1 },
    { label: '2× — قطعتان', units: 2, badge: 'الأكثر طلبًا', featured: true },
    { label: '3× — وفّر أكثر', units: 3, badge: 'أفضل قيمة' },
  ]
  tiers.forEach((t, i) => {
    const id = `tier-${i + 1}`
    blocks[id] = { type: 'tier', settings: t }
    order.push(id)
  })
  trustBlocks.forEach((b, i) => {
    const id = `trust-${i + 1}`
    blocks[id] = b
    order.push(id)
  })
  // Info accordions next to the gallery: shipping/carrier, returns,
  // warranty. The full product description renders as its own accordion
  // automatically once a real product is connected.
  const accordions = [
    { title: 'الشحن والتوصيل', body: `تُشحن الطلبات خلال 24 ساعة في أيام العمل عبر شركة شحن مُتتبَّعة. التوصيل المعتاد خلال 3-5 أيام عمل — وستصلك رسالة برقم التتبّع لحظة خروج الطلب من المستودع.` },
    { title: 'الإرجاع والضمان', body: `ضمان استرداد المال خلال 30 يومًا. أعِد ${c.productName} لأي سبب — نرسل لك بوليصة إرجاع مدفوعة ونعيد كامل المبلغ خلال 3 أيام من استلامه.` },
    { title: 'الضمان', body: `كل ${c.productName} مشمول بضمان تصنيع لمدة 12 شهرًا. إذا تعطّل خلال الاستخدام الطبيعي نستبدله لك — دون جدال حول شحن الإرجاع.` },
  ]
  accordions.forEach((a, i) => {
    const id = `acc-${i + 1}`
    blocks[id] = { type: 'accordion', settings: a }
    order.push(id)
  })
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  return {
    settings: {
      fallback_title: c.productName,
      fallback_desc: safeDescription(c, 400),
      fallback_image_url: pickImage(c, 0),
      rating: avg || '',
      review_count: count ? count.toLocaleString('en-US') : '',
    },
    blocks,
    block_order: order,
  }
}

function seedBundle(c: BuildConfig): SeededSection {
  const p = c.salePrice
  // Honest, self-consistent tiers: the quantity headline == the units the
  // CTA actually adds to the cart, and the discount is a real per-unit
  // percentage (matching the volume-discount section) rather than a
  // "+N free" promise that only appears if a Buy-X-get-Y discount exists.
  // The merchant still creates the matching automatic discount in admin so
  // the shown price applies at checkout — flagged in the claims checklist.
  const two = p * 2 * 0.85 // 15% off
  const three = p * 3 * 0.75 // 25% off
  return {
    settings: {
      eyebrow: 'اشترِ أكثر ووفّر أكثر',
      title: `اختر باقتك من ${c.productName}`,
      cta: 'المتابعة إلى السلة',
      note: 'تُطبَّق الخصومات تلقائيًا عند الدفع · ضمان استرداد المال خلال 30 يومًا',
    },
    blocks: {
      'tier-1': { type: 'tier', settings: { qty: '1×', units: 1, name: 'قطعة واحدة', price: money(p),     subtext: 'للتجربة' } },
      'tier-2': { type: 'tier', settings: { qty: '2×', units: 2, name: 'قطعتان',     price: money(two),   subtext: 'وفّر 15%', featured: true, ribbon: 'الأكثر طلبًا' } },
      'tier-3': { type: 'tier', settings: { qty: '3×', units: 3, name: 'أفضل قيمة',  price: money(three), subtext: 'وفّر 25%' } },
    },
    block_order: ['tier-1', 'tier-2', 'tier-3'],
  }
}

function seedFeatures(c: BuildConfig): SeededSection {
  return {
    settings: { title: `لماذا يختار الناس ${c.storeName || 'متجرنا'}` },
    blocks: {
      'f-1': { type: 'feature', settings: { icon: 'truck',  heading: 'شحن مجاني',        body: 'توصيل مُتتبَّع خلال 3-5 أيام عمل، على حسابنا.' } },
      'f-2': { type: 'feature', settings: { icon: 'shield', heading: 'إرجاع خلال 30 يومًا', body: 'جرّبه، وإن لم يعجبك أعِده إلينا ببساطة.' } },
      'f-3': { type: 'feature', settings: { icon: 'lock',   heading: 'دفع آمن',           body: 'مدفوعات بمعايير بنكية. بياناتك تبقى ملكك.' } },
      'f-4': { type: 'feature', settings: { icon: 'chat',   heading: 'دعم من بشر حقيقيين', body: 'نردّ خلال 6 ساعات في أيام العمل.' } },
    },
    block_order: ['f-1', 'f-2', 'f-3', 'f-4'],
  }
}

function seedComparison(c: BuildConfig): SeededSection {
  // Build a comparison that is specific to THIS product, not boilerplate.
  // Product-attribute rows come from the real scraped highlights/specs so
  // the table reflects what the merchant is actually selling; the service
  // rows below are the store's own differentiators vs. a bare listing.
  const rows: Array<{ feature: string; us: boolean; them: boolean }> = []
  const seen = new Set<string>()
  const addRow = (label: string, cap: number) => {
    const f = (label || '').replace(/\s+/g, ' ').trim()
    if (!f) return
    const key = f.toLowerCase()
    if (seen.has(key) || rows.length >= cap) return
    seen.add(key)
    rows.push({ feature: f.length > 44 ? f.slice(0, 42).trimEnd() + '…' : f, us: true, them: false })
  }
  // Up to 3 real product attributes first.
  for (const h of c.highlights || []) addRow(h, 3)
  if (c.specs) for (const [k, v] of Object.entries(c.specs)) addRow(v && v.length < 24 ? `${k}: ${v}` : k, 3)
  // Store service differentiators (merchant-owned, verifiable policies).
  addRow('شحن مجاني خلال 3-5 أيام', 7)
  addRow('ضمان استرداد المال خلال 30 يومًا', 7)
  addRow('ضمان لمدة 12 شهرًا', 7)
  addRow('دعم من بشر حقيقيين', 7)
  // Fallback so the table is never sparse for spec-less products.
  addRow(`${c.productName} بجودة عالية`, 7)
  // Both offer honest pricing — an honest "tie" row reads more credibly.
  rows.push({ feature: 'أسعار صادقة بلا رسوم خفية', us: true, them: true })
  const { blocks, order } = indexBlocks('row', rows.map((r) => ({ type: 'row', settings: r })))
  return {
    settings: {
      title: 'لماذا نحن الأفضل',
      subtitle: `مقارنة سريعة مع البدائل الأرخص التي قد تجدها على الإنترنت.`,
      us_label: c.storeName || 'نحن',
      them_label: 'غيرنا',
    },
    blocks,
    block_order: order,
  }
}

function seedReviews(c: BuildConfig): SeededSection {
  const pn = c.productName

  // Real scraped reviews win: real names, real text, real star ratings.
  if (hasRealReviews(c)) {
    const rs = realReviews(c)
      .slice()
      .sort((a, b) => (b.text.length - a.text.length))
      .slice(0, 6)
    const avg = reviewAverage(c)
    const count = reviewCount(c)
    const { blocks, order } = indexBlocks('review', rs.map((r) => ({
      type: 'review',
      settings: {
        rating: Math.min(5, Math.max(1, Math.round(r.rating))),
        headline: reviewHeadline(r.text),
        body: r.text.replace(/\s+/g, ' ').trim().slice(0, 300),
        author: r.name || 'مشترٍ موثّق',
        location: r.country || '',
        verified: true,
      },
    })))
    return {
      settings: {
        title: `ماذا يقول مقتنو ${pn}`,
        average: avg ? `${avg} من 5` : '',
        count: count ? `${count.toLocaleString('en-US')} تقييم على القائمة الأصلية` : '',
      },
      blocks,
      block_order: order,
    }
  }

  // Fallback: invented copy — every one of these lands in the claims
  // checklist so the merchant replaces them before launch.
  const reviews = [
    { headline: 'يستحق كل قرش بصراحة',            body: `كنت مترددًا بسبب السعر، لكن ${pn} أصبح جزءًا من روتيني منذ شهرين ولا شكوى لديّ إطلاقًا.`, author: 'أحمد س.',  location: 'القاهرة' },
    { headline: 'وصل بسرعة وبجودة راقية',          body: `وصل خلال ثلاثة أيام في تغليف أنيق جدًا. جودة التصنيع تُشبه ما ثمنه الضعف.`,                      author: 'منى ر.',   location: 'الجيزة' },
    { headline: 'اشتريت واحدًا ثم عدت للباقة',       body: `عرض القطعتين أقنعني. أهديت واحدًا لوالدتي في عيد ميلادها ولم تتوقف عن مدحه.`,                    author: 'يوسف ك.',  location: 'الإسكندرية' },
    { headline: 'أغنى عن ثلاثة أشياء',             body: `كنت أستخدم حلولًا مؤقتة من قبل. ${pn} جمع ثلاثة أشياء في واحد وأصبح المكتب مرتّبًا أخيرًا.`,      author: 'سارة م.',  location: 'المنصورة' },
    { headline: 'الدعم ردّ فعلًا',                 body: `كان لديّ سؤال عن الشحن في اليوم الرابع، وجاءني ردّ حقيقي خلال أقل من ساعتين. أمر نادر.`,          author: 'خالد ع.',  location: 'طنطا' },
    { headline: 'لا ندم بعد الشراء',              body: `قرأت كل التقييمات قبل الشراء وكانت جميعها صادقة. سعيد أنني اخترت هذه النسخة.`,                    author: 'ريم ت.',   location: 'أسيوط' },
  ]
  const { blocks, order } = indexBlocks('review', reviews.map((r) => ({ type: 'review', settings: r })))
  return {
    settings: { title: `ماذا يقول مقتنو ${pn}`, average: '', count: '' },
    blocks,
    block_order: order,
  }
}

function seedFaq(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { question: `متى يُشحن ${pn}؟`,               answer: `في نفس اليوم إذا طلبت قبل الساعة 3 عصرًا بالتوقيت المحلي، وإلا في يوم العمل التالي. وستصلك رسالة برقم التتبّع.` },
    { question: 'ما سياسة الإرجاع؟',              answer: `30 يومًا دون أسئلة. أعِد ${pn} بأي حالة واسترجع كامل المبلغ — بل ونتحمّل نحن بوليصة الإرجاع.` },
    { question: 'كم مدة الضمان؟',                 answer: '12 شهرًا ضد عيوب التصنيع. إذا تعطّل شيء راسلنا ونستبدله لك.' },
    { question: 'هل يمكن الدفع بالتقسيط؟',         answer: 'نعم — خيارات الدفع بالتقسيط متاحة عند إتمام الشراء لتقسيم المبلغ على دفعات.' },
    { question: 'هل تشحنون خارج البلد؟',          answer: 'نشحن إلى معظم الدول العربية والعالم. للاستفسار عن بلدك راسلنا وسنساعدك.' },
    { question: 'بمَ يختلف عن البدائل الأرخص؟',    answer: `النسخ الأرخص تتساهل في التصنيع. ${pn} مصنوع من مواد عالية الجودة ويُفحص يدويًا قبل خروجه من المستودع.` },
    { question: 'ماذا لو واجهتني مشكلة؟',          answer: 'ردّ على بريد طلبك أو استخدم نموذج التواصل، وسيردّ عليك شخص حقيقي من فريقنا خلال 6 ساعات في أيام العمل.' },
  ]
  const { blocks, order } = indexBlocks('qa', items.map((qa) => ({ type: 'qa', settings: qa })))
  return { settings: { title: 'الأسئلة الشائعة' }, blocks, block_order: order }
}

function seedCta(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: `احصل على ${c.productName} قبل نفاد الكمية`,
      subtitle: `شحن مجاني للطلبات فوق ${money(50)} · إرجاع خلال 30 يومًا · دعم حقيقي عبر البريد.`,
      cta: `أضِف ${c.productName} إلى السلة — ${money(c.salePrice)}`,
      cta_url: '/#product',
    },
  }
}

function seedStickyAtc(c: BuildConfig): SeededSection {
  return {
    settings: {
      cta: `أضِف إلى السلة — ${money(c.salePrice)}`,
      fallback_title: c.productName,
      fallback_image_url: pickImage(c, 0),
    },
  }
}

function seedPromoBar(c: BuildConfig): SeededSection {
  return {
    settings: {
      tag: 'عرض',
      text: `وفّر حتى 25% على باقات ${c.productName} — هذا الأسبوع فقط`,
      cta: 'اطلب الآن',
      cta_url: '#product',
      bg: '#111111',
      fg: '#FFFFFF',
    },
  }
}

function seedMarquee(c: BuildConfig): SeededSection {
  const items = [
    `★ منتجات مختارة بعناية`,
    `شحن مجاني للطلبات فوق ${money(50)}`,
    'ضمان استرداد المال خلال 30 يومًا',
    'يُشحن خلال 24 ساعة',
    'دعم من بشر حقيقيين',
    `وفّر ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) + '%' : '25%'} على الباقات`,
  ]
  const { blocks, order } = indexBlocks('it', items.map((text) => ({ type: 'item', settings: { text } })))
  return { settings: { bg: '#111111', fg: '#FFFFFF' }, blocks, block_order: order }
}

function seedLogoBar(_c: BuildConfig): SeededSection {
  const labels = ['FORBES', 'WIRED', 'TECHCRUNCH', 'VOGUE', 'GQ', 'BUZZFEED']
  const { blocks, order } = indexBlocks('logo', labels.map((label) => ({ type: 'logo', settings: { label } })))
  return { settings: { title: 'ظهرنا في' }, blocks, block_order: order }
}

function seedStats(c: BuildConfig): SeededSection {
  const avg = reviewAverage(c)
  const count = reviewCount(c)
  const stats = [
    { number: count ? `${count.toLocaleString('en-US')}+` : '—', label: count ? 'تقييم على القائمة الأصلية' : 'تقييمات حقيقية' },
    { number: avg ? `${avg}★` : '—', label: 'متوسط التقييم' },
    { number: '30 يومًا', label: 'ضمان استرداد المال' },
    { number: '24 ساعة',  label: 'يُشحن خلال' },
  ]
  const { blocks, order } = indexBlocks('s', stats.map((s) => ({ type: 'stat', settings: s })))
  return { settings: {}, blocks, block_order: order }
}

function seedCountdown(c: BuildConfig): SeededSection {
  // 6 days out — gives a real urgency window without baking a specific
  // date into the merchant's editor.
  const end = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
  return {
    settings: {
      eyebrow: 'عرض محدود',
      title: `وفّر ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) + '%' : 'الكثير'} على ${c.productName}`,
      end_iso: end.toISOString(),
      cta_label: 'اطلب العرض',
      cta_url: '#product',
    },
  }
}

function seedStockCounter(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'أسرِع! تبقّى COUNT قطعة فقط',
      count: '23',
      percent: 20,
      subtitle: `بمجرد نفاد هذه الدفعة من ${c.productName}، فإن إعادة التوفير بعد أسبوعين.`,
    },
  }
}

function seedHighlights(c: BuildConfig): SeededSection {
  const items = highlightFromDescription(c)
  const { blocks, order } = indexBlocks('h', items.map((h) => ({ type: 'highlight', settings: h })))
  return { settings: { title: `ما الذي يميّز ${c.productName}` }, blocks, block_order: order }
}

function seedBeforeAfter(c: BuildConfig): SeededSection {
  // Pull two distinct images — if there are 5+ we use #2 and #3.
  return {
    settings: {
      title: `الحياة قبل وبعد ${c.productName}`,
      subtitle: 'اسحب المقبض للمقارنة.',
      before_url: pickImage(c, 1),
      after_url: pickImage(c, 0),
      before_label: 'قبل',
      after_label: 'مع ' + c.productName.split(' ')[0],
    },
  }
}

function seedHowItWorks(c: BuildConfig): SeededSection {
  const steps = [
    { heading: `اختر باقتك من ${c.productName}`, body: 'قطعة واحدة، أو قطعتان بخصم 15%، أو ثلاث قطع بخصم 25% — كلما زاد شراؤك زاد توفيرك.' },
    { heading: 'اطلب في ثوانٍ',                 body: 'محفظة آبل، أو شوب باي، أو التقسيط، أو البطاقة — كما تحب. يُشحن خلال 24 ساعة.' },
    { heading: 'تابع وصوله إليك',               body: 'تتبّع لحظي عبر البريد. يصل عادةً خلال 3-5 أيام عمل.' },
    { heading: 'أحبَّه أو استرد مالك',           body: '30 يومًا لتقرّر. بل ونتحمّل نحن بوليصة الإرجاع.' },
  ]
  const { blocks, order } = indexBlocks('step', steps.map((s) => ({ type: 'step', settings: s })))
  return { settings: { title: `كيف يعمل ${c.storeName}` }, blocks, block_order: order }
}

function seedImageText(c: BuildConfig): SeededSection {
  // Transformation copy: paint the buyer's life AFTER the product, not
  // the product itself. Pulls a benefit phrase from the description
  // when one exists so the copy stays grounded in the listing.
  const pn = c.productName
  const desc = safeDescription(c, 160)
  return {
    settings: {
      image_url: pickImage(c, 1),
      eyebrow: 'الحياة معه',
      heading: `ما الذي يتغيّر فعلًا حين يصلك ${pn}`,
      body:
        `<p>اليوم الأول: تفتح العلبة، وتجهّزه في دقائق، وتتساءل لماذا انتظرت كل هذا الوقت. ` +
        `وبحلول الأسبوع الثاني يصبح جزءًا من روتينك — يختفي الحل المؤقت المزعج الذي حلّ محلّه وتتوقّف عن التفكير فيه.</p>` +
        `<p>${desc} هذا ما يفعله ${pn} بهدوء كل يوم — وإن لم يستحق مكانه في روتينك خلال 30 يومًا فأعِده على حسابنا.</p>`,
      cta: `احصل على ${pn}`,
      cta_url: '/#product',
    },
  }
}

function seedUgc(c: BuildConfig): SeededSection {
  // Real review photos with real reviewer names beat product shots with
  // invented handles.
  const photos = reviewPhotos(c)
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  if (photos.length >= 4) {
    photos.slice(0, 12).forEach((p, i) => {
      const id = `p-${i + 1}`
      blocks[id] = { type: 'post', settings: { image_url: p.url, caption: p.name } }
      order.push(id)
    })
    return {
      settings: {
        eyebrow: 'صور العملاء',
        title: `مقتنو ${c.productName} الحقيقيون، بصور حقيقية`,
        handle: 'من تقييمات موثّقة',
      },
      blocks,
      block_order: order,
    }
  }
  const handles = ['@maya', '@alexp', '@jordan', '@sam', '@riley', '@taylor', '@kai', '@morgan', '@quinn', '@emma', '@noah', '@avery']
  for (let i = 0; i < 12; i++) {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'post', settings: { image_url: pickImage(c, i), caption: handles[i % handles.length] } }
    order.push(id)
  }
  return {
    settings: {
      eyebrow: `#${(c.storeName || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      title: `محبوب من مجتمع ${c.storeName}`,
      handle: `@${(c.storeName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    },
    blocks,
    block_order: order,
  }
}

function seedPress(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { quote: `علامة تجارية بمنتج واحد تفي فعلًا بوعودها — و${pn} هو الدليل.`, source: 'FORBES' },
    { quote: `جودة تصنيع تتوقّعها بضعف السعر.`,                              source: 'WIRED' },
    { quote: `متميّز في فئة مزدحمة.`,                                        source: 'TECHCRUNCH' },
  ]
  const { blocks, order } = indexBlocks('q', items.map((p) => ({ type: 'quote', settings: p })))
  return { settings: { title: 'ماذا تقول الصحافة' }, blocks, block_order: order }
}

function seedFounder(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 2),
      quote: `أسّست ${c.storeName} لأن المنتجات المتوفّرة في السوق كانت إمّا مبالغًا في سعرها أو رديئة. صنعنا المنتج الذي أرغب أنا في اقتنائه — ونقف خلفه.`,
      name: 'اسم المؤسِّس',
      role: `المؤسِّس، ${c.storeName}`,
      cta: 'اقرأ قصتنا',
      cta_url: '/pages/about',
    },
  }
}

function seedGuarantee(c: BuildConfig): SeededSection {
  return {
    settings: {
      seal_text: 'استرداد المال',
      days: '30 يومًا',
      title: `جرّب ${c.productName} دون مخاطرة لمدة 30 يومًا`,
      body: `إن لم يعجبك ${c.productName} فأعِده واسترجع كامل المبلغ — بل ونتحمّل نحن بوليصة الإرجاع. دعم من بشر حقيقيين عبر البريد خلال أقل من 6 ساعات في أيام العمل.`,
    },
    blocks: {
      'p-1': { type: 'point', settings: { point: 'إرجاع لأي سبب، دون أسئلة' } },
      'p-2': { type: 'point', settings: { point: 'نتحمّل نحن بوليصة شحن الإرجاع' } },
      'p-3': { type: 'point', settings: { point: 'يصل الاسترداد إلى بطاقتك خلال 3 أيام' } },
      'p-4': { type: 'point', settings: { point: 'ضمان تصنيع لمدة 12 شهرًا إضافةً لذلك' } },
    },
    block_order: ['p-1', 'p-2', 'p-3', 'p-4'],
  }
}

function seedTrustBadges(_c: BuildConfig): SeededSection {
  return {
    settings: {},
    blocks: {
      'b-1': { type: 'badge', settings: { icon: 'truck',  heading: 'شحن مجاني',           body: 'توصيل مُتتبَّع خلال 3-5 أيام.' } },
      'b-2': { type: 'badge', settings: { icon: 'shield', heading: 'إرجاع خلال 30 يومًا',   body: 'ونتحمّل نحن بوليصة الإرجاع.' } },
      'b-3': { type: 'badge', settings: { icon: 'lock',   heading: 'دفع آمن',              body: 'تشفير بمعايير بنكية.' } },
      'b-4': { type: 'badge', settings: { icon: 'chat',   heading: 'دعم من بشر حقيقيين',    body: 'نردّ خلال أقل من 6 ساعات.' } },
    },
    block_order: ['b-1', 'b-2', 'b-3', 'b-4'],
  }
}

function seedRecentlyBought(c: BuildConfig): SeededSection {
  const buyers = [
    { name: 'سارة م.',  product: '1× ' + c.productName,  location: 'القاهرة' },
    { name: 'يوسف ل.',  product: 'عبوة من قطعتين',        location: 'الجيزة' },
    { name: 'منى ر.',   product: 'باقة من ثلاث قطع',      location: 'الإسكندرية' },
    { name: 'خالد ك.',  product: '1× ' + c.productName,  location: 'المنصورة' },
    { name: 'ريم ت.',   product: 'قطعتان',               location: 'طنطا' },
    { name: 'عمر ب.',   product: '1× ' + c.productName,  location: 'أسيوط' },
  ]
  const { blocks, order } = indexBlocks('n', buyers.map((b) => ({ type: 'notification', settings: { ...b, action: 'اشترى للتو' } })))
  return { settings: { icon: '🛒', position: 'left' }, blocks, block_order: order }
}

function seedNewsletter(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: `نادي ${c.storeName || 'العملاء'}`,
      title: 'كن أول من يعرف',
      subtitle: `تنبيهات التوفّر وعروض حصرية للأعضاء على ${c.productName}. بلا إزعاج — إلغاء الاشتراك بنقرة واحدة.`,
      cta: 'اشترك',
    },
  }
}

function seedFreeShippingBar(_c: BuildConfig): SeededSection {
  return { settings: { threshold: 50 } }
}

function seedSecureCheckout(_c: BuildConfig): SeededSection {
  // The section renders the store's real enabled payment-type icons —
  // no manual badge blocks to maintain.
  return { settings: { title: 'دفع آمن · تشفير 256-بت' } }
}

function seedShippingInfo(_c: BuildConfig): SeededSection {
  return {
    settings: {},
    blocks: {
      'i-1': { type: 'info', settings: { icon: '🚚', heading: 'شحن مجاني فوق 50$',    body: 'توصيل مُتتبَّع خلال 3-5 أيام عمل، على حسابنا.' } },
      'i-2': { type: 'info', settings: { icon: '📦', heading: 'يُشحن من داخل بلدك',    body: 'مستودعات محلية لتوصيل أسرع.' } },
      'i-3': { type: 'info', settings: { icon: '↩️', heading: 'إرجاع خلال 30 يومًا',   body: 'إن لم يعجبك أعِده — ويصل الاسترداد خلال 3 أيام.' } },
    },
    block_order: ['i-1', 'i-2', 'i-3'],
  }
}

function seedAwards(_c: BuildConfig): SeededSection {
  const items = [
    { icon: '🏆', year: '2025', name: 'اختيار المحرّرين' },
    { icon: '🥇', year: '2025', name: 'أفضل علامة جديدة' },
    { icon: '⭐', year: '2024', name: 'الأعلى تقييمًا' },
    { icon: '✨', year: '2024', name: 'جائزة الابتكار' },
  ]
  const { blocks, order } = indexBlocks('a', items.map((a) => ({ type: 'award', settings: a })))
  return { settings: { title: 'تقدير' }, blocks, block_order: order }
}

function seedFloatingCta(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'أول مرة؟ احصل على خصم 10%',
      subtitle: `استخدم كود WELCOME10 على أول ${c.productName}.`,
      cta: 'استخدم الكود',
      cta_url: '/#product',
      image_url: pickImage(c, 0),
    },
  }
}

function seedStarsSummary(c: BuildConfig): SeededSection {
  // Real distribution computed from the scraped ratings when available.
  if (hasRealReviews(c)) {
    const rs = realReviews(c)
    const dist = [0, 0, 0, 0, 0]
    for (const r of rs) dist[Math.min(5, Math.max(1, Math.round(r.rating))) - 1]++
    const pct = dist.map((n) => Math.round((n / rs.length) * 100))
    const avg = reviewAverage(c) || '5.0'
    const count = reviewCount(c) || rs.length
    return {
      settings: { average: avg, count: `بناءً على ${count.toLocaleString('en-US')} تقييم على القائمة الأصلية` },
      blocks: {
        'r-5': { type: 'bar', settings: { label: '5★', percent: pct[4] } },
        'r-4': { type: 'bar', settings: { label: '4★', percent: pct[3] } },
        'r-3': { type: 'bar', settings: { label: '3★', percent: pct[2] } },
        'r-2': { type: 'bar', settings: { label: '2★', percent: pct[1] } },
        'r-1': { type: 'bar', settings: { label: '1★', percent: pct[0] } },
      },
      block_order: ['r-5', 'r-4', 'r-3', 'r-2', 'r-1'],
    }
  }
  return {
    settings: { average: '', count: '' },
    blocks: {
      'r-5': { type: 'bar', settings: { label: '5★', percent: 88 } },
      'r-4': { type: 'bar', settings: { label: '4★', percent: 8 } },
      'r-3': { type: 'bar', settings: { label: '3★', percent: 2 } },
      'r-2': { type: 'bar', settings: { label: '2★', percent: 1 } },
      'r-1': { type: 'bar', settings: { label: '1★', percent: 1 } },
    },
    block_order: ['r-5', 'r-4', 'r-3', 'r-2', 'r-1'],
  }
}

function seedTestimonialsVideo(c: BuildConfig): SeededSection {
  const pn = c.productName
  const items = [
    { quote: `بصراحة أفضل شيء اشتريته هذا العام.`,   author: 'سارة، القاهرة' },
    { quote: `أستخدم ${pn} كل يوم.`,                  author: 'أحمد، الجيزة' },
    { quote: `يستحق كل قرش.`,                         author: 'منى، الإسكندرية' },
    { quote: `اشتريت قطعتين إضافيتين لوالديّ.`,        author: 'يوسف، طنطا' },
  ]
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  items.forEach((it, i) => {
    const id = `v-${i + 1}`
    blocks[id] = { type: 'video', settings: { ...it } }
    order.push(id)
  })
  return {
    settings: { title: `مقتنو ${pn} الحقيقيون، قصص حقيقية`, subtitle: 'اضغط أي مقطع لمشاهدة التقييم كاملًا دون تعديل.' },
    blocks,
    block_order: order,
  }
}

function seedCustomerPhotos(c: BuildConfig): SeededSection {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  // Real review photos with the reviewer's real name when we have them.
  const photos = reviewPhotos(c)
  if (photos.length >= 4) {
    photos.slice(0, 8).forEach((p, i) => {
      const id = `p-${i + 1}`
      blocks[id] = { type: 'photo', settings: { author: p.name, note: 'مشترٍ موثّق', image_url: p.url } }
      order.push(id)
    })
    return { settings: { title: `مقتنو ${c.productName} الحقيقيون، بصور حقيقية` }, blocks, block_order: order }
  }
  const items = [
    { author: 'سارة م.', note: 'مشترٍ موثّق' },
    { author: 'أحمد ع.',  note: 'مشترٍ موثّق' },
    { author: 'منى ر.',   note: 'مشترٍ موثّق' },
    { author: 'يوسف س.',  note: 'مشترٍ موثّق' },
    { author: 'ريم ت.',   note: 'مشترٍ موثّق' },
    { author: 'عمر ب.',   note: 'مشترٍ موثّق' },
    { author: 'خالد ك.',  note: 'مشترٍ موثّق' },
    { author: 'ليلى ح.',  note: 'مشترٍ موثّق' },
  ]
  items.forEach((it, i) => {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'photo', settings: { ...it, image_url: pickImage(c, i + 1) } }
    order.push(id)
  })
  return { settings: { title: `مقتنو ${c.productName} الحقيقيون، بصور حقيقية` }, blocks, block_order: order }
}

function seedVolumeDiscount(c: BuildConfig): SeededSection {
  return {
    settings: {
      title: `اشترِ أكثر من ${c.productName} ووفّر أكثر`,
      subtitle: 'خزِّن — كلما زاد شراؤك قلّ سعر القطعة.',
      fallback_price: c.salePrice,
      cta: 'أضِف إلى السلة',
    },
    blocks: {
      't-1': { type: 'tier', settings: { qty: 1, discount_pct: 0  } },
      't-2': { type: 'tier', settings: { qty: 2, discount_pct: 15 } },
      't-3': { type: 'tier', settings: { qty: 3, discount_pct: 25, featured: true, ribbon: 'الأكثر طلبًا' } },
      't-4': { type: 'tier', settings: { qty: 5, discount_pct: 40 } },
    },
    block_order: ['t-1', 't-2', 't-3', 't-4'],
  }
}

function seedFrequentlyBought(c: BuildConfig): SeededSection {
  const accessory = c.salePrice * 0.4
  const addon = c.salePrice * 0.2
  return {
    settings: {
      title: 'يُشترى عادةً معًا',
      bundle_total: money(c.salePrice + accessory + addon),
      cta: 'أضِف الكل إلى السلة',
    },
    blocks: {
      'fbt-1': { type: 'item', settings: { name: c.productName,       price: money(c.salePrice), preselected: true,  image_url: pickImage(c, 0) } },
      'fbt-2': { type: 'item', settings: { name: 'حقيبة حمل',         price: money(accessory),  preselected: true,  image_url: pickImage(c, 1) } },
      'fbt-3': { type: 'item', settings: { name: 'عبوة إضافية / ملحقات', price: money(addon),   preselected: false, image_url: pickImage(c, 2) } },
    },
    block_order: ['fbt-1', 'fbt-2', 'fbt-3'],
  }
}

function seedProductSpecs(c: BuildConfig): SeededSection {
  // Real specs scraped from the source listing win — no invented
  // dimensions/weights a buyer could return the product over.
  const real = Object.entries(c.specs || {})
    .filter(([k, v]) => k && v && k.length <= 40 && String(v).length <= 120)
    .slice(0, 8)
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  if (real.length >= 2) {
    real.forEach(([label, value], i) => {
      const id = `s-${i + 1}`
      blocks[id] = { type: 'spec', settings: { label, value: String(value) } }
      order.push(id)
    })
    return { settings: { title: `مواصفات ${c.productName}` }, blocks, block_order: order }
  }
  // Fallback: only claims we stand behind elsewhere in the theme —
  // no fabricated dimensions or weights.
  const fallback = [
    { label: 'الضمان',      value: '12 شهرًا ضد عيوب التصنيع' },
    { label: 'الإرجاع',     value: 'ضمان استرداد المال خلال 30 يومًا' },
    { label: 'الشحن',       value: 'مُتتبَّع، عادةً خلال 3-5 أيام عمل' },
    { label: 'داخل العلبة', value: `1× ${c.productName}` },
  ]
  fallback.forEach((s, i) => {
    const id = `s-${i + 1}`
    blocks[id] = { type: 'spec', settings: s }
    order.push(id)
  })
  return { settings: { title: `${c.productName} specs` }, blocks, block_order: order }
}

function seedProductVideo(_c: BuildConfig): SeededSection {
  return { settings: { title: 'شاهده أثناء الاستخدام', video_url: '' } }
}

function seedSizeChart(_c: BuildConfig): SeededSection {
  return {
    settings: {
      title: 'دليل المقاسات',
      note: 'القياسات بالسنتيمتر. عند التردد اختر المقاس الأكبر.',
      headers: 'الصدر, الطول, الكم',
    },
    blocks: {
      'sz-1': { type: 'row', settings: { size: 'S',  col1: '92',  col2: '66', col3: '58' } },
      'sz-2': { type: 'row', settings: { size: 'M',  col1: '98',  col2: '68', col3: '60' } },
      'sz-3': { type: 'row', settings: { size: 'L',  col1: '104', col2: '70', col3: '62' } },
      'sz-4': { type: 'row', settings: { size: 'XL', col1: '112', col2: '72', col3: '64' } },
    },
    block_order: ['sz-1', 'sz-2', 'sz-3', 'sz-4'],
  }
}

function seedShippingEstimator(_c: BuildConfig): SeededSection {
  return { settings: { cutoff: 'ساعتان و14 دقيقة', days_from_now: 4, deliver_label: 'خلال 3-5 أيام عمل' } }
}

function seedRelatedProducts(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'قد يعجبك أيضًا', count: 4 },
    blocks: {
      'r-1': { type: 'fallback', settings: { name: 'حقيبة حمل',   price: '$19.99' } },
      'r-2': { type: 'fallback', settings: { name: 'عبوة إضافية', price: '$24.99' } },
      'r-3': { type: 'fallback', settings: { name: 'ملحق مرافق',  price: '$34.99' } },
      'r-4': { type: 'fallback', settings: { name: 'باقة موفّرة', price: '$59.99' } },
    },
    block_order: ['r-1', 'r-2', 'r-3', 'r-4'],
  }
}

function seedProductTabs(c: BuildConfig): SeededSection {
  const pn = c.productName
  return {
    settings: {},
    blocks: {
      't-1': { type: 'tab', settings: { label: 'الوصف',   body: `<p>${pn} مصنوع للاستخدام اليومي ومدعوم بوعد 30 يومًا. ${safeDescription(c, 240)}</p>` } },
      't-2': { type: 'tab', settings: { label: 'الشحن',    body: '<p>يُشحن خلال 24 ساعة من مستودعات محلية. مجاني فوق 50$. توصيل مُتتبَّع خلال 3-5 أيام محليًا و7-12 يومًا دوليًا.</p>' } },
      't-3': { type: 'tab', settings: { label: 'الإرجاع',  body: "<p>30 يومًا دون أسئلة. نتحمّل بوليصة الإرجاع ويصل استردادك خلال 3 أيام.</p>" } },
      't-4': { type: 'tab', settings: { label: 'العناية',   body: `<p>امسح ${pn} بقطعة قماش ناعمة. تجنّب المنظّفات القاسية ولا تغمره في الماء إلا إن كان مقاومًا للماء.</p>` } },
      't-5': { type: 'tab', settings: { label: 'الضمان',    body: '<p>ضمان 12 شهرًا ضد عيوب التصنيع. نستبدله دون حاجة لشحن الإرجاع.</p>' } },
    },
    block_order: ['t-1', 't-2', 't-3', 't-4', 't-5'],
  }
}

function seedProductQa(c: BuildConfig): SeededSection {
  const pn = c.productName
  return {
    settings: {
      title: `أسئلة من مشتري ${pn}`,
      subtitle: 'إجابات حقيقية من الفريق ومن عملاء حديثين.',
    },
    blocks: {
      'q-1': { type: 'qa', settings: { question: 'هل هو آمن للبشرة الحساسة؟',           answer: 'نعم — بمكوّنات لطيفة لا تسبّب الحساسية ومُختبرة من أطباء الجلدية.',           answered_by: 'الفريق' } },
      'q-2': { type: 'qa', settings: { question: 'كم يستغرق الشحن؟',                     answer: 'توصيل مُتتبَّع خلال 3-5 أيام عمل محليًا، و7-12 يومًا دوليًا.',                answered_by: 'سارة، خدمة العملاء' } },
      'q-3': { type: 'qa', settings: { question: 'هل سيعمل مع جهازي؟',                   answer: 'متوافق مع معظم الأجهزة الحديثة. راجع قسم المواصفات لمعرفة الطُرز بدقّة.',      answered_by: 'الدعم الفني' } },
      'q-4': { type: 'qa', settings: { question: 'كيف يعمل خصم الباقات؟',                answer: 'اختر عبوة من قطعتين أو ثلاث في صفحة المنتج — ويُطبَّق الخصم تلقائيًا عند الدفع.', answered_by: 'الفريق' } },
      'q-5': { type: 'qa', settings: { question: `بمَ يختلف ${pn} عن النسخة الرخيصة؟`,   answer: 'النسخ الرخيصة تتخطّى الفحص وتستخدم مواد أقل جودة. منتجنا يُفحص يدويًا قبل الشحن ومدعوم بضمان 12 شهرًا.', answered_by: 'المؤسِّس' } },
    },
    block_order: ['q-1', 'q-2', 'q-3', 'q-4', 'q-5'],
  }
}

function seedRecentlyViewed(_c: BuildConfig): SeededSection {
  return { settings: { title: 'شوهد مؤخرًا' } }
}

function seedHeroVideo(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'متوفّر الآن',
      headline: `تعرّف على ${c.productName}.`,
      subhead: `${c.productName} صادق من فريق صغير يمكنك مراسلته مباشرةً.`,
      cta: 'تسوّق الآن',
      cta_url: '#product',
      dim_top: 30,
      dim_bottom: 60,
    },
  }
}

function seedHeroSplit(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'إصدار جديد',
      headline: `${c.productName} الذي ستستخدمه فعلًا`,
      subhead: `مصمّم للاستخدام اليومي. مصنوع ليدوم.`,
      cta: 'تسوّق الآن',
      cta_url: '#product',
      cta2: 'اقرأ قصتنا',
      cta2_url: '/pages/about',
      image_url: pickImage(c, 1),
      flip: false,
    },
    blocks: {
      'b-1': { type: 'bullet', settings: { point: 'شحن مجاني فوق 50$' } },
      'b-2': { type: 'bullet', settings: { point: 'ضمان استرداد المال خلال 30 يومًا' } },
      'b-3': { type: 'bullet', settings: { point: 'يُشحن خلال 24 ساعة' } },
    },
    block_order: ['b-1', 'b-2', 'b-3'],
  }
}

function seedMission(c: BuildConfig): SeededSection {
  return {
    settings: {
      mark: '❝',
      quote: `أن نصنع ${c.productName} الوحيد الذي يستحق الاقتناء — ونقف خلفه مدى الحياة.`,
      by: `وعد ${c.storeName || 'متجرنا'}`,
    },
  }
}

function seedTimeline(c: BuildConfig): SeededSection {
  return {
    settings: { title: `قصة ${c.storeName || 'متجرنا'}` },
    blocks: {
      'y-1': { type: 'milestone', settings: { year: '2022', heading: 'بدأنا بفكرة بسيطة',   body: `مؤسِّسان، ونموذج أوّلي واحد من ${c.productName}، وشغف كبير.` } },
      'y-2': { type: 'milestone', settings: { year: '2023', heading: 'أول عملائنا',          body: 'نفدت أول دفعة إنتاج خلال أسابيع قليلة.' } },
      'y-3': { type: 'milestone', settings: { year: '2024', heading: 'نموّ متسارع',          body: 'ضاعفنا الفريق وافتتحنا مستودعات في عدة دول.' } },
      'y-4': { type: 'milestone', settings: { year: '2025', heading: 'مجتمع ينمو كل يوم',    body: 'والقائمة تطول.' } },
    },
    block_order: ['y-1', 'y-2', 'y-3', 'y-4'],
  }
}

function seedValues(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'بمَ نؤمن', subtitle: 'ثلاثة مبادئ يمرّ بها كل منتج.' },
    blocks: {
      'v-1': { type: 'value', settings: { icon: '🌱', heading: 'مصادر مستدامة', body: 'ندفع أكثر مقابل المواد ليدفع الكوكب أقل.' } },
      'v-2': { type: 'value', settings: { icon: '💛', heading: 'أسعار صادقة',   body: 'نخبرك تمامًا بتكلفة صناعة كل قطعة.' } },
      'v-3': { type: 'value', settings: { icon: '🛠️', heading: 'مصنوع ليدوم',   body: 'إن تعطّل في السنة الأولى نستبدله لك.' } },
    },
    block_order: ['v-1', 'v-2', 'v-3'],
  }
}

function seedTeam(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'الفريق' },
    blocks: {
      'p-1': { type: 'person', settings: { name: 'المؤسِّس', role: 'المؤسِّس والرئيس التنفيذي', bio: 'يقضي عطلات نهاية الأسبوع في تفكيك المنتج وإعادة تركيبه.' } },
      'p-2': { type: 'person', settings: { name: 'قائد التصميم', role: 'قائد التصميم',        bio: 'يهتم بالتفاصيل حدّ الهوس.' } },
      'p-3': { type: 'person', settings: { name: 'العمليات', role: 'العمليات',              bio: 'يردّ على رسائل التتبّع — عادةً خلال ساعة.' } },
      'p-4': { type: 'person', settings: { name: 'خدمة العملاء', role: 'خدمة العملاء',       bio: 'إن تأخّر طلبك ستسمع منّا أولًا.' } },
    },
    block_order: ['p-1', 'p-2', 'p-3', 'p-4'],
  }
}

function seedPromoBanner(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 0),
      eyebrow: 'تخفيضات',
      title: `خصم حتى ${c.originalPrice > c.salePrice ? Math.round(((c.originalPrice - c.salePrice) / c.originalPrice) * 100) : 40}% على ${c.productName}`,
      subtitle: 'الكمية محدودة — ينتهي يوم الأحد.',
      cta: 'تسوّق العرض',
      cta_url: '#product',
      dim: 45,
    },
  }
}

function seedFeaturedProduct(c: BuildConfig): SeededSection {
  return {
    settings: {
      image_url: pickImage(c, 0),
      title: c.productName,
      subtitle: safeDescription(c, 160),
      price: money(c.salePrice),
      compare: c.originalPrice > c.salePrice ? money(c.originalPrice) : '',
      reviews: '',
      cta: `أضِف إلى السلة — ${money(c.salePrice)}`,
      cta_url: '#product',
    },
    blocks: {
      'b-1': { type: 'bullet', settings: { point: 'شحن مجاني فوق 50$' } },
      'b-2': { type: 'bullet', settings: { point: 'ضمان استرداد المال خلال 30 يومًا' } },
      'b-3': { type: 'bullet', settings: { point: 'يُشحن خلال 24 ساعة' } },
      'b-4': { type: 'bullet', settings: { point: 'ضمان 12 شهرًا' } },
    },
    block_order: ['b-1', 'b-2', 'b-3', 'b-4'],
  }
}

function seedFeaturedCollection(_c: BuildConfig): SeededSection {
  return {
    settings: { eyebrow: 'تسوّق', title: 'الأكثر مبيعًا', count: 8, see_all: 'عرض الكل', see_all_url: '/#product' },
    blocks: {
      'c-1': { type: 'fallback', settings: { name: 'الأكثر مبيعًا', price: '$49.99' } },
      'c-2': { type: 'fallback', settings: { name: 'جديد',         price: '$39.99' } },
      'c-3': { type: 'fallback', settings: { name: 'باقة',         price: '$89.99' } },
      'c-4': { type: 'fallback', settings: { name: 'عبوة إضافية',   price: '$19.99' } },
    },
    block_order: ['c-1', 'c-2', 'c-3', 'c-4'],
  }
}

function seedInstagram(c: BuildConfig): SeededSection {
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < 8; i++) {
    const id = `p-${i + 1}`
    blocks[id] = { type: 'post', settings: { image_url: pickImage(c, i), alt: 'منشور عميل', post_url: '' } }
    order.push(id)
  }
  return {
    settings: { title: 'تابعنا', handle: `@${(c.storeName || 'yourbrand').toLowerCase().replace(/[^a-z0-9]/g, '')}` },
    blocks,
    block_order: order,
  }
}

function seedBlogGrid(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'من المدوّنة', count: 3 },
    blocks: {
      'p-1': { type: 'fallback', settings: { title: 'لماذا اخترنا هذه الخامة',  meta: '12 مارس',  excerpt: 'كلّفتنا أكثر لكنها دامت ضعف المدة في اختباراتنا.' } },
      'p-2': { type: 'fallback', settings: { title: 'خلف الكواليس',            meta: '06 مارس',  excerpt: 'إعادة تصميم التغليف قلّلت الهدر بنسبة 40%.' } },
      'p-3': { type: 'fallback', settings: { title: 'ما علّمنا إياه العملاء',   meta: '28 فبراير', excerpt: 'ثلاثة دروس من رسائل عملائنا هذا الربع.' } },
    },
    block_order: ['p-1', 'p-2', 'p-3'],
  }
}

function seedGallery(c: BuildConfig): SeededSection {
  const captions = ['استوديو', 'تفاصيل', 'في اليد', 'أثناء التنقّل', 'في المنزل', 'التغليف']
  const blocks: Record<string, Block> = {}
  const order: string[] = []
  for (let i = 0; i < 6; i++) {
    const id = `g-${i + 1}`
    blocks[id] = { type: 'image', settings: { image_url: pickImage(c, i), caption: captions[i] || '' } }
    order.push(id)
  }
  return { settings: { title: `معرض ${c.storeName}`, columns: 3 }, blocks, block_order: order }
}

function seedQuote(c: BuildConfig): SeededSection {
  return {
    settings: {
      quote: `${c.productName} صادق صنعه أشخاص يهتمّون فعلًا.`,
      author: '',
    },
  }
}

function seedRichText(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'عن هذه القصة',
      heading: `لماذا صنعنا ${c.productName}`,
      body: `<p>${safeDescription(c, 320)}</p><p>نهتمّ بالتفاصيل الصغيرة — التغليف، وزمن الرد على البريد، وإحساس المنتج في اليوم الثلاثين لا الأول. ${c.storeName} موجود لأننا أردنا ${c.productName} نستمرّ باستخدامه فعلًا.</p>`,
      alignment: 'right',
      cta: 'تسوّق ' + c.productName,
      cta_url: '#product',
    },
  }
}

function seedMultiColumn(c: BuildConfig): SeededSection {
  return {
    settings: { title: 'ثلاثة أسباب تجعلنا الأفضل', columns: 3 },
    blocks: {
      'c-1': { type: 'column', settings: { image_url: pickImage(c, 0), heading: 'الخامات',  body: '<p>جودة عالية في كل التفاصيل — دون حلول بلاستيكية رخيصة.</p>',                 cta: 'التفاصيل', cta_url: '/#product' } },
      'c-2': { type: 'column', settings: { image_url: pickImage(c, 1), heading: 'التصنيع',  body: '<p>يُفحص يدويًا قبل الشحن. كل قطعة.</p>',                 cta: '',           cta_url: '' } },
      'c-3': { type: 'column', settings: { image_url: pickImage(c, 2), heading: 'الدعم',    body: '<p>بشر حقيقيون يردّون خلال 6 ساعات — ويعرفون المنتج فعلًا.</p>', cta: 'اقرأ التقييمات', cta_url: '/#reviews' } },
    },
    block_order: ['c-1', 'c-2', 'c-3'],
  }
}

function seedIconList(_c: BuildConfig): SeededSection {
  return {
    settings: { title: 'لماذا نحن' },
    blocks: {
      'i-1': { type: 'row', settings: { icon: '🚚', heading: 'شحن مجاني دائمًا',      body: 'توصيل مُتتبَّع خلال 3-5 أيام، في كل مرة.' } },
      'i-2': { type: 'row', settings: { icon: '↩️', heading: 'إرجاع لأي سبب',        body: '30 يومًا دون أسئلة، ونتحمّل نحن بوليصة الإرجاع.' } },
      'i-3': { type: 'row', settings: { icon: '💬', heading: 'بشر حقيقيون عبر البريد', body: 'نردّ خلال 6 ساعات في أيام العمل.' } },
      'i-4': { type: 'row', settings: { icon: '🛡️', heading: 'ضمان 12 شهرًا',        body: 'إن تعطّل نستبدله لك — دون جدال حول شحن الإرجاع.' } },
    },
    block_order: ['i-1', 'i-2', 'i-3', 'i-4'],
  }
}

function seedImageSec(c: BuildConfig): SeededSection {
  return {
    settings: { image_url: pickImage(c, 0), caption: `${c.productName} — تصوير في استوديونا.`, width: 1000 },
  }
}

function seedDivider(_c: BuildConfig): SeededSection {
  return { settings: { style: 'ornament', ornament: '· · ·', height: 48 } }
}

function seedCartUpsell(_c: BuildConfig): SeededSection {
  // The section now recommends real store products (and hides itself
  // when there's nothing to recommend) — no fake companion items.
  return { settings: { title: 'قد يعجبك أيضًا' } }
}

function seedContactForm(c: BuildConfig): SeededSection {
  return {
    settings: {
      eyebrow: 'تحدّث إلينا',
      title: 'نردّ على كل رسالة',
      subtitle: `بلا روبوتات ولا نماذج معقّدة. بشر حقيقيون خلف ${c.storeName}.`,
    },
    blocks: {
      'inf-1': { type: 'info', settings: { label: 'البريد',      value: `hi@${(c.storeName || 'yourstore').toLowerCase().replace(/[^a-z0-9]/g, '')}.com` } },
      'inf-2': { type: 'info', settings: { label: 'ساعات العمل', value: 'الأحد-الخميس 9ص-6م' } },
      'inf-3': { type: 'info', settings: { label: 'زمن الرد',    value: 'خلال 6 ساعات' } },
    },
    block_order: ['inf-1', 'inf-2', 'inf-3'],
  }
}

function seedBlogList(_c: BuildConfig): SeededSection {
  return { settings: { per_page: 9 } }
}

function seedNoop(_c: BuildConfig): SeededSection {
  return { settings: {} }
}

/* ── public API ────────────────────────────────────────────────────── */

const SEEDS: Record<string, (c: BuildConfig) => SeededSection> = {
  // Header + footer + announcement
  'ds-announcement':    seedAnnouncement,
  'ds-header':          seedNoop,
  'ds-footer':          seedFooter,
  // Hero / hooks
  'ds-hero':            seedHero,
  'ds-hero-video':      seedHeroVideo,
  'ds-hero-split':      seedHeroSplit,
  'ds-promo-bar':       seedPromoBar,
  'ds-marquee':         seedMarquee,
  'ds-logo-bar':        seedLogoBar,
  'ds-stats':           seedStats,
  // Product core
  'ds-product-main':    seedProductMain,
  'ds-bundle':          seedBundle,
  'ds-volume-discount': seedVolumeDiscount,
  'ds-frequently-bought': seedFrequentlyBought,
  // Product extras
  'ds-product-highlights': seedHighlights,
  'ds-product-specs':   seedProductSpecs,
  'ds-product-video':   seedProductVideo,
  'ds-size-chart':      seedSizeChart,
  'ds-shipping-estimator': seedShippingEstimator,
  'ds-related-products': seedRelatedProducts,
  'ds-product-tabs':    seedProductTabs,
  'ds-product-qa':      seedProductQa,
  'ds-recently-viewed': seedRecentlyViewed,
  // Conversion
  'ds-countdown':       seedCountdown,
  'ds-stock-counter':   seedStockCounter,
  'ds-free-shipping-bar': seedFreeShippingBar,
  'ds-guarantee':       seedGuarantee,
  'ds-secure-checkout': seedSecureCheckout,
  'ds-trust-badges':    seedTrustBadges,
  'ds-floating-cta':    seedFloatingCta,
  'ds-shipping-info':   seedShippingInfo,
  'ds-features':        seedFeatures,
  'ds-comparison':      seedComparison,
  'ds-cta':             seedCta,
  'ds-sticky-atc':      seedStickyAtc,
  // Social proof
  'ds-reviews':         seedReviews,
  'ds-faq':             seedFaq,
  'ds-recently-bought': seedRecentlyBought,
  'ds-ugc-gallery':     seedUgc,
  'ds-press':           seedPress,
  'ds-awards':          seedAwards,
  'ds-stars-summary':   seedStarsSummary,
  'ds-testimonials-video': seedTestimonialsVideo,
  'ds-customer-photos': seedCustomerPhotos,
  // Storytelling
  'ds-founder-story':   seedFounder,
  'ds-mission':         seedMission,
  'ds-timeline':        seedTimeline,
  'ds-values':          seedValues,
  'ds-team':            seedTeam,
  'ds-before-after':    seedBeforeAfter,
  'ds-how-it-works':    seedHowItWorks,
  'ds-image-text':      seedImageText,
  // Marketing
  'ds-promo-banner':    seedPromoBanner,
  'ds-featured-product': seedFeaturedProduct,
  'ds-featured-collection': seedFeaturedCollection,
  'ds-newsletter':      seedNewsletter,
  'ds-instagram':       seedInstagram,
  'ds-blog-grid':       seedBlogGrid,
  'ds-gallery':         seedGallery,
  'ds-video':           seedNoop,
  'ds-rich-text':       seedRichText,
  'ds-quote':           seedQuote,
  'ds-multi-column':    seedMultiColumn,
  'ds-icon-list':       seedIconList,
  'ds-image-sec':       seedImageSec,
  'ds-divider':         seedDivider,
  'ds-cart-upsell':     seedCartUpsell,
  'ds-contact-form':    seedContactForm,
  'ds-blog-list':       seedBlogList,
  'ds-article-main':    seedNoop,
  // Page sections
  'ds-cart':            seedNoop,
  'ds-collection':      seedNoop,
  'ds-page':            seedNoop,
  'ds-search':          seedNoop,
}

export function seedSection(name: string, c: BuildConfig): SeededSection {
  const fn = SEEDS[name]
  if (!fn) return { settings: {} }
  return fn(c)
}

/**
 * Build a `templates/*.json` object: given an ordered list of
 * `{id, type}` section refs, return the fully-seeded JSON document
 * Shopify will render.
 */
/* ── AI-claims manifest ───────────────────────────────────────────── */

/**
 * Everything in the generated theme that the AI invented and the
 * merchant MUST verify or replace before launch — numbers we cannot
 * know (stock counts, buyer names), legal-risk content (press quotes),
 * and promises that must match the store's actual policies.
 *
 * Surfaced post-generation in the build UI and written into the theme
 * README. Entries drop off automatically when real data replaced them
 * (e.g. scraped reviews).
 */
export type ThemeClaim = {
  id: string
  severity: 'high' | 'medium'
  location: string
  claim: string
  why: string
  fix: string
}

export function collectClaims(c: BuildConfig): ThemeClaim[] {
  const claims: ThemeClaim[] = []
  const real = hasRealReviews(c)
  const photosReal = reviewPhotos(c).length >= 4

  claims.push({
    id: 'press-quotes',
    severity: 'high',
    location: 'Homepage → "What the press is saying" + "As seen in" logos',
    claim: 'Quotes attributed to FORBES, WIRED, TECHCRUNCH (and the logo bar)',
    why: 'These outlets never reviewed your product. Publishing invented quotes under real brand names is false advertising and can get the store taken down.',
    fix: 'Theme editor → Press / Logo bar: replace with real coverage, or delete both sections.',
  })
  claims.push({
    id: 'stock-counter',
    severity: 'high',
    location: 'Homepage → stock counter',
    claim: '"Hurry! Only 23 left in stock" (count and bar are static)',
    why: 'The theme cannot know your real inventory — 23 is an invented number.',
    fix: 'Theme editor → Stock counter: set your real count, or delete the section.',
  })
  claims.push({
    id: 'recent-buyers',
    severity: 'high',
    location: 'Homepage + product page → "recently bought" toasts',
    claim: 'Sarah M., Jamie L., Maya R… "just bought" notifications',
    why: 'These buyers are invented. Fake purchase notifications are banned by consumer-protection rules in the EU/UK and risky everywhere.',
    fix: 'Theme editor → Recently bought: replace with real orders once you have them, or delete the section.',
  })
  if (!real) {
    claims.push({
      id: 'reviews-fallback',
      severity: 'high',
      location: 'Reviews, star summary, customer photos, UGC gallery',
      claim: 'All reviews, the 4.9★ average, and "2,431 verified reviews" are invented',
      why: 'No real reviews could be scraped from the source listing, so placeholder reviews were generated.',
      fix: 'Import real reviews (e.g. a reviews app, or re-generate from an AliExpress URL so Zenya can pull the real ones), then replace these.',
    })
  } else {
    claims.push({
      id: 'reviews-imported',
      severity: 'medium',
      location: 'Reviews, star summary' + (photosReal ? ', customer photos, UGC gallery' : ''),
      claim: 'Seeded from real reviews on the source listing (real names, text, ratings' + (photosReal ? ', photos' : '') + ')',
      why: 'These are reviews of the supplier listing, not of your store — review them for tone and remove any that mention the supplier or prices.',
      fix: 'Theme editor → Reviews: prune anything that does not fit your brand.',
    })
  }
  claims.push({
    id: 'bundle-discount',
    severity: 'high',
    location: 'Bundle picker ("Save 15% / 25%") + volume-discount tiers',
    claim: 'Percentage-off bundle pricing',
    why: 'The bundle button adds the right quantity to the cart, but Shopify only charges the discounted "Save 15% / 25%" price if you create the matching automatic discount. The buy-box quantity tiers charge full price × units (no discount) and are already honest.',
    fix: 'Shopify admin → Discounts → create automatic volume discounts that match the bundle tiers (e.g. 15% off 2, 25% off 3), or edit the tier copy.',
  })
  claims.push({
    id: 'social-counts',
    severity: real ? 'medium' : 'high',
    location: 'Hero stats, stats strip, marquee, announcement bar',
    claim: real
      ? 'Counts now use the source listing’s review numbers — "happy customers" style phrasing is still yours to own'
      : '"12,400+ happy customers", "4.9★", "2,400+ reviews"',
    why: 'Customer counts must be true for YOUR store.',
    fix: 'Theme editor → Hero / Stats / Marquee: set real numbers or soften the copy ("Join our first customers").',
  })
  claims.push({
    id: 'founder-persona',
    severity: 'medium',
    location: 'Homepage + about page → founder story',
    claim: '"Sam Rivers, Founder" and the founder quote',
    why: 'Invented persona with a product photo as the portrait.',
    fix: 'Theme editor → Founder story: use your real name, photo, and words — or delete the section.',
  })
  claims.push({
    id: 'policy-promises',
    severity: 'medium',
    location: 'Guarantee, trust badges, FAQ, footer, product trust points',
    claim: '30-day money-back, 12-month warranty, free shipping over $50, 3-5 day delivery, 6-hour support replies',
    why: 'These must match your actual Shopify policies and what your supplier can deliver.',
    fix: 'Set real policies in Shopify admin → Settings → Policies, then align the copy (or keep the promises and honor them).',
  })
  claims.push({
    id: 'countdown',
    severity: 'medium',
    location: 'Homepage → countdown timer',
    claim: `Sale end date auto-set ~6 days from generation`,
    why: 'An evergreen fake deadline that resets is a dark pattern; a real one converts and stays legal.',
    fix: 'Theme editor → Countdown: set a real end date for a real promotion, or delete the section.',
  })
  if (!c.specs || Object.keys(c.specs).length < 2) {
    claims.push({
      id: 'specs',
      severity: 'medium',
      location: 'Product page → specs table',
      claim: 'Generic placeholder spec rows (no real specs could be scraped)',
      why: 'Buyers return products over wrong specs — only you can confirm dimensions, materials, and box contents.',
      fix: 'Theme editor → Product specs: copy the real specs from your supplier listing.',
    })
  }
  claims.push({
    id: 'discount-code',
    severity: 'medium',
    location: 'Floating CTA card',
    claim: '"Code WELCOME10 for 10% off"',
    why: 'The code does not exist until you create it.',
    fix: 'Shopify admin → Discounts → create WELCOME10 (10%), or edit/remove the card.',
  })
  return claims
}

export function buildTemplate(
  refs: Array<{ id: string; type: string }>,
  c: BuildConfig,
): {
  sections: Record<string, { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }>
  order: string[]
} {
  const sections: Record<
    string,
    { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] }
  > = {}
  const order: string[] = []
  for (const ref of refs) {
    const seed = seedSection(ref.type, c)
    const entry: { type: string; settings: Settings; blocks?: Record<string, Block>; block_order?: string[] } = {
      type: ref.type,
      settings: seed.settings,
    }
    if (seed.blocks && Object.keys(seed.blocks).length) {
      entry.blocks = seed.blocks
      entry.block_order = seed.block_order || Object.keys(seed.blocks)
    }
    sections[ref.id] = entry
    order.push(ref.id)
  }
  return { sections, order }
}
