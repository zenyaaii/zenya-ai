/**
 * Zenya icon registry
 * ---------------------------------------------------------------------------
 * A large, business-aware icon library built on lucide-react (~1600 icons).
 *
 * Two layers:
 *   1. ICONS      — canonical semantic key -> real lucide component.
 *   2. ALIASES    — hundreds of natural-language keywords -> canonical key.
 *
 * The generators (and the wizard) NEVER emit emojis. They emit a semantic
 * icon name from AI_ICON_VOCAB (see ./vocab). `resolveIcon()` turns whatever
 * the AI produced — a canonical key, an alias, a raw lucide name, or a fuzzy
 * near-miss — into a guaranteed-renderable component. It never returns
 * undefined, so a site is never left with a blank slot.
 */
import {
  // --- food & drink -------------------------------------------------------
  Coffee, CupSoda, Wine, Beer, Martini, Milk, Croissant, Cake, Cookie, Donut,
  IceCream, Pizza, Sandwich, Salad, Soup, Beef, Fish, Drumstick, Ham, Egg,
  EggFried, Wheat, Carrot, Apple, Cherry, Grape, Popcorn, Utensils,
  UtensilsCrossed, ChefHat, CookingPot, HandPlatter, Refrigerator, Microwave,
  Flame,
  // --- retail & products --------------------------------------------------
  ShoppingBag, ShoppingCart, ShoppingBasket, Store, Warehouse, Package,
  PackageCheck, Boxes, Gift, Tag, Percent, BadgePercent, Ticket, Receipt,
  Barcode, Shirt, Gem, Watch, Glasses, Footprints, Crown, Diamond, Bookmark,
  Flag,
  // --- shipping & travel --------------------------------------------------
  Truck, Plane, Ship, Bike, Car, Bus, Train, MapPin, Map, Navigation, Compass,
  Globe, Anchor, Tent,
  // --- money & payments ---------------------------------------------------
  CreditCard, Wallet, Banknote, Coins, DollarSign, Euro, PiggyBank, Landmark,
  HandCoins,
  // --- trust & benefits ---------------------------------------------------
  ShieldCheck, Shield, BadgeCheck, CircleCheckBig, Lock, Fingerprint, Award,
  Trophy, Medal, ThumbsUp, Star, Sparkles, Sparkle, Zap, Rocket, Target, Gauge,
  Timer, Clock, Hourglass, Handshake, HeartHandshake, Verified,
  // --- nature & eco -------------------------------------------------------
  Leaf, Sprout, TreePine, Trees, Flower, Flower2, Recycle, Droplet, Sun, Moon,
  Snowflake, Wind, Waves, Mountain, Cloud, Feather, PawPrint,
  // --- beauty, health & wellness -----------------------------------------
  Scissors, Brush, Palette, Bath, Dumbbell, HeartPulse, Activity, Stethoscope,
  Pill, Syringe, Cross, Smile, Eye, Brain, Accessibility, Baby, HandHeart,
  Heart,
  // --- home & trades ------------------------------------------------------
  House, Building2, Wrench, Hammer, PaintRoller, Drill, Ruler, HardHat, Plug,
  Lightbulb, Fan, Thermometer, Trash2, SprayCan, Bug, Key, DoorOpen, Sofa,
  BedDouble,
  // --- tech & creative ----------------------------------------------------
  Laptop, Smartphone, Monitor, Wifi, Code, Cpu, Camera, Video, Film, Image,
  Images, Music, Mic, Headphones, Radio, PenTool, Pen, Book, BookOpen,
  GraduationCap, Puzzle, Layers, WandSparkles, Wand2, Aperture,
  // --- contact & ui -------------------------------------------------------
  Phone, Mail, MessageCircle, MessageSquare, Send, Bell, AtSign, Calendar,
  CalendarCheck, CalendarClock, User, Users, Link, Share2, Search, Info,
  HelpCircle, Quote, Briefcase, FileText, ClipboardList, Settings,
  // --- arrows, motion & data ---------------------------------------------
  ArrowRight, ArrowUpRight, RotateCcw, RefreshCw, TrendingUp, BarChart3,
  LineChart, PieChart, ChevronDown, ChevronUp, ChevronRight, X, Menu, Plus,
  Minus, TriangleAlert, ExternalLink,
  // --- saas / integrations ------------------------------------------------
  Cable, Blocks, Webhook, Braces, Bot, Workflow, GitBranch, Network, Server,
  Database, Cog, Plug2, BatteryCharging, Loader2,
  type LucideIcon,
} from 'lucide-react'

