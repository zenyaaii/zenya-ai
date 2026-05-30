import type { RestaurantContent } from './types'

export const RESTAURANT_MOCK_CONTENT: RestaurantContent = {
  brand: {
    name: 'Maison Lumière',
    cuisine: 'Modern French',
    tagline: 'A seven-course conversation between fire, sea, and season.',
    city: 'New York',
    neighborhood: 'West Village'
  },
  hero: {
    eyebrow: 'Reservations open · Spring tasting menu',
    headline: 'A quiet kind of\nextraordinary.',
    subheadline:
      'An intimate twenty-four seat counter where each plate is composed in front of you. Chef Élodie Marchand cooks a single tasting menu that changes with the markets of the Hudson Valley.',
    primary_cta: 'Reserve a Table',
    secondary_cta: 'See the Menu',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80'
  },
  story: {
    eyebrow: 'Our story',
    heading: 'Built on stillness, fire, and the seasons.',
    body:
      'Maison Lumière opened in 2019 in a converted print shop on Cornelia Street. We grow most of what we serve at our family farm in Columbia County, and we work with a small circle of fishermen, foragers, and dairy people who share our obsession with patience.',
    chef_name: 'Élodie Marchand',
    chef_title: 'Chef · Proprietor',
    chef_bio:
      'Trained at L\'Ambroisie in Paris and Manresa in Los Gatos, Élodie returned to New York in 2017 to cook the food she missed eating — quieter, slower, more rooted in place.',
    chef_photo:
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1200&q=80',
    accent_image:
      'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=1600&q=80'
  },
  signature_dishes: [
    {
      name: 'Hand-Dived Sea Scallop',
      description: 'Brown butter, pickled gooseberry, fennel pollen.',
      price: '$36',
      image:
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Hudson Valley Duck',
      description: 'Aged forty days, fig leaf, smoked salt, charred plum.',
      price: '$58',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Hand-Cut Tagliolini',
      description: 'Sea urchin, brown butter, lemon zest, sourdough crumb.',
      price: '$42',
      image:
        'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Crème Brûlée au Lavande',
      description: 'Lavender from Provence, vanilla bean, demerara crust.',
      price: '$18',
      image:
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80'
    }
  ],
  menu: {
    heading: 'À la carte',
    subheading: 'Served Tuesday through Saturday, 5:30 to 10:00pm. Our tasting menu changes weekly.',
    categories: [
      {
        id: 'starters',
        name: 'Starters',
        description: 'To begin slowly.',
        items: [
          { name: 'Beef Tartare', description: 'Aged sirloin, smoked egg yolk, sourdough.', price: '$24' },
          { name: 'Roasted Beets', description: 'Cultured cream, walnuts, sherry vinegar.', price: '$18' },
          { name: 'Oysters', description: 'Half-dozen East Coast, mignonette, lemon.', price: '$28' },
          { name: 'Burrata', description: 'Heirloom tomato, basil oil, finishing salt.', price: '$22' }
        ]
      },
      {
        id: 'mains',
        name: 'Mains',
        description: 'The heart of the menu.',
        items: [
          { name: 'Hudson Valley Duck', description: 'Aged forty days, fig leaf, smoked salt.', price: '$58', badge: 'Signature' },
          { name: 'Wild Striped Bass', description: 'Brown butter, capers, charred lemon.', price: '$48' },
          { name: 'Tagliolini', description: 'Sea urchin, brown butter, lemon zest.', price: '$42' },
          { name: 'Dry-Aged Ribeye', description: 'For two. Bone marrow, watercress, pommes purée.', price: '$120' },
          { name: 'Roasted Cauliflower', description: 'Brown butter, capers, almond praline.', price: '$32' }
        ]
      },
      {
        id: 'desserts',
        name: 'Desserts',
        description: 'A quiet finish.',
        items: [
          { name: 'Crème Brûlée au Lavande', description: 'Lavender, vanilla, demerara crust.', price: '$18', badge: 'Signature' },
          { name: 'Chocolate Soufflé', description: 'Valrhona Guanaja, crème anglaise.', price: '$20' },
          { name: 'Tarte Tatin', description: 'Honeycrisp apple, salted caramel, crème fraîche.', price: '$18' },
          { name: 'Selection of Cheeses', description: 'Three artisanal cheeses, honeycomb, walnut bread.', price: '$24' }
        ]
      },
      {
        id: 'wine',
        name: 'Wine & Spirits',
        description: 'Curated by sommelier Théo Bernard.',
        items: [
          { name: 'Champagne Pairing', description: 'Three glasses across the meal.', price: '$95' },
          { name: 'Wine Pairing', description: 'Five glasses, paired to the tasting menu.', price: '$165' },
          { name: 'Reserve Pairing', description: 'Five rare glasses from our cellar.', price: '$345' },
          { name: 'Non-Alcoholic Pairing', description: 'Botanical infusions, ferments, juices.', price: '$75' }
        ]
      }
    ]
  },
  gallery: {
    heading: 'A room, a fire, a season.',
    subheading: 'Photographs from the dining room and kitchen.',
    images: [
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80', alt: 'Candlelit table setting' },
      { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80', alt: 'Plated dish overhead' },
      { url: 'https://images.unsplash.com/photo-1428515613728-6b4607e44363?auto=format&fit=crop&w=1400&q=80', alt: 'Wine glass and bottle' },
      { url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1400&q=80', alt: 'Chef plating dish' },
      { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80', alt: 'Dining room interior' },
      { url: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=1400&q=80', alt: 'Seasonal vegetables' }
    ]
  },
  hours_location: {
    heading: 'Find us.',
    subheading: '24 Cornelia Street, West Village, New York',
    address: '24 Cornelia Street, New York, NY 10014',
    phone: '+1 (212) 555-0140',
    email: 'reservations@maisonlumiere.nyc',
    map_link: 'https://maps.google.com/?q=24+Cornelia+Street+New+York',
    hours: [
      { day: 'monday', label: 'Monday', open: '', close: '', closed: true },
      { day: 'tuesday', label: 'Tuesday', open: '5:30pm', close: '10:00pm' },
      { day: 'wednesday', label: 'Wednesday', open: '5:30pm', close: '10:00pm' },
      { day: 'thursday', label: 'Thursday', open: '5:30pm', close: '10:00pm' },
      { day: 'friday', label: 'Friday', open: '5:30pm', close: '11:00pm' },
      { day: 'saturday', label: 'Saturday', open: '5:30pm', close: '11:00pm' },
      { day: 'sunday', label: 'Sunday', open: '5:00pm', close: '9:30pm' }
    ]
  },
  reservations: {
    heading: 'Reserve your evening.',
    subheading:
      'Reservations open thirty days in advance, every morning at 9:00am. The chef\'s counter and private dining room are released on the first of each month.',
    cta_label: 'Book on Resy',
    provider: { type: 'resy', url: 'https://resy.com/cities/ny/maison-lumiere' },
    note: 'For private dining or events of eight or more, please write to events@maisonlumiere.nyc.'
  },
  reviews: {
    heading: 'In the room.',
    subheading: 'A few words from recent guests and critics.',
    overall_rating: 4.9,
    review_count: '630+',
    testimonials: [
      {
        name: 'Pete Wells',
        text: 'A restaurant of unusual quiet confidence. Marchand cooks with the patience of someone who has nothing left to prove.',
        source: 'The New York Times',
        rating: 5
      },
      {
        name: 'Sarah Lin',
        text: 'The kind of dinner you remember a year later. The duck alone is worth the trip from anywhere on the East Coast.',
        source: 'Eater · Verified diner',
        rating: 5
      },
      {
        name: 'James Whitfield',
        text: 'Service is precise without being formal. Wine pairings are extraordinary. We celebrated our anniversary here and will be back.',
        source: 'Resy · Verified diner',
        rating: 5
      },
      {
        name: 'Marielle Foster',
        text: 'Worth every penny. The kitchen counter is the best seat in New York if you want to watch a master at work.',
        source: 'OpenTable · Verified diner',
        rating: 5
      }
    ]
  },
  press: {
    heading: 'In the press.',
    items: [
      { outlet: 'The New York Times', quote: '"Three Stars."' },
      { outlet: 'Michelin Guide', quote: 'One Star · 2023, 2024' },
      { outlet: 'Eater 38' },
      { outlet: 'Bon Appétit', quote: 'Top 50 New Restaurants' },
      { outlet: 'The Infatuation' },
      { outlet: 'Food & Wine' }
    ]
  },
  newsletter: {
    heading: 'Seasonal letter.',
    subheading: 'Three times a year we share the new menu, the farm, and what we are reading.',
    button_label: 'Subscribe'
  },
  faq: {
    heading: 'Before you come.',
    items: [
      {
        q: 'Is there a dress code?',
        a: 'We ask guests to dress smart-casual. Sport coats and dresses are common; we do not require ties.'
      },
      {
        q: 'Can you accommodate dietary restrictions?',
        a: 'Yes. Please let us know at the time of booking and we will compose a menu around any allergy or preference, including vegetarian, vegan, and gluten-free.'
      },
      {
        q: 'Do you welcome children?',
        a: 'Children over the age of ten are welcome at all seatings. Younger guests are welcome at our 5:00pm Sunday seating.'
      },
      {
        q: 'Where can we park?',
        a: 'Street parking is limited in the West Village. We recommend the public garage on Carmine Street, two blocks east.'
      },
      {
        q: 'Do you offer private dining?',
        a: 'Our private dining room seats up to twenty. Please write to events@maisonlumiere.nyc for inquiries.'
      },
      {
        q: 'What is your cancellation policy?',
        a: 'We hold a $75 per person deposit at booking, refundable up to forty-eight hours before your reservation.'
      }
    ]
  },
  footer: {
    tagline: 'Open for dinner Tuesday – Sunday. Closed Mondays.',
    legal: '© 2026 Maison Lumière. All rights reserved.'
  },
  seo: {
    title: 'Maison Lumière · Modern French Tasting Menu · West Village, New York',
    description:
      'An intimate twenty-four seat counter in the West Village. Chef Élodie Marchand cooks a seasonal tasting menu sourced from the Hudson Valley.'
  }
}
