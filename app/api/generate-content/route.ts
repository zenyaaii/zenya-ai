import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateContentSchema } from '@/utils/validators'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const name = parsed.data.name
  const description = parsed.data.description || ''
  const audience = parsed.data.audience || 'dropshippers and one-product store buyers'

  const getMockContent = (productName: string) => ({
    hero: {
      headline: `The Ultimate ${productName}`,
      subheadline: "Experience perfection in every detail with the most advanced design on the market.",
      cta: "Get 50% Off Today"
    },
    slideshow: [
      { heading: `Welcome to the Future of ${productName}`, subheading: "Discover the innovation that everyone is talking about.", cta: "Shop Collection" },
      { heading: "Engineered for Excellence", subheading: "Quality that stands the test of time.", cta: "Learn More" }
    ],
    video_hero: {
      heading: "Cinematic Excellence",
      subheading: "Immerse yourself in the story behind the brand.",
      cta: "Watch Film"
    },
    features: [
      { title: "Eco-Friendly Materials", desc: "Crafted with 100% sustainable materials that are built to last a lifetime.", icon: "leaf" },
      { title: "Ergonomic Design", desc: "Designed by experts to fit perfectly in your life, maximizing comfort and utility.", icon: "design" },
      { title: "Instant Setup", desc: "Ready to use right out of the box. No complicated manuals or tools required.", icon: "bolt" }
    ],
    problem: {
      headline: "Tired of cheap alternatives that break?",
      text: "Most products on the market are built with planned obsolescence in mind. They look good but fail when you need them most, leaving you frustrated and out of pocket."
    },
    solution: {
      headline: `Meet the ${productName}`,
      text: "We engineered this from the ground up to solve every pain point. Durable, stylish, and incredibly effective—it is the last one you will ever need to buy."
    },
    testimonials: [
      { name: "Sarah J.", text: "This changed my daily routine completely. Highly recommended!", location: "New York, USA", rating: 5 },
      { name: "Mike T.", text: "Best investment I've made this year. Quality is unmatched.", location: "London, UK", rating: 5 },
      { name: "Jessica L.", text: "Fast shipping and great customer service. 10/10.", location: "Sydney, AU", rating: 5 }
    ],
    faq: [
      { q: "Is this suitable for beginners?", a: "Absolutely! It is designed for all skill levels." },
      { q: "How do I clean it?", a: "Just wipe it down with a damp cloth after use." },
      { q: "What is the warranty?", a: "We offer a full 5-year comprehensive warranty." },
      { q: "Do you ship internationally?", a: "Yes, we ship to over 50 countries worldwide." }
    ],
    guarantee: {
      title: "Ironclad 30-Day Guarantee",
      text: "Try it risk-free. If you aren't completely blown away, simply return it for a full refund. No questions asked.",
      days: 30
    },
    rich_text: {
      title: "Our Mission",
      text: "We believe in creating products that actually solve problems, not just add clutter to your life."
    },
    image_text: {
      title: "Designed for Real Life",
      text: "We spent 2 years prototyping to ensure every curve and edge serves a purpose.",
      cta: "Read Our Story"
    },
    newsletter: {
      title: "Join the Inner Circle",
      text: "Get exclusive access to new drops and secret sales."
    },
    timeline: [
      { year: "2020", title: "The Idea", text: "It started with a sketch on a napkin." },
      { year: "2021", title: "Prototyping", text: "We tested 50+ iterations to get it right." },
      { year: "2023", title: "Launch", text: "We shared our creation with the world." }
    ],
    scrolling_text: [
      "Free Worldwide Shipping", "30-Day Money Back Guarantee", "Over 10,000 Happy Customers", "Rated 5 Stars"
    ],
    comparison: [
      { feature: "Premium Materials", us: true, them: false },
      { feature: "24/7 Support", us: true, them: false },
      { feature: "Lifetime Warranty", us: true, them: false },
      { feature: "Eco-Friendly", us: true, them: false }
    ],
    multicolumn: [
      { title: "Fast Shipping", text: "We ship within 24 hours of your order." },
      { title: "Secure Payment", text: "Your data is protected by 256-bit encryption." },
      { title: "Expert Support", text: "Our team is here to help you 24/7." }
    ],
    contact: {
      heading: "Get in Touch",
      subheading: "We'd love to hear from you. Our team is always here to help."
    },
    upsell: { heading: "Frequently Bought Together" },
    volume_bundles: { 
      heading: "Stock Up & Save",
      label_buy_1: "Buy 1 (Standard)",
      label_buy_2: "Buy 2 (Save 15%)",
      label_buy_3: "Buy 3 (Save 25%)"
    },
    countdown: { heading: "Limited Time Offer", timer_text: "Offer ends in:" },
    logo_list: { heading: "As Seen In" },
    before_after: { heading: "Real Results", label_before: "Before", label_after: "After" },
    stats: [
      { value: "10,000+", label: "Happy Customers" },
      { value: "4.9/5", label: "Average Rating" },
      { value: "24/7", label: "Support" }
    ],
    visual_showcase: { heading: "Experience the Difference", subheading: "See every detail up close." },
    how_it_works: [
      { title: "Order Online", text: "Choose your favorite options and place your order securely." },
      { title: "We Ship Fast", text: "Your package leaves our warehouse within 24 hours." },
      { title: "Enjoy!", text: "Experience the quality and difference yourself." }
    ],
    trust_badges: { heading: "Shop with Confidence" },
    accordion: [
      { title: "Specifications", content: "High-quality materials designed to last." },
      { title: "Shipping Info", content: "Free worldwide shipping on all orders." },
      { title: "Care Instructions", content: "Wipe clean with a damp cloth." }
    ],
    tabs: [
      { title: "Description", content: "The ultimate solution for your needs." },
      { title: "Shipping", content: "We ship worldwide with tracking." },
      { title: "Returns", content: "30-day money back guarantee." }
    ]
  })
  
  if (!process.env.OPENAI_API_KEY) {
    // Mock response for development/no-key scenarios
    await new Promise(r => setTimeout(r, 2000))
    return NextResponse.json(getMockContent(name))
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are an elite Direct Response Copywriter and Brand Strategist for 7-figure e-commerce brands. You specialize in high-ticket dropshipping and premium brand building.

          YOUR GOAL:
          To generate high-converting, trust-building, and emotionally resonant copy for a Shopify store. The copy must feel "expensive", authoritative, and deeply researched.

          CRITICAL RESEARCH PHASE (Internal Monologue):
          Before writing any copy, you must perform a "Deep Dive Simulation" on the product niche:
          1.  Identify the "Bleeding Neck" pain point (the urgent problem).
          2.  Define the "Dream Outcome" (what life looks like after the product).
          3.  Analyze 3 common competitor failures (e.g., "breaks easily", "slow shipping", "poor support").
          4.  Establish the "Mechanism of Action" (how the product actually delivers results).

          TONE & STYLE GUIDELINES:
          -   **NO AI CLICHÉS**: Strictly avoid words like "unleash", "elevate", "unlock", "game-changer", "comprehensive", "landscape", "delve".
          -   **Specifics Build Trust**: Use concrete numbers, specific materials, and tangible benefits (e.g., instead of "high quality", say "aircraft-grade aluminum").
          -   **Authority & Empathy**: Sound like an expert who understands the customer's struggle.
          -   **Short & Punchy**: Use fragments for impact. "Built for speed. Engineered for life."
          -   **Risk Reversal**: Constantly reassure the user (guarantees, support, social proof).

          OUTPUT STRUCTURE:
          Return strictly a JSON object. You MUST include a "_strategy" object first to prove your research.` 
        },
        { 
          role: 'user', 
          content: `Product Name: ${name}
          Target Audience: ${audience}
          Context/Description: ${description}
          
          Generate content for the following sections. Ensure every word earns its place.

          JSON Structure:
          {
            "_strategy": {
              "target_avatar": "Specific description of the ideal customer",
              "core_pain_point": "The deep, emotional problem they face",
              "unique_mechanism": "The specific feature/tech that solves it",
              "competitor_weakness": "What cheap alternatives get wrong"
            },
            "hero": {
              "headline": "5-7 words. The Big Promise. Use power words.",
              "subheadline": "2 sentences. The 'How' and the 'Why'. Address the primary objection immediately.",
              "cta": "Action-oriented (e.g., 'Claim Offer', 'Shop Now - 50% Off')."
            },
            "slideshow": [
              { "heading": "Brand Statement or Collection Highlight", "subheading": "Evocative, lifestyle-focused copy.", "cta": "Explore Collection" },
              { "heading": "Secondary Value Prop (e.g., Engineering)", "subheading": "Focus on quality and durability.", "cta": "View Details" }
            ],
            "video_hero": {
              "heading": "Cinematic & immersive title.",
              "subheading": "Invitation to witness the product in action.",
              "cta": "Watch the Film"
            },
            "features": [
              { "title": "Benefit 1 (The Outcome)", "desc": "Explain the feature that delivers this outcome. Be specific.", "icon": "shield" },
              { "title": "Benefit 2 (The Experience)", "desc": "How it feels to use. Sensory details.", "icon": "zap" },
              { "title": "Benefit 3 (The Assurance)", "desc": "Durability, safety, or speed.", "icon": "check" }
            ],
            "problem": {
              "headline": "Hook the reader with their #1 complaint about current solutions.",
              "text": "Agitate the pain. Describe the frustration of using inferior products. Make them nod in agreement."
            },
            "solution": {
              "headline": "Introduce ${name} as the only logical solution.",
              "text": "Explain the 'Mechanism of Action'. Why is this different? Use words like 'Precision-engineered', 'Proprietary', 'Verified'."
            },
            "testimonials": [
              { "name": "Full Name", "text": "A specific story of transformation. Mention a skepticism they had and how the product resolved it.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on shipping speed and customer service. Builds trust in the business.", "location": "City, Country", "rating": 5 },
              { "name": "Full Name", "text": "Focus on product quality and durability vs. competitors.", "location": "City, Country", "rating": 5 }
            ],
            "faq": [
              { "q": "High-intent objection 1 (e.g., Will this work for me?)", "a": "Confident, 'yes, because...' answer." },
              { "q": "High-intent objection 2 (e.g., Shipping times?)", "a": "Specifics about processing and delivery speed." },
              { "q": "High-intent objection 3 (e.g., Warranty/Returns?)", "a": "Restate the risk-free guarantee." },
              { "q": "Technical/Usage question?", "a": "Simple, step-by-step clarification." }
            ],
            "guarantee": {
              "title": "Ironclad 30-Day Risk-Free Guarantee",
              "text": "We are so confident in our quality that if you are not 100% satisfied, simply return it for a full refund. We'll even cover the return shipping.",
              "days": 30
            },
            "rich_text": {
              "title": "Our Philosophy",
              "text": "Why we exist. Our commitment to quality/sustainability/innovation."
            },
            "image_text": {
              "title": "Lifestyle/Use Case Highlight",
              "text": "Paint a picture of life with the product.",
              "cta": "Read the Full Story"
            },
            "newsletter": {
              "title": "Join the Inner Circle",
              "text": "Unlock early access to new drops and an instant 10% discount code."
            },
            "timeline": [
              { "year": "Year 1", "title": "Inception", "text": "Identifying the gap in the market." },
              { "year": "Year 2", "title": "R&D", "text": "Rigorous testing and prototyping." },
              { "year": "Year 3", "title": "Global Launch", "text": "Delivering excellence worldwide." }
            ],
            "scrolling_text": [
              "Free Expedited Shipping", "30-Day Money Back Guarantee", "24/7 Priority Support", "Over 50,000 Satisfied Customers"
            ],
            "comparison": [
              { "feature": "Core Benefit 1", "us": true, "them": false },
              { "feature": "Core Benefit 2", "us": true, "them": false },
              { "feature": "Core Benefit 3", "us": true, "them": false },
              { "feature": "Core Benefit 4", "us": true, "them": false }
            ],
            "multicolumn": [
              { "title": "Benefit A", "text": "Detail A" },
              { "title": "Benefit B", "text": "Detail B" },
              { "title": "Benefit C", "text": "Detail C" }
            ],
            "contact": {
              "heading": "We're Here to Help",
              "subheading": "Our expert support team typically replies within 2 hours."
            },
            "upsell": { "heading": "Frequently Bought Together" },
            "volume_bundles": { 
              "heading": "Stock Up & Save",
              "label_buy_1": "Single Pack",
              "label_buy_2": "Double Pack (Save 15%)",
              "label_buy_3": "Family Pack (Save 25%)"
            },
            "countdown": { "heading": "Limited Time Launch Offer", "timer_text": "Offer expires in:" },
            "logo_list": { "heading": "Featured In" },
            "before_after": { "heading": "Real Results", "label_before": "Before", "label_after": "After" },
            "stats": [
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" },
              { "value": "Number", "label": "Metric" }
            ],
            "visual_showcase": { "heading": "Precision Engineering", "subheading": "Every detail matters." },
            "how_it_works": [
              { "title": "Step 1", "text": "Action" },
              { "title": "Step 2", "text": "Action" },
              { "title": "Step 3", "text": "Result" }
            ],
            "trust_badges": { "heading": "100% Secure Checkout" },
            "accordion": [
              { "title": "Detail 1", "content": "Info" },
              { "title": "Detail 2", "content": "Info" },
              { "title": "Detail 3", "content": "Info" }
            ],
            "tabs": [
              { "title": "Description", "content": "Info" },
              { "title": "Shipping", "content": "Info" },
              { "title": "Returns", "content": "Info" }
            ]
          }
          ` 
        }
      ],
      response_format: { type: 'json_object' }
    })
    
    const content = resp.choices[0]?.message?.content
    if (!content) throw new Error('No content from OpenAI')
    
    return NextResponse.json(JSON.parse(content))
  } catch (error: any) {
    console.error('OpenAI Error (Falling back to mock):', error)
    // Fallback to mock content instead of erroring
    return NextResponse.json(getMockContent(name))
  }
}
