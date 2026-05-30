import type { ServiceContent } from './types'

export const SERVICE_MOCK_CONTENT: ServiceContent = {
  brand: {
    name: 'Northline Home Services',
    category: 'Heating, cooling, and electrical upgrades',
    city: 'Austin',
    region: 'Texas',
    tagline: 'High-trust local service for homes that need fast, careful work.',
    owner_name: 'Daniel Hart'
  },
  hero: {
    eyebrow: 'Licensed team · Same-week visits',
    headline: 'Modern local service,\nwithout the usual hassle.',
    subheadline:
      'Northline helps Austin homeowners with repairs, upgrades, and urgent callouts through a cleaner, faster, more premium service experience.',
    primary_cta: 'Book a visit',
    secondary_cta: 'See services',
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2000&q=80',
    stats: [
      { value: '4.9/5', label: 'Average rating' },
      { value: '12 yrs', label: 'In business' },
      { value: 'Same day', label: 'Urgent response' }
    ]
  },
  trust_bar: {
    items: ['Licensed and insured', 'Upfront pricing', 'Workmanship guarantee', 'Locally owned']
  },
  services: {
    heading: 'What we help with',
    subheading: 'Built for the services homeowners ask for most often, from routine fixes to high-value upgrades.',
    items: [
      {
        name: 'System diagnostics',
        description: 'Fast issue finding with clear next steps and no-pressure recommendations.',
        price_from: 'From $129',
        badge: 'Popular'
      },
      {
        name: 'Installations and replacements',
        description: 'Planned upgrades installed cleanly with project communication from start to finish.',
        price_from: 'Custom quote'
      },
      {
        name: 'Emergency callouts',
        description: 'Priority scheduling for urgent service needs when downtime is not an option.',
        price_from: '24/7 support',
        badge: 'Fast response'
      }
    ]
  },
  story: {
    eyebrow: 'Why clients switch',
    heading: 'The premium version of a local service company.',
    body:
      'Northline was built for homeowners who are tired of vague arrival windows, rushed work, and messy follow-through. We bring tighter communication, cleaner installs, and a calmer customer experience from the first call to the final walkthrough.',
    owner_name: 'Daniel Hart',
    owner_title: 'Founder',
    quote: 'People remember how a service company makes them feel. We designed the whole experience around clarity and care.',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80'
  },
  proof: {
    heading: 'Why homeowners choose us',
    subheading: 'Every part of the site is designed to reduce hesitation and show that this business operates at a higher level.',
    items: [
      { title: 'Clear communication', text: 'Arrival windows, scope, and next steps stay obvious at every stage.' },
      { title: 'Clean execution', text: 'Teams protect the space, document the work, and leave the job looking finished.' },
      { title: 'Confident expertise', text: 'Recommendations are practical, well explained, and never padded with pressure.' }
    ]
  },
  before_after: {
    heading: 'See the difference',
    subheading: 'Use this section for repairs, upgrades, cleaning transformations, or any visible result.',
    before_label: 'Before',
    after_label: 'After',
    before_image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
    after_image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
    highlights: ['Cleaner finish', 'Safer performance', 'More polished customer experience']
  },
  process: {
    heading: 'How it works',
    subheading: 'A service flow that feels modern, direct, and easy to trust.',
    steps: [
      { step: '01', title: 'Share the job', text: 'Tell us what is happening, what you need, and when you want help.' },
      { step: '02', title: 'Get a clear plan', text: 'We confirm fit, timing, and what to expect before the appointment.' },
      { step: '03', title: 'Finish with confidence', text: 'The team completes the work cleanly and walks you through the result.' }
    ]
  },
  areas: {
    heading: 'Proudly serving Austin and nearby neighborhoods',
    subheading: 'Strong local coverage makes scheduling faster and follow-up easier.',
    areas_served: ['Downtown Austin', 'Tarrytown', 'West Lake Hills', 'South Congress', 'Bee Cave', 'Round Rock'],
    response_time: 'Often same-day for urgent requests',
    availability: 'Mon-Sat, 7am-7pm'
  },
  offer: {
    badge: 'Limited offer',
    heading: 'Start with a fast consultation',
    subheading: 'A premium quote flow that gives shoppers a clear next step without friction.',
    points: ['Fast response from a real person', 'Upfront scope discussion', 'No-pressure recommendations'],
    cta_label: 'Request my quote'
  },
  testimonials: {
    heading: 'What local clients say',
    subheading: 'Reviews here should feel specific, believable, and tied to the real experience.',
    average_rating: 4.9,
    review_count: '320+',
    items: [
      {
        name: 'Maya T.',
        text: 'The whole experience felt far more organized than any contractor we have used before. Fast updates, clean work, and zero surprises.',
        source: 'Google Reviews',
        rating: 5
      },
      {
        name: 'Chris L.',
        text: 'They diagnosed the issue quickly, explained our options clearly, and left the space cleaner than they found it.',
        source: 'Yelp',
        rating: 5
      },
      {
        name: 'Jenna P.',
        text: 'Professional from start to finish. It finally felt like a premium service company, not a random crew showing up late.',
        source: 'Verified customer',
        rating: 5
      }
    ]
  },
  faq: {
    heading: 'Questions clients ask before booking',
    items: [
      { q: 'Do you offer free estimates?', a: 'For many jobs, yes. More complex work may begin with a paid assessment that is applied to the final project.' },
      { q: 'How fast can you come out?', a: 'Urgent requests are often handled the same day, depending on your area and the type of work.' },
      { q: 'Are you licensed and insured?', a: 'Yes. This should be stated clearly in the trust bar and repeated anywhere it helps reduce hesitation.' },
      { q: 'Do you work in nearby neighborhoods?', a: 'Yes. Use the service-area section to make local coverage obvious and easy to scan.' },
      { q: 'What happens after I request a quote?', a: 'We confirm details, recommend the right next step, and help you choose a time that works.' }
    ]
  },
  final_cta: {
    heading: 'Ready to get the job handled?',
    subheading: 'Give visitors one clean final CTA with enough reassurance to convert without feeling pushy.',
    cta_label: 'Book now',
    secondary_text: 'Fast replies. Clear pricing. Professional follow-through.'
  },
  gallery: {
    heading: 'Recent work and real moments',
    images: [
      { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80', alt: 'Interior service before' },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80', alt: 'Interior service after' },
      { url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80', alt: 'Team discussing project' },
      { url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=80', alt: 'Technician at work' }
    ]
  },
  footer: {
    tagline: 'Built for homeowners who want speed, clarity, and work done right.',
    legal: '© 2026 Northline Home Services. All rights reserved.',
    phone: '+1 (512) 555-0187',
    email: 'hello@northlinehome.com',
    address: '1204 W 6th St, Austin, TX 78703'
  },
  seo: {
    title: 'Northline Home Services · Local Service Website Template',
    description: 'Modern local services website with hero, services, proof, before-after, reviews, FAQ, and quote CTA.'
  }
}
