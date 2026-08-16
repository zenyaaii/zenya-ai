/**
 * English editorial for /en/why/[type] — one article per Zenya template.
 *
 * These are NOT translations of app/(main)/why/[type]/copy.ts. English and
 * Arabic search intent differ, so each article is written natively against
 * English keywords. What IS carried over unchanged is every statistic and its
 * named source: those are real, publicly-cited numbers, and the project rule
 * is that no figure is ever invented. If you cannot cite it, do not print it.
 */

export type ArticleStatEn = {
  /** e.g. "50 ms", "88%", "5x" */
  figure: string
  /** Short phrase after the figure. */
  label: string
  /** Source institution, cited inline so nothing reads as fabricated. */
  source: string
}

export type ArticleSectionEn = {
  id: string
  title: string
  paragraphs: string[]
}

export type ArticleEn = {
  key: 'restaurant' | 'one_product' | 'atlas' | 'lookbook' | 'collective' | 'studio' | 'services' | 'wellness'
  /** URL slug under /en/why/. */
  slug: string
  templateName: string
  category: string
  demoHref: string
  buildHref: string
  hero: { kicker: string; h1: string; lead: string }
  sections: ArticleSectionEn[]
  stats: ArticleStatEn[]
  checklist: string[]
  meta: { title: string; description: string; keywords: string[] }
}

const restaurant: ArticleEn = {
  key: 'restaurant',
  slug: 'restaurant',
  templateName: 'Restaurant',
  category: 'Restaurants · cafes · hospitality',
  demoHref: '/demo/restaurant',
  buildHref: '/theme/new/restaurant',
  hero: {
    kicker: 'Zenya guide · Restaurant template',
    h1: 'Why your restaurant needs a proper website in 2026',
    lead: 'More than three quarters of guests look your restaurant up online before deciding to come in. The website is not marketing decoration. It is the first table your guest sits at, and the meal starts there.',
  },
  sections: [
    {
      id: 'first-impression',
      title: 'The first impression takes 50 milliseconds',
      paragraphs: [
        'Research led by Gitte Lindgaard at Carleton University found that visitors form an opinion of a website in about 50 milliseconds, before they have read a word of your menu or seen a single dish. That snap visual judgement decides whether they keep browsing or go back to Google and pick a different restaurant.',
        'This is why a template built for restaurants beats a general-purpose page. Large food photography, a legible menu, and an obvious way to book are not styling choices. They are the three things a hungry person is looking for, and they need to be visible before any scrolling happens.',
      ],
    },
    {
      id: 'the-menu-is-the-product',
      title: 'Your menu is the product page',
      paragraphs: [
        'A PDF menu that takes ten seconds to open on a phone, or a photo of a printed menu that has to be pinch-zoomed, loses the booking. A real menu is text on the page: searchable by Google, readable at any screen size, and editable when a price changes or a dish comes off.',
        'Sections matter too. Guests scan by category, not top to bottom, so a tabbed menu with starters, mains, and drinks lets someone check in seconds whether you have what they want. That check is the actual decision point.',
      ],
    },
    {
      id: 'being-found',
      title: 'Being found is half the work',
      paragraphs: [
        'Most restaurant discovery still starts in search, and a site that states your hours, address, and cuisine in crawlable text is what lets Google answer "open now near me" with your name in it. Social profiles alone do not do this; they are rented ground that ranks for the platform, not for you.',
        'The same information does double duty for guests who already know you. Hours that are correct on a public holiday, a map link that opens the right pin, and a phone number that is tappable on mobile prevent the calls you do not want to receive.',
      ],
    },
  ],
  stats: [
    { figure: '50 ms', label: 'is all a visitor needs to form a first impression of your site', source: 'Lindgaard et al., Carleton University' },
    { figure: '77%', label: 'of guests open a restaurant menu online before visiting', source: 'TripAdvisor Restaurant Report' },
    { figure: '75%', label: 'of users judge a business’s credibility from its website design', source: 'Stanford Web Credibility Project' },
    { figure: '87%', label: 'of consumers use Google to evaluate local businesses', source: 'BrightLocal Local Consumer Review Survey' },
  ],
  checklist: [
    'High-resolution food photography that works on mobile',
    'An up-to-date menu with no errors',
    'A booking flow you tested before publishing',
    'Clearly stated opening hours',
    'A Google map pin at your actual location',
    'A direct WhatsApp or phone link',
  ],
  meta: {
    title: 'Why your restaurant needs a website in 2026 | Zenya',
    description:
      'A digital menu, a booking flow, and the chef story, with real figures from TripAdvisor, Stanford, and BrightLocal on why a professional restaurant website earns its keep.',
    keywords: ['restaurant website design', 'restaurant website template', 'online restaurant menu', 'restaurant booking website', 'restaurant marketing'],
  },
}