/** Default when nothing else resolves — friendly and neutral. */
export const DEFAULT_ICON: LucideIcon = Sparkles

/**
 * Canonical semantic keys. Keep these kebab/lowercase and business-meaningful:
 * they ARE the vocabulary the AI is told to choose from.
 */
export const ICONS: Record<string, LucideIcon> = {
  // food & drink
  coffee: Coffee, tea: CupSoda, soda: CupSoda, juice: CupSoda, wine: Wine,
  beer: Beer, cocktail: Martini, milk: Milk, croissant: Croissant, cake: Cake,
  cookie: Cookie, donut: Donut, 'ice-cream': IceCream, pizza: Pizza,
  sandwich: Sandwich, burger: Sandwich, salad: Salad, soup: Soup, meat: Beef,
  fish: Fish, chicken: Drumstick, ham: Ham, egg: Egg, breakfast: EggFried,
  bread: Wheat, grain: Wheat, vegetable: Carrot, fruit: Apple, cherry: Cherry,
  grape: Grape, popcorn: Popcorn, utensils: Utensils, dining: UtensilsCrossed,
  chef: ChefHat, cooking: CookingPot, 'table-service': HandPlatter,
  fridge: Refrigerator, microwave: Microwave, grill: Flame,

  // retail & products
  'shopping-bag': ShoppingBag, cart: ShoppingCart, basket: ShoppingBasket,
  store: Store, warehouse: Warehouse, package: Package, delivered: PackageCheck,
  boxes: Boxes, gift: Gift, tag: Tag, discount: Percent, sale: BadgePercent,
  ticket: Ticket, receipt: Receipt, barcode: Barcode, apparel: Shirt, gem: Gem,
  watch: Watch, glasses: Glasses, shoes: Footprints, premium: Crown,
  luxury: Diamond, bookmark: Bookmark, flag: Flag,

  // shipping & travel
  shipping: Truck, delivery: Truck, flight: Plane, boat: Ship, bike: Bike,
  car: Car, bus: Bus, train: Train, location: MapPin, map: Map,
  directions: Navigation, compass: Compass, worldwide: Globe, anchor: Anchor,
  camping: Tent,

  // money & payments
  card: CreditCard, wallet: Wallet, cash: Banknote, coins: Coins,
  price: DollarSign, euro: Euro, savings: PiggyBank, bank: Landmark,
  payment: HandCoins,

  // trust & benefits
  secure: ShieldCheck, shield: Shield, verified: BadgeCheck, check: CircleCheckBig,
  lock: Lock, privacy: Fingerprint, award: Award, trophy: Trophy, medal: Medal,
  'thumbs-up': ThumbsUp, star: Star, sparkles: Sparkles, sparkle: Sparkle,
  bolt: Zap, fast: Zap, rocket: Rocket, target: Target, performance: Gauge,
  timer: Timer, clock: Clock, hourglass: Hourglass, handshake: Handshake,
  partnership: HeartHandshake, guarantee: Verified,

  // nature & eco
  leaf: Leaf, eco: Leaf, sprout: Sprout, pine: TreePine, trees: Trees,
  flower: Flower, blossom: Flower2, recycle: Recycle, water: Droplet, sun: Sun,
  moon: Moon, snow: Snowflake, wind: Wind, waves: Waves, mountain: Mountain,
  cloud: Cloud, feather: Feather, pets: PawPrint,

  // beauty, health & wellness
  scissors: Scissors, haircut: Scissors, brush: Brush, palette: Palette,
  design: Palette, spa: Bath, fitness: Dumbbell, gym: Dumbbell,
  heartbeat: HeartPulse, health: Activity, clinic: Stethoscope, medicine: Pill,
  injection: Syringe, medical: Cross, smile: Smile, dental: Smile, eye: Eye,
  vision: Eye, mind: Brain, accessibility: Accessibility, baby: Baby,
  care: HandHeart, love: Heart, heart: Heart,

  // home & trades
  home: House, building: Building2, repair: Wrench, tools: Hammer,
  painting: PaintRoller, drill: Drill, measure: Ruler, construction: HardHat,
  electric: Plug, idea: Lightbulb, cooling: Fan, heating: Thermometer,
  cleaning: Trash2, sanitize: SprayCan, pest: Bug, key: Key, door: DoorOpen,
  furniture: Sofa, bedroom: BedDouble,

  // tech & creative
  laptop: Laptop, mobile: Smartphone, desktop: Monitor, wifi: Wifi, code: Code,
  chip: Cpu, camera: Camera, video: Video, film: Film, photo: Image,
  gallery: Images, music: Music, podcast: Mic, audio: Headphones, radio: Radio,
  'pen-tool': PenTool, writing: Pen, book: Book, reading: BookOpen,
  education: GraduationCap, puzzle: Puzzle, layers: Layers, magic: WandSparkles,
  wand: Wand2, lens: Aperture,

  // contact & ui
  phone: Phone, mail: Mail, chat: MessageCircle, message: MessageSquare,
  send: Send, notify: Bell, mention: AtSign, calendar: Calendar,
  'calendar-check': CalendarCheck, schedule: CalendarClock, user: User,
  users: Users, community: Users, link: Link, share: Share2, search: Search,
  info: Info, help: HelpCircle, quote: Quote, business: Briefcase,
  document: FileText, checklist: ClipboardList, settings: Settings,

  // arrows, motion & data
  next: ArrowRight, arrow: ArrowRight, external: ArrowUpRight, returns: RotateCcw,
  refresh: RefreshCw, growth: TrendingUp, analytics: BarChart3, chart: LineChart,
  metrics: PieChart, expand: ChevronDown, collapse: ChevronUp, chevron: ChevronDown,
  'chevron-right': ChevronRight, close: X, menu: Menu, plus: Plus, minus: Minus,
  alert: TriangleAlert, warning: TriangleAlert, 'external-link': ExternalLink,
  loading: Loader2, spinner: Loader2,

  // saas / integrations
  integration: Cable, plugins: Blocks, webhook: Webhook, api: Braces, bot: Bot,
  automation: Workflow, version: GitBranch, network: Network, server: Server,
  database: Database, gear: Cog, connect: Plug2, battery: BatteryCharging,
}

