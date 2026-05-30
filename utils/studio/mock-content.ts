import type { StudioContent } from './types'

export const STUDIO_MOCK_CONTENT: StudioContent = {
  brand: {
    name: 'ARCANA',
    tagline: 'Made by hand. Meant to last.',
    category: 'Artisan Homeware',
    founded: '2017'
  },
  hero: {
    eyebrow: 'Est. 2017 · Porto, Portugal',
    manifesto: 'Against the\ndisposable.',
    subheadline: 'We make objects that belong in your home for decades, not seasons. Each piece emerges from a process as old as the craft itself — hands, fire, time.',
    cta_primary: 'Discover the collection',
    cta_secondary: 'Read our story'
  },
  mission: {
    statement: 'We are building an argument against the disposable — one handmade object at a time.',
    elaboration: 'Every product we make is a quiet act of resistance. Against fast production. Against synthetic materials. Against the idea that beautiful things should be cheap and replaceable. We believe in the opposite: that the objects around you should earn their place slowly, improve with age, and outlast the trends that were supposed to replace them.'
  },
  founder_letter: {
    eyebrow: 'A letter from the founders',
    heading: 'We started with one question.',
    paragraphs: [
      'In 2016, my partner Lena and I moved into our first apartment together. We went looking for things to fill it with — things we\'d actually want to live around. We couldn\'t find them. Everything was either beautifully made and impossibly priced, or affordable and obviously temporary.',
      'We spent a year visiting workshops across Portugal, Spain, and Morocco — places where the old ways were still practiced, where potters and weavers and woodworkers were making things by hand with the same methods their grandparents had used. We found what we were looking for.',
      'ARCANA began as a collection of those objects. It has grown into something larger — a community of makers and a shared belief that the things in our homes should mean something. That they should be worth keeping.',
      'Every piece in our catalogue is made by a craftsperson we know by name, in a workshop we have visited. That is not a marketing line. It is the only way we know how to do this properly.'
    ],
    signature: 'Marco & Lena',
    signature_role: 'Co-founders, ARCANA'
  },
  timeline: {
    eyebrow: 'Our history',
    heading: 'Eight years of slow building.',
    events: [
      { year: '2017', title: 'First collection', description: 'Twelve handmade ceramic pieces from a workshop outside Porto. Sold out in three weeks. We knew we were onto something.' },
      { year: '2019', title: 'The Porto atelier', description: 'Opened our first physical space — part studio, part showroom, part community. A place to see the work being made.' },
      { year: '2021', title: 'Fifteen workshops', description: 'Expanded to 15 partner artisans across Portugal, Spain, and Morocco. Strict sourcing: every material natural, every workshop visited in person.' },
      { year: '2023', title: 'B Corp certified', description: 'Achieved B Corporation certification. Verified against the highest standards of social and environmental performance.' },
      { year: '2025', title: 'Two hundred pieces', description: 'Our catalogue reaches 200 objects. Still handmade. Still from the same families of craftspeople we started with.' }
    ]
  },
  values: {
    eyebrow: 'What we stand for',
    heading: 'Three things we refuse to compromise on.',
    subheading: 'These are not aspirational values. They are operational constraints.',
    items: [
      {
        number: '01',
        title: 'Handmade without exception',
        body: 'Every object in our catalogue is made by a human being, using traditional craft techniques. We do not use machine production, and we do not plan to. The imperfection is the point — it is what makes the object yours.'
      },
      {
        number: '02',
        title: 'Natural materials only',
        body: 'Clay, linen, walnut, wool, cork, copper, glass, leather. Nothing synthetic, nothing composite. We choose materials that age with dignity — that look better in ten years than they do on the day they arrive.'
      },
      {
        number: '03',
        title: 'Maker-first economics',
        body: 'Our artisan partners earn a minimum of 60% of the retail price. We know their names. We know their families. That is not charity — it is the only way to sustain the craft for the next generation.'
      }
    ]
  },
  process: {
    eyebrow: 'How it\'s made',
    heading: 'Slow on purpose.',
    body: 'Most things in our catalogue take weeks to make. Some take months. We think that is worth knowing — and worth waiting for.',
    steps: [
      { title: 'Source', description: 'We visit workshops. We meet the people. We look at the materials. Only then do we commission anything.' },
      { title: 'Make', description: 'Each piece is made by hand. No moulds, no shortcuts, no batches of thousands. Each one is individually finished.' },
      { title: 'Inspect', description: 'Every piece is inspected before it leaves the workshop and again on arrival. We reject around 8% of production. That is considered excellent. We consider it the minimum.' },
      { title: 'Ship', description: 'Packaged in recycled materials. Shipped with carbon offset. Arrived with a maker card so you know whose hands made what you hold.' }
    ]
  },
  team: {
    eyebrow: 'The people behind it',
    heading: 'Small team.\nBig conviction.',
    subheading: 'We are nine people. Intentionally. We believe in doing less, better.',
    members: [
      { name: 'Marco Vieira', role: 'Co-founder & Creative Director', bio: 'Former architect. Believes deeply that the things around you shape who you become.', avatar_letter: 'M' },
      { name: 'Lena Hartmann', role: 'Co-founder & Head of Sourcing', bio: 'Speaks four languages. Has visited every single workshop we work with. Takes no shortcuts.', avatar_letter: 'L' },
      { name: 'Sofia Carvalho', role: 'Head of Craft & Quality', bio: 'Trained ceramicist. Inspects every piece that comes through our atelier. The standards are hers.', avatar_letter: 'S' }
    ]
  },
  press: {
    heading: 'What they\'ve said',
    items: [
      { publication: 'The New York Times', quote: 'ARCANA is making the strongest argument we\'ve seen for buying less and buying better.', year: '2024' },
      { publication: 'Wallpaper*', quote: 'The kind of objects you stop people in their tracks to ask about. Every single one.', year: '2024' },
      { publication: 'Vogue Living', quote: 'A rare thing: a brand that actually does what it says. The craft is real, the sourcing is real, the quality is extraordinary.', year: '2023' },
      { publication: 'Monocle', quote: 'We keep coming back to ARCANA because the quality is genuinely without equal at this price point.', year: '2023' }
    ]
  },
  community: {
    eyebrow: 'The people who live with our work',
    heading: 'A community built on\nthe long view.',
    subheading: '82% of our customers have bought from us more than once. That is the number we are proudest of.',
    stats: [
      { value: '42,000+', label: 'Objects in homes worldwide' },
      { value: '82%', label: 'Repeat customers' },
      { value: '4.97★', label: 'Average product rating' },
      { value: '200+', label: 'Handmade pieces' }
    ]
  },
  cta: {
    eyebrow: 'Join us',
    heading: 'Find the piece\nthat stays.',
    subheading: 'Browse 200 handmade objects. Each one from a workshop we know, made from a material we trust, by a craftsperson who signs their work.',
    cta_primary: 'Shop the collection',
    cta_secondary: 'Visit the atelier'
  },
  footer: {
    tagline: 'Made by hand. Meant to last.',
    legal: '© 2025 ARCANA. All rights reserved.',
    email: 'hello@arcana.co'
  },
  seo: {
    title: 'ARCANA — Handmade Homeware. Made to Last.',
    description: 'Artisan ceramics, linen, and wood objects from workshops across Portugal, Spain, and Morocco. 200 pieces. Every one handmade. Every one worth keeping.'
  }
}
