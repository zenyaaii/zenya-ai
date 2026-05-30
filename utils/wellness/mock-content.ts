import type { WellnessContent } from './types'

export const WELLNESS_MOCK_CONTENT: WellnessContent = {
  brand: {
    name: 'Sōla Wellness Studio',
    type: 'Holistic Spa & Wellness',
    city: 'Austin',
    region: 'Texas',
    tagline: 'A sanctuary designed to restore your mind, body, and presence.'
  },
  hero: {
    eyebrow: 'Austin\'s Premier Wellness Studio',
    headline: 'Where stillness\nbecomes your\nsuperpower.',
    subheadline:
      'Sōla brings together expert practitioners, intentional spaces, and deeply personalised treatments — so you leave lighter than you arrived.',
    cta_primary: 'Book a session',
    cta_secondary: 'Explore treatments',
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85',
    badge: 'Now booking June'
  },
  trust_bar: {
    items: [
      'Licensed practitioners',
      'Organic products only',
      '500+ 5-star sessions',
      'Private treatment rooms',
      'Free consultation'
    ]
  },
  philosophy: {
    eyebrow: 'Our philosophy',
    heading: 'Wellness that goes\ndeeper than the surface.',
    subheading:
      'We believe real restoration happens when evidence-based practice meets intuitive care — in spaces built for it.',
    pillars: [
      {
        icon: '🌿',
        title: 'Holistic by design',
        text: 'Every treatment considers the whole person — physical tension, mental load, and emotional state.'
      },
      {
        icon: '✦',
        title: 'Intentional spaces',
        text: 'Our rooms are designed around stillness: low light, curated scent, temperature-controlled warmth.'
      },
      {
        icon: '◎',
        title: 'Expert practitioners',
        text: 'All our therapists hold advanced certifications and bring a minimum of five years of hands-on practice.'
      }
    ]
  },
  treatments: {
    heading: 'Our treatments',
    subheading: 'Each session is tailored to where you are today — not a fixed protocol.',
    items: [
      {
        name: 'Signature Restore Massage',
        category: 'Massage',
        duration: '90 min',
        price: 'From $145',
        description:
          'A deep-tissue and Swedish fusion that releases chronic tension while recalibrating your nervous system.',
        badge: 'Most popular'
      },
      {
        name: 'Radiance Facial',
        category: 'Facial',
        duration: '60 min',
        price: 'From $120',
        description:
          'Organic actives, lymphatic massage, and LED therapy combine to deliver visible glow in a single session.',
        badge: 'Bestseller'
      },
      {
        name: 'Yin & Restore Flow',
        category: 'Yoga',
        duration: '75 min',
        price: 'From $35',
        description:
          'A slow, floor-based practice designed to soften the connective tissue and calm an overactive mind.',
        badge: ''
      },
      {
        name: 'Hot Stone Journey',
        category: 'Massage',
        duration: '75 min',
        price: 'From $135',
        description:
          'Heated basalt stones melt muscular resistance while grounding energy — deeply restorative and ceremonial.',
        badge: 'Signature'
      },
      {
        name: 'Breathwork & Sound Bath',
        category: 'Mindfulness',
        duration: '60 min',
        price: 'From $55',
        description:
          'Guided pranayama followed by a crystal bowl sound bath — a reset for the nervous system and clarity of mind.',
        badge: 'New'
      },
      {
        name: 'Couples Ritual',
        category: 'Couples',
        duration: '90 min',
        price: 'From $280',
        description:
          'A shared massage experience in our private couples suite — a ritual for connection and mutual restoration.',
        badge: 'Limited spots'
      }
    ]
  },
  journey: {
    heading: 'Your path to restoration',
    subheading: 'Three steps that take you from first visit to lasting practice.',
    steps: [
      {
        step: '01',
        title: 'Book your session',
        text: 'Choose a treatment that calls to you, or reach out and we will recommend one based on your goals.'
      },
      {
        step: '02',
        title: 'Arrive and settle',
        text: 'You are greeted, offered herbal tea, and given time to transition before your practitioner takes over.'
      },
      {
        step: '03',
        title: 'Leave lighter',
        text: 'After your session, rest in our lounge, receive aftercare notes, and book your next visit at a member rate.'
      }
    ]
  },
  team: {
    heading: 'Meet our practitioners',
    subheading: 'Every practitioner at Sōla is selected for deep expertise and genuine presence.',
    members: [
      {
        name: 'Maya Chen',
        title: 'Lead Therapist & Founder',
        specialty: 'Deep tissue · Thai massage · Trauma-informed bodywork',
        bio: 'With 11 years of practice across Austin and Bali, Maya built Sōla around the belief that every body deserves patient, skilled attention.',
        image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'James Okafor',
        title: 'Yoga Teacher & Breathwork Guide',
        specialty: 'Yin yoga · Pranayama · Somatic movement',
        bio: 'James trained in Mysore and has spent eight years teaching nervous system-focused movement in studios across the US.',
        image: 'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Sofia Reyes',
        title: 'Esthetician & Facial Specialist',
        specialty: 'Organic facials · LED therapy · Lymphatic drainage',
        bio: 'Sofia is a licensed esthetician with a specialism in clean beauty and results-driven skin protocols without the clinical feel.',
        image: 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  space: {
    heading: 'Our space',
    subheading: 'Designed around stillness — a place where the shift starts the moment you step inside.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1200&q=80',
        alt: 'Treatment room'
      },
      {
        url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
        alt: 'Relaxation lounge'
      },
      {
        url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80',
        alt: 'Yoga studio'
      },
      {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Reception'
      }
    ],
    amenities: [
      'Four private treatment rooms',
      'Infrared sauna',
      'Himalayan salt float pod',
      'Tea & aftercare lounge',
      'Private couples suite',
      'Organic product boutique'
    ]
  },
  testimonials: {
    heading: 'What our clients say',
    subheading: 'Real words from people who walk out lighter than they walked in.',
    average_rating: 5.0,
    review_count: '340+',
    items: [
      {
        name: 'Lauren M.',
        text: 'The Signature Restore Massage is unlike anything I have had before. Maya somehow found tension I didn\'t know I was carrying. I left in a completely different state — and slept better than I had in months.',
        treatment: 'Signature Restore Massage',
        rating: 5
      },
      {
        name: 'Daniel R.',
        text: 'I was skeptical about the sound bath but James made the experience feel completely natural. The combination of breathwork and the crystal bowls was genuinely transformative. I\'ve been back four times.',
        treatment: 'Breathwork & Sound Bath',
        rating: 5
      },
      {
        name: 'Priya S.',
        text: 'Sofia\'s Radiance Facial gave me the best skin of my life — and she explained every step so I actually understood what my skin needs. The space is calm and gorgeous. I\'ve already rebooked.',
        treatment: 'Radiance Facial',
        rating: 5
      }
    ]
  },
  booking_cta: {
    eyebrow: 'Reserve your session',
    heading: 'Your body has been asking for this.',
    subheading:
      'Availability fills fast. Book now and we\'ll handle the rest — from room prep to personalised aftercare.',
    cta_label: 'Book your session',
    note: 'Free cancellation up to 24 hours before · No card required to hold',
    image:
      'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2000&q=80'
  },
  faq: {
    heading: 'Questions before you book',
    items: [
      {
        q: 'Do I need to have any prior experience for yoga or mindfulness sessions?',
        a: 'Not at all. Our classes are designed for all levels. Just let us know it\'s your first time and your practitioner will guide you through everything.'
      },
      {
        q: 'What should I wear or bring to my appointment?',
        a: 'For massage sessions, nothing. We provide robes, slippers, and all linens. For yoga and movement classes, comfortable fitted clothes are ideal.'
      },
      {
        q: 'How early should I arrive for my session?',
        a: 'We recommend arriving 10–15 minutes early to settle in, fill a brief intake form, and receive your welcome tea before the session begins.'
      },
      {
        q: 'Can I gift a session to someone?',
        a: 'Yes. We offer e-gift cards for any amount and printed gift cards that can be sent directly to the recipient. Contact us to arrange a custom package.'
      },
      {
        q: 'What is your cancellation policy?',
        a: 'We ask for 24 hours\' notice for cancellations or rescheduling. Same-day cancellations are charged 50% of the session fee.'
      },
      {
        q: 'Do you offer membership or multi-session packages?',
        a: 'Yes. Members receive 20% off all treatments, priority booking, and a complimentary session each quarter. Ask at reception or enquire via email.'
      }
    ]
  },
  footer: {
    tagline: 'Designed for stillness. Built for you.',
    legal: `© ${new Date().getFullYear()} Sōla Wellness Studio. All rights reserved.`,
    phone: '+1 (512) 555-0182',
    email: 'hello@solawellness.com',
    address: '2210 South Lamar Blvd, Austin, TX 78704',
    hours: 'Mon–Sat 9am–8pm · Sun 10am–5pm'
  },
  seo: {
    title: 'Sōla Wellness Studio · Spa & Holistic Treatments · Austin TX',
    description:
      'Sōla Wellness Studio offers expert massage, facials, yoga, and mindfulness sessions in Austin, TX. Book your restorative session today.'
  }
}