/**
 * Natural-language aliases -> canonical key. This is where the "thousands of
 * matches" live: many words map onto one clean icon so the AI (or the wizard,
 * or a keyword heuristic) almost always lands on something relevant.
 */
export const ALIASES: Record<string, string> = {
  // food & drink
  espresso: 'coffee', latte: 'coffee', cappuccino: 'coffee', cafe: 'coffee',
  americano: 'coffee', mocha: 'coffee', drink: 'soda', beverage: 'soda',
  smoothie: 'juice', cola: 'soda', winery: 'wine', vineyard: 'wine',
  bar: 'cocktail', pub: 'beer', brewery: 'beer', dairy: 'milk',
  pastry: 'croissant', bakery: 'bread', dessert: 'cake', sweets: 'cake',
  biscuit: 'cookie', doughnut: 'donut', gelato: 'ice-cream', pizzeria: 'pizza',
  slice: 'pizza', burgers: 'burger', wrap: 'sandwich', deli: 'sandwich',
  greens: 'salad', vegan: 'salad', vegetarian: 'vegetable', ramen: 'soup',
  pho: 'soup', steak: 'meat', bbq: 'grill', barbecue: 'grill', grilled: 'grill',
  seafood: 'fish', sushi: 'fish', poultry: 'chicken', wings: 'chicken',
  organic: 'leaf', 'farm-to-table': 'sprout', kitchen: 'cooking',
  restaurant: 'dining', menu: 'utensils', foodtruck: 'dining',
  catering: 'table-service', buffet: 'table-service', snacks: 'popcorn',
  produce: 'fruit', fresh: 'sprout',

  // retail & ecommerce
  shop: 'store', boutique: 'shopping-bag', ecommerce: 'cart', checkout: 'cart',
  storefront: 'store', inventory: 'boxes', stock: 'boxes', product: 'package',
  parcel: 'package', gifts: 'gift', giftcard: 'gift', coupon: 'discount',
  offer: 'sale', deal: 'sale', promo: 'sale', promotion: 'sale', label: 'tag',
  pricing: 'tag', clothing: 'apparel', fashion: 'apparel', jewelry: 'gem',
  jewellery: 'gem', accessories: 'watch', eyewear: 'glasses',
  sunglasses: 'glasses', footwear: 'shoes', sneakers: 'shoes', vip: 'premium',
  exclusive: 'luxury', bestseller: 'trophy', 'new-arrival': 'sparkles',

  // shipping & logistics
  'free-shipping': 'shipping', 'fast-shipping': 'shipping', logistics: 'shipping',
  courier: 'delivery', 'same-day': 'delivery', dispatch: 'shipping',
  freight: 'boat', 'air-freight': 'flight', cycling: 'bike', rental: 'car',
  transport: 'bus', tracking: 'location', address: 'location', route: 'directions',
  navigate: 'compass', global: 'worldwide', international: 'worldwide',
  travel: 'flight', tourism: 'compass', outdoor: 'camping', adventure: 'mountain',

  // money & payments
  'secure-payment': 'card', 'credit-card': 'card', pay: 'payment',
  'easy-payments': 'card', installments: 'card', refund: 'coins',
  'money-back': 'guarantee', budget: 'wallet', invoice: 'receipt',
  billing: 'receipt', affordable: 'price', 'best-price': 'price', roi: 'savings',
  finance: 'bank', banking: 'bank', tax: 'bank', accounting: 'document',

  // trust & benefits
  trust: 'secure', trusted: 'secure', protection: 'shield', warranty: 'guarantee',
  certified: 'verified', authentic: 'verified', quality: 'award',
  'top-rated': 'star', rating: 'star', reviews: 'star', reliable: 'thumbs-up',
  satisfaction: 'thumbs-up', speed: 'fast', instant: 'bolt', quick: 'fast',
  efficient: 'performance', 'time-saving': 'timer', punctual: 'clock',
  '24-7': 'clock', 'always-open': 'clock', support: 'phone', durable: 'shield',
  safe: 'secure', safety: 'shield', privacy: 'privacy',

  // nature & eco
  sustainable: 'eco', 'eco-friendly': 'eco', green: 'leaf', natural: 'leaf',
  recycled: 'recycle', biodegradable: 'recycle', hydration: 'water',
  waterproof: 'water', energy: 'sun', solar: 'sun', night: 'moon',
  winter: 'snow', summer: 'sun', climate: 'cloud', animal: 'pets', dog: 'pets',
  cat: 'pets', pet: 'pets',

  // beauty & wellness
  salon: 'haircut', barber: 'haircut', hairdresser: 'haircut', makeup: 'brush',
  cosmetics: 'brush', beauty: 'sparkles', nails: 'sparkle', skincare: 'spa',
  massage: 'spa', wellness: 'spa', relax: 'spa', yoga: 'accessibility',
  meditation: 'mind', workout: 'gym', training: 'gym', trainer: 'gym',
  nutrition: 'health', doctor: 'clinic', hospital: 'medical', pharmacy: 'medicine',
  therapy: 'care', therapist: 'care', mental: 'mind', dentist: 'dental',
  optician: 'vision', pediatric: 'baby', childcare: 'baby', nursing: 'care',

  // home & trades
  house: 'home', 'real-estate': 'building', property: 'building',
  apartment: 'building', plumbing: 'repair', plumber: 'repair',
  handyman: 'tools', carpentry: 'tools', renovation: 'construction',
  contractor: 'construction', electrician: 'electric', wiring: 'electric',
  hvac: 'heating', ac: 'cooling', 'air-conditioning': 'cooling',
  landscaping: 'trees', gardening: 'sprout', 'pest-control': 'pest',
  locksmith: 'key', moving: 'furniture', interior: 'furniture',
  decor: 'furniture', hotel: 'bedroom', hospitality: 'bedroom',
  'painting-service': 'painting',

  // tech & creative
  software: 'code', developer: 'code', app: 'mobile', 'web-design': 'desktop',
  website: 'desktop', internet: 'wifi', hardware: 'chip', ai: 'magic',
  automation: 'magic', photography: 'camera', photographer: 'camera',
  videography: 'video', filming: 'film', editing: 'lens', portfolio: 'gallery',
  studio: 'camera', dj: 'music', band: 'music', musician: 'music',
  recording: 'podcast', broadcast: 'radio', graphic: 'design',
  branding: 'palette', creative: 'palette', illustration: 'pen-tool',
  copywriting: 'writing', blog: 'writing', publishing: 'book', course: 'education',
  learning: 'education', tutoring: 'education', coaching: 'idea',
  consulting: 'business', strategy: 'target', innovation: 'idea',

  // contact & ui
  contact: 'phone', call: 'phone', email: 'mail', newsletter: 'mail',
  subscribe: 'mail', support_chat: 'chat', messaging: 'message',
  notification: 'notify', booking: 'calendar', reservation: 'calendar',
  appointment: 'schedule', account: 'user', profile: 'user', team: 'users',
  membership: 'community', social: 'share', faq: 'help', question: 'help',
  testimonial: 'quote', company: 'business', report: 'document', file: 'document',
  tasks: 'checklist', config: 'settings', customize: 'settings',

  // arrows / data / saas
  return: 'returns', exchange: 'returns', 'free-returns': 'returns',
  sync: 'refresh', dashboard: 'analytics', stats: 'analytics',
  reporting: 'analytics', insights: 'chart', 'data-driven': 'chart',
  scalable: 'growth', 'scale-up': 'growth', saas: 'integration',
  platform: 'integration', integrations: 'integration', plugin: 'plugins',
  chatbot: 'bot', 'no-code': 'automation', workflow: 'automation',
  cloud_hosting: 'server', hosting: 'server', storage: 'database',
  uptime: 'server', encryption: 'lock', 'single-sign-on': 'privacy',

  // common raw lucide names the AI or older content may emit directly,
  // so they resolve to the right glyph instead of the default. (Names that
  // already exist as ICONS keys — star, heart, lock… — need no alias.)
  zap: 'bolt', truck: 'shipping', globe: 'worldwide', crown: 'premium',
  flame: 'grill', 'shield-check': 'secure', 'badge-check': 'verified',
  'map-pin': 'location', 'shopping-cart': 'cart', 'chef-hat': 'chef',
  'graduation-cap': 'education', dollar: 'price', 'dollar-sign': 'price',
}