const one_product: ArticleEn = {
  key: 'one_product',
  slug: 'one-product-store',
  templateName: 'Storefront',
  category: 'Ecommerce · single product',
  demoHref: '/demo',
  buildHref: '/build',
  hero: {
    kicker: 'Zenya guide · Storefront template',
    h1: 'Why a one-product store outsells a general shop',
    lead: 'Seven in ten carts are abandoned. A page that sells one thing, and answers every objection to that one thing, does not give the visitor a reason to wander off.',
  },
  sections: [
    {
      id: 'focus-converts',
      title: 'Focus is the conversion mechanism',
      paragraphs: [
        'A general storefront asks the visitor to choose. Every extra option is a decision, and every decision is a chance to leave and "think about it". A single-product page removes that branch entirely: there is one thing, one price, one button, and the only remaining question is yes or no.',
        'That is why the structure of the page matters more than the styling. A sales path that moves from problem, to product, to proof, to objections, to the offer, is doing the job a good salesperson would do in person.',
      ],
    },
    {
      id: 'speed-is-revenue',
      title: 'Speed is revenue, not a technical detail',
      paragraphs: [
        'Google and SOASTA found that 53% of mobile visitors leave if a page takes more than three seconds to load. Most of your traffic is mobile, and most of it arrives from an ad or a social link with low patience. A slow page loses the sale before the product is even seen.',
        'This is one of the strongest arguments for a purpose-built theme over a page assembled from a stack of plugins. Every extra script is loading time you are paying for in lost carts.',
      ],
    },
    {
      id: 'objections',
      title: 'Answer the objection where it appears',
      paragraphs: [
        'Shipping cost, return policy, sizing, delivery time, and "is this real" are the five things that stop a purchase. Burying them in a separate page means the visitor has to go looking, and looking is when they leave.',
        'Bundles, a comparison block, an FAQ, and a sticky add-to-cart put the answer next to the moment of doubt. The point is not to add sections; it is to remove the reason to open a new tab.',
      ],
    },
  ],
  stats: [
    { figure: '70.19%', label: 'is the average global cart abandonment rate', source: 'Baymard Institute' },
    { figure: '53%', label: 'of mobile visitors leave if loading takes more than 3 seconds', source: 'Google / SOASTA Research' },
    { figure: '5x', label: 'single-product stores convert multiples of a general page', source: 'Shopify Merchant Data' },
    { figure: '88%', label: 'of shoppers do not return after a bad user experience', source: 'Amazon Web Services UX Report' },
  ],
  checklist: [
    'One product, one price, one primary button',
    'Shipping and returns answered on the page',
    'Real product photography from several angles',
    'A sticky add-to-cart on mobile',
    'An FAQ covering the top five objections',
    'A checkout you have completed yourself end to end',
  ],
  meta: {
    title: 'Why a one-product store converts better | Zenya',
    description:
      'Cart abandonment, mobile load time, and objection handling: why a focused single-product Shopify storefront outperforms a general shop, with figures from Baymard, Google, and AWS.',
    keywords: ['one product store', 'single product shopify theme', 'ecommerce conversion rate', 'cart abandonment', 'shopify storefront'],
  },
}