/** Simple kebab/normalize so "Ice Cream", "ice_cream", "IceCream" all match. */
function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase -> camel-Case
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Fuzzy fallback: does any known key/alias appear inside the requested word? */
function fuzzy(key: string): LucideIcon | undefined {
  for (const k of Object.keys(ICONS)) {
    if (key.includes(k) || k.includes(key)) return ICONS[k]
  }
  for (const a of Object.keys(ALIASES)) {
    if (key.includes(a) || a.includes(key)) return ICONS[ALIASES[a]]
  }
  return undefined
}

/**
 * Resolve any AI/wizard/heuristic name to a CANONICAL registry key
 * (the key in ICONS), or null if only the default applies. Same resolution
 * order as resolveIcon. Used to look up per-icon animated components.
 */
export function resolveIconKey(name?: string | null): string | null {
  if (!name) return null
  const key = normalize(name)
  if (ICONS[key]) return key
  if (ALIASES[key]) return ALIASES[key]
  const singular = key.replace(/s$/, '')
  if (ICONS[singular]) return singular
  if (ALIASES[singular]) return ALIASES[singular]
  for (const k of Object.keys(ICONS)) {
    if (key.includes(k) || k.includes(key)) return k
  }
  for (const a of Object.keys(ALIASES)) {
    if (key.includes(a) || a.includes(key)) return ALIASES[a]
  }
  return null
}

/**
 * Turn any AI/wizard/heuristic icon name into a real component.
 * Resolution order: canonical -> alias -> fuzzy contains -> default.
 * Never returns undefined.
 */
export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return DEFAULT_ICON
  const key = normalize(name)
  if (ICONS[key]) return ICONS[key]
  if (ALIASES[key]) return ICONS[ALIASES[key]]
  // strip a trailing plural "s" (shoes already keyed, but "gifts" etc.)
  const singular = key.replace(/s$/, '')
  if (ICONS[singular]) return ICONS[singular]
  if (ALIASES[singular]) return ICONS[ALIASES[singular]]
  return fuzzy(key) ?? DEFAULT_ICON
}

/** All canonical keys — the source of truth for the AI vocabulary. */
export const ICON_KEYS = Object.keys(ICONS)

export type { LucideIcon }