const atlas: ArticleEn = {
  key: 'atlas',
  slug: 'app-landing-page',
  templateName: 'Atlas',
  category: 'Apps · software · B2B',
  demoHref: '/demo/atlas',
  buildHref: '/theme/new/atlas',
  hero: {
    kicker: 'Zenya guide · Atlas template',
    h1: 'Why your app needs a landing page, not an app-store link',
    lead: 'You get about five seconds to explain what your software does. An app-store listing does not give you those five seconds; a landing page you control does.',
  },
  sections: [
    {
      id: 'five-seconds',
      title: 'You have five seconds to be understood',
      paragraphs: [
        'The Nielsen Norman Group puts the window at roughly five seconds: that is how long a visitor spends deciding whether your product is relevant to them. If the headline is a slogan rather than a description, those seconds are spent guessing, and guessing ends in a closed tab.',
        'The fix is unglamorous. Say what the product does, for whom, and what changes after they use it, in the first screen, in plain language. Cleverness can come later, once they have decided to keep reading.',
      ],
    },
    {
      id: 'show-the-product',
      title: 'Show the interface, do not describe it',
      paragraphs: [
        'Software is abstract until it is visible. A screenshot of the actual product does more convincing than three paragraphs of feature copy, because it lets the visitor picture themselves using it and judge whether it looks like it was built with care.',
        'This is where design investment pays back measurably. Forrester’s work on the business case for UX found returns of up to 100x on money put into user experience, and the Adobe and McKinsey design index found design-led companies growing at about twice the market rate.',
      ],
    },
    {
      id: 'trust-signals',
      title: 'B2B buyers are checking whether you are real',
      paragraphs: [
        'A buyer evaluating software for their company is quietly asking whether you will still exist next year, whether their data is safe, and whether anyone else uses this. Pricing that is visible, integrations that are named, and a security section that says where data is hosted all answer those questions without a sales call.',
        'Hiding pricing to force a conversation filters out more good buyers than bad ones. If your price needs explaining, explain it on the page.',
      ],
    },
  ],
  stats: [
    { figure: '100x', label: 'return on each dollar invested in user experience', source: 'Forrester Research (The Business Case for UX)' },
    { figure: '2x', label: 'design-led companies grow at roughly twice the market rate', source: 'Adobe / McKinsey Design Index' },
    { figure: '5 seconds', label: 'is the time a user gives you to explain what the app does', source: 'Nielsen Norman Group' },
    { figure: '88%', label: 'of users do not return after a bad experience', source: 'Amazon Web Services UX Report' },
  ],
  checklist: [
    'A headline that describes, not slogans',
    'A real screenshot of the product above the fold',
    'Visible pricing, or an honest reason there is none',
    'Named integrations rather than generic logos',
    'A security and data-location section',
    'One primary call to action, repeated',
  ],
  meta: {
    title: 'Why your app needs a landing page | Zenya',
    description:
      'Five seconds to be understood, a visible product, and the trust signals B2B buyers check, with figures from Nielsen Norman Group, Forrester, and the Adobe/McKinsey design index.',
    keywords: ['app landing page', 'saas landing page', 'software marketing site', 'b2b landing page', 'app website template'],
  },
}

const lookbook: ArticleEn = {
  key: 'lookbook',
  slug: 'fashion-lookbook',
  templateName: 'Lookbook',
  category: 'Fashion · clothing · brands',
  demoHref: '/demo/lookbook',
  buildHref: '/theme/new/lookbook',
  hero: {
    kicker: 'Zenya guide · Lookbook template',
    h1: 'Why a fashion brand needs more than an Instagram grid',
    lead: 'Visuals are the deciding factor in most clothing purchases. A social grid shows the clothes; a lookbook site shows the brand, and only one of those you actually own.',
  },
  sections: [
    {
      id: 'visual-first',
      title: 'The image is the argument',
      paragraphs: [
        'Justuno’s survey of shoppers found 93% saying visual elements are the single most important factor in a purchase decision. In fashion this is not surprising: nobody buys a jacket from a specification list. They buy it because they can picture wearing it.',
        'That is a design requirement, not a photography one. Full-bleed editorial imagery, generous space, and typography that gets out of the way are what make clothes look considered instead of listed.',
      ],
    },
    {
      id: 'rented-land',
      title: 'Social platforms are rented land',
      paragraphs: [
        'An Instagram grid is discovery, not a home. The algorithm decides who sees it, the layout is identical to every competitor, and the account can be restricted or lost without appeal. Every follower you have is a relationship the platform brokers and can interrupt.',
        'A site you own is where the brand story, the sizing guide, the press coverage, and the email signup live together, on a page that looks like nobody else’s. Use social to reach people and the site to convert them.',
      ],
    },
    {
      id: 'credibility',
      title: 'Design is how a new brand borrows credibility',
      paragraphs: [
        'The Stanford Web Credibility Project found that roughly three quarters of credibility judgements come down to visual design. For an unknown label, that is the whole game: a shopper deciding whether to risk money on a brand they have never heard of is reading the design as evidence.',
        'Nielsen Norman Group has measured visually strong sites converting at close to two and a half times the rate of weak ones, and Adobe found 38% of visitors leaving immediately when a layout is unattractive. Looking finished is not vanity.',
      ],
    },
  ],
  stats: [
    { figure: '93%', label: 'of consumers say visuals are the top factor in a purchase decision', source: 'Justuno Visual Content Survey' },
    { figure: '75%', label: 'of brand credibility judgements come from website design', source: 'Stanford Web Credibility Project' },
    { figure: '2.6x', label: 'visually strong sites convert at roughly this multiple', source: 'Nielsen Norman Group' },
    { figure: '38%', label: 'of visitors leave immediately if the layout is unattractive', source: 'Adobe State of Content' },
  ],
  checklist: [
    'Full-width editorial photography, not catalogue crops',
    'A sizing guide that prevents returns',
    'The brand story on its own section',
    'An email signup that is worth signing up for',
    'Press or stockist mentions if you have them',
    'Fast image loading on mobile',
  ],
  meta: {
    title: 'Why a fashion brand needs a website | Zenya',
    description:
      'Visual decision-making, the risk of building on rented social land, and design as borrowed credibility, with figures from Justuno, Stanford, Nielsen Norman Group, and Adobe.',
    keywords: ['fashion brand website', 'fashion lookbook website', 'clothing brand site', 'fashion ecommerce template', 'lookbook design'],
  },
}

const collective: ArticleEn = {
  key: 'collective',
  slug: 'online-store',
  templateName: 'Collective',
  category: 'Catalogue · multi-product',
  demoHref: '/demo/collective',
  buildHref: '/theme/new/collective',
  hero: {
    kicker: 'Zenya guide · Collective template',
    h1: 'Why curation sells more than a bigger catalogue',
    lead: 'More choice does not mean more sales. The classic Columbia University study found the opposite, and a curated storefront is how you put that finding to work.',
  },
  sections: [
    {
      id: 'paradox-of-choice',
      title: 'The paradox of choice is measurable',
      paragraphs: [
        'Iyengar and Lepper’s Columbia University experiment is the reference point: a smaller, curated selection produced roughly six times the purchase rate of an overwhelming one. Shoppers faced with too many options do not choose more carefully. They stop choosing.',
        'A curated collections grid does the narrowing for them. Instead of 200 items in one wall, you present a handful of routes in, each one a smaller and more answerable decision.',
      ],
    },
    {
      id: 'discovery',
      title: 'Search and recommendation do the selling',
      paragraphs: [
        'Forrester found 43% of shoppers starting with the internal search box rather than browsing, which makes search quality a revenue feature rather than a convenience. If your search cannot find a product by an obvious synonym, that is a lost sale you never see.',
        'McKinsey attributes about 35% of Amazon’s sales to recommendation surfaces. You do not need Amazon’s engine to benefit from the principle: a "goes well with" row and a genuine best-sellers section put a second item in front of someone already holding a first.',
      ],
    },
    {
      id: 'same-session',
      title: 'The sale happens in the same session or not at all',
      paragraphs: [
        'Google Shopping data puts about 68% of purchase decisions in the same session the browsing started. The implication is blunt: a plan that depends on the visitor coming back later is mostly a plan to lose them.',
        'So the storefront has to carry the whole arc in one visit, from arrival to a reason to trust you to checkout, without asking anyone to create an account first.',
      ],
    },
  ],
  stats: [
    { figure: '6x', label: 'a curated selection lifts purchases versus an overwhelming grid', source: 'Iyengar & Lepper — Columbia University' },
    { figure: '35%', label: 'of Amazon sales come from recommendation surfaces', source: 'McKinsey Consumer Report' },
    { figure: '43%', label: 'of shoppers start with internal site search', source: 'Forrester Commerce Trends' },
    { figure: '68%', label: 'of purchase decisions happen in the same browsing session', source: 'Google Shopping Insights' },
  ],
  checklist: [
    'Collections curated by occasion, not just by category',
    'Internal search that handles synonyms',
    'A genuine best-sellers row, not a random one',
    'A clear brand promise on shipping and returns',
    'Guest checkout enabled',
    'Product photography consistent across the catalogue',
  ],
  meta: {
    title: 'Why curation beats a bigger catalogue | Zenya',
    description:
      'The paradox of choice, search and recommendation as revenue features, and same-session buying, with figures from Columbia University, McKinsey, Forrester, and Google.',
    keywords: ['online store website', 'multi product ecommerce', 'product catalogue site', 'curated storefront', 'ecommerce collections'],
  },
}

const studio: ArticleEn = {
  key: 'studio',
  slug: 'brand-story',
  templateName: 'Studio',
  category: 'Brand story · editorial',
  demoHref: '/demo/studio',
  buildHref: '/theme/new/studio',
  hero: {
    kicker: 'Zenya guide · Studio template',
    h1: 'Why your brand story is a commercial asset',
    lead: 'Most purchase decisions are emotional and justified afterwards. The story page is where that emotional case gets made, which makes it one of the most commercial pages you own.',
  },
  sections: [
    {
      id: 'trust-is-the-product',
      title: 'Trust is the thing being bought',
      paragraphs: [
        'The Edelman Trust Barometer finds 81% of consumers naming trust in a brand as a deciding purchase factor. For a company nobody has heard of, trust cannot be asserted. It has to be demonstrated, and a story with specifics is the cheapest demonstration available.',
        'Specifics are the whole trick. "Founded in 2019 in a rented kitchen in Amman" does work that "passionate about quality" never will, because only one of them could be checked.',
      ],
    },
    {
      id: 'emotion-decides',
      title: 'Emotion decides, logic justifies',
      paragraphs: [
        'Harvard Business Review puts roughly 55% of purchase decisions down to emotion rather than analysis. People buy the version of themselves the brand implies, then find a rational reason afterwards. Your story page supplies the first half.',
        'BuzzSumo’s content research found emotionally resonant content shared about twenty times more often. A story worth telling is also your cheapest distribution.',
      ],
    },
    {
      id: 'authenticity',
      title: 'Authenticity is a filter, not a decoration',
      paragraphs: [
        'Stackla’s consumer research found 86% of shoppers weighing authenticity when choosing between brands. Shoppers have become good at spotting stock-photo sincerity, and the penalty for being caught at it is worse than saying nothing.',
        'A founder letter in a real voice, a timeline with actual dates, and photographs of actual people beat any amount of polished copy about values.',
      ],
    },
  ],
  stats: [
    { figure: '81%', label: 'of consumers say brand trust is a deciding purchase factor', source: 'Edelman Trust Barometer' },
    { figure: '55%', label: 'of purchase decisions are driven by emotion, not logic', source: 'Harvard Business Review' },
    { figure: '20x', label: 'emotionally resonant content is shared far more often', source: 'BuzzSumo Content Study' },
    { figure: '86%', label: 'of shoppers say authenticity influences which brand they pick', source: 'Stackla Consumer Report' },
  ],
  checklist: [
    'A founder letter written in a real voice',
    'A timeline with actual dates',
    'Photographs of real people, not stock',
    'Values stated as things you do, not adjectives',
    'Press or community proof where it exists',
    'A clear next step at the end of the story',
  ],
  meta: {
    title: 'Why your brand story is a commercial asset | Zenya',
    description:
      'Trust, emotion, and authenticity as purchase drivers, and how to build a brand story page that earns them, with figures from Edelman, HBR, BuzzSumo, and Stackla.',
    keywords: ['brand story website', 'about us page design', 'brand storytelling', 'founder story page', 'editorial brand site'],
  },
}

const services: ArticleEn = {
  key: 'services',
  slug: 'services',
  templateName: 'Services',
  category: 'Local services · trades',
  demoHref: '/demo/services',
  buildHref: '/theme/new/services',
  hero: {
    kicker: 'Zenya guide · Services template',
    h1: 'Why local service businesses lose work without a website',
    lead: 'Most people searching for a local service visit a business within a day. If they cannot find you, or cannot tell whether you are any good, that visit goes to whoever they could find.',
  },
  sections: [
    {
      id: 'local-search',
      title: 'Local search is where the work comes from',
      paragraphs: [
        'BrightLocal’s consumer survey puts 87% of people using Google to evaluate local businesses, and Google’s own local search study found 76% of local searchers visiting a business within 24 hours. This is high-intent traffic: they are not researching, they are about to hire someone.',
        'Moz’s local ranking research shows businesses with a real website appearing in local results far more often. A social page or a directory listing alone leaves you dependent on someone else’s ranking rather than your own.',
      ],
    },
    {
      id: 'proof',
      title: 'Before-and-after is the proof that converts',
      paragraphs: [
        'HomeAdvisor’s consumer research found 68% of visitors treating before-and-after images as decisive when picking a provider. In trades, nobody is buying your description of the work. They are buying evidence that you have done it before, on a job that looks like theirs.',
        'This is the single highest-return section on a services site, and the one most often missing. Photographs of finished work, with a sentence about what the problem was, do more than any list of qualifications.',
      ],
    },
    {
      id: 'quote-path',
      title: 'Make the quote request effortless',
      paragraphs: [
        'The gap between interest and contact is where most service leads die. A form asking for twelve fields is a form that gets abandoned; a short request with a phone option and a stated response time is one that gets filled.',
        'Naming your service areas explicitly also saves everyone time. It stops enquiries you cannot serve and reassures the ones you can that you actually cover their street.',
      ],
    },
  ],
  stats: [
    { figure: '87%', label: 'of consumers use Google to evaluate local businesses', source: 'BrightLocal Local Consumer Review Survey' },
    { figure: '76%', label: 'of local searchers visit a business within 24 hours', source: 'Google Local Search Study' },
    { figure: '5x', label: 'local businesses with websites appear far more often in search', source: 'Moz Local SEO Ranking Factors' },
    { figure: '68%', label: 'of visitors call before-and-after photos decisive', source: 'HomeAdvisor Consumer Insights' },
  ],
  checklist: [
    'Before-and-after photographs of real jobs',
    'Service areas named explicitly',
    'A short quote form plus a phone option',
    'A stated response time you actually meet',
    'Reviews with names, not anonymous praise',
    'Licences or insurance stated if relevant',
  ],
  meta: {
    title: 'Why local service businesses need a website | Zenya',
    description:
      'Local search intent, before-and-after proof, and a quote path that converts, with figures from BrightLocal, Google, Moz, and HomeAdvisor.',
    keywords: ['local services website', 'contractor website', 'trades website design', 'service business marketing', 'local seo'],
  },
}

const wellness: ArticleEn = {
  key: 'wellness',
  slug: 'wellness',
  templateName: 'Wellness',
  category: 'Spa · yoga · wellness',
  demoHref: '/demo/wellness',
  buildHref: '/theme/new/wellness',
  hero: {
    kicker: 'Zenya guide · Wellness template',
    h1: 'Why online booking is the whole business for a wellness studio',
    lead: 'People book treatments on their phone, late, and they will not call. A studio without online booking is closed at exactly the moment its customers are deciding.',
  },
  sections: [
    {
      id: 'booking-is-the-product',
      title: 'The booking flow is the product',
      paragraphs: [
        'Mindbody’s industry reporting found automated booking lifting completion rates roughly threefold. That is not a marketing gain, it is a capacity gain: the same schedule, filled more often, with no one answering the phone.',
        'Salesforce found 81% of consumers preferring digital booking over calling. For a spa or studio, a phone-only booking process is not a personal touch. It is a filter that removes the customers who were ready to pay.',
      ],
    },
    {
      id: 'mobile-late',
      title: 'The decision happens on a phone, out of hours',
      paragraphs: [
        'Booksy’s consumer research puts 68% of wellness booking decisions on mobile. These are decisions made in the evening, in bed, in a gap between other things, and almost never during your opening hours.',
        'So the site has to work one-handed on a small screen: a session menu that is readable without zooming, a price next to each treatment, and a booking button that is never more than a thumb away.',
      ],
    },
    {
      id: 'gift-cards',
      title: 'Gift cards are revenue you are not collecting',
      paragraphs: [
        'Blackhawk Network’s research found digital gift cards growing at roughly twice the rate of physical ones. For wellness they are close to ideal: someone else pays, the recipient arrives predisposed to like you, and the cash arrives before the service is delivered.',
        'Selling them requires almost nothing beyond a page that explains the options and takes payment. It is one of the few additions that pays for itself in the first month.',
      ],
    },
  ],
  stats: [
    { figure: '3x', label: 'automated booking lifts booking completion', source: 'Mindbody Wellness Industry Report' },
    { figure: '68%', label: 'of wellness booking decisions are made on mobile', source: 'Booksy Consumer Report' },
    { figure: '81%', label: 'of consumers prefer digital booking over calling', source: 'Salesforce State of the Connected Customer' },
    { figure: '2x', label: 'digital gift cards grow at roughly twice the rate of physical', source: 'Blackhawk Network Study' },
  ],
  checklist: [
    'Online booking that works one-handed on mobile',
    'A session menu with prices next to treatments',
    'Instructor or therapist profiles',
    'A visible schedule',
    'Digital gift cards',
    'A cancellation policy stated up front',
  ],
  meta: {
    title: 'Why a wellness studio needs online booking | Zenya',
    description:
      'Booking completion, mobile out-of-hours decisions, and gift card revenue for spas and yoga studios, with figures from Mindbody, Booksy, Salesforce, and Blackhawk Network.',
    keywords: ['wellness studio website', 'spa website design', 'yoga studio booking', 'online booking website', 'salon booking site'],
  },
}

export const ARTICLES_EN: ArticleEn[] = [
  restaurant,
  one_product,
  atlas,
  lookbook,
  collective,
  studio,
  services,
  wellness,
]

export const ARTICLE_SLUGS_EN = ARTICLES_EN.map((a) => a.slug)

export function getArticleEn(slug: string): ArticleEn | undefined {
  return ARTICLES_EN.find((a) => a.slug === slug)
}
