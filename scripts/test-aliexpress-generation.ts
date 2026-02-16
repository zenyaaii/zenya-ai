
import { prepareThemeZip } from '../utils/shopify-generator';
import * as fs from 'fs';
import * as path from 'path';

const aliExpressProduct = {
  name: "LuxeLeather Crossbody",
  shopName: "LuxeLeather Official",
  colors: {
    primary: "#000000", // Black
    secondary: "#D4AF37" // Gold
  },
  content: {
    hero: {
      headline: "Timeless Elegance, Everyday Utility",
      subheadline: "The Fashionable Black PU Leather Crossbody Bag that elevates any outfit. Premium quality without the premium price tag.",
      cta: "Shop The Collection"
    },
    features: [
      { title: "Premium PU Leather", desc: "Soft, durable, and identical to the real thing. 100% Cruelty-free.", icon: "star" },
      { title: "Smart Organization", desc: "Includes dedicated cell phone and silt pockets to keep your essentials safe.", icon: "layout" },
      { title: "Perfect Dimensions", desc: "Compact 27x15x3cm design that fits everything you need.", icon: "maximize" }
    ],
    problem: {
      headline: "Tired of bulky bags that ruin your outfit?",
      text: "Most handbags are either too big and heavy or too small to fit your phone. You shouldn't have to sacrifice style for functionality."
    },
    solution: {
      headline: "Meet the LuxeLeather Crossbody",
      text: "Designed for the modern woman. Sleek, lightweight, and surprisingly spacious. It's the only bag you'll need for both casual days and luxury nights."
    },
    testimonials: [
      { name: "Anna R.", text: "Super handy and stylish bag! Good quality, sturdy material, and enough space. Definitely recommended!", location: "Netherlands", rating: 5 },
      { name: "Customer", text: "I really liked the bag; it's an exact replica of the original, the price is very reasonable.", location: "USA", rating: 5 },
      { name: "H. N.", text: "The quality is good, the logos are present, neatly made. I recommend it.", location: "Germany", rating: 5 }
    ],
    faq: [
      { q: "Is the material real leather?", a: "It is a high-quality PU leather that looks and feels like the real thing, but is 100% vegan." },
      { q: "Will my phone fit?", a: "Yes! It fits all standard smartphones including Pro Max models." },
      { q: "How long does shipping take?", a: "We offer fast delivery worldwide, typically arriving within 7-10 days." },
      { q: "What is the return policy?", a: "We offer a 90-day free return policy if you are not satisfied." }
    ],
    guarantee: {
      title: "90-Day Money Back Guarantee",
      text: "Try it risk-free. If you don't love it, return it for a full refund.",
      days: 90
    },
    
    // NEW DYNAMIC SECTIONS
    slideshow: [
      { heading: "New Collection 2025", subheading: "Discover the retro single shoulder envelope bag.", cta: "View Lookbook" },
      { heading: "Luxury Design", subheading: "Casual ladies' fashion at its finest.", cta: "Shop Now" }
    ],
    video_hero: {
      heading: "See It In Action",
      subheading: "Watch how the LuxeLeather Crossbody fits into your daily life.",
      cta: "Watch Video"
    },
    timeline: [
      { year: "2024", title: "Design Phase", text: "We scouted the latest trends in Paris and Milan." },
      { year: "2025", title: "Launch", text: "Released the Retro Single Shoulder Envelope Bag to critical acclaim." }
    ],
    rich_text: {
      title: "Our Philosophy",
      text: "We believe luxury shouldn't cost a fortune. We work directly with manufacturers to bring you high-end designs at honest prices."
    },
    image_text: {
      title: "Styled for You",
      text: "Whether you're wearing jeans or a dress, this bag complements every look.",
      cta: "See Styling Tips"
    },
    newsletter: {
      title: "Join the VIP List",
      text: "Get 10% off your first order and early access to new colors."
    },
    scrolling_text: [
      "Free Shipping Worldwide", "90-Day Returns", "Premium Quality", "2000+ Sold"
    ],
    comparison: [
      { feature: "Price", us: true, them: false },
      { feature: "Quality Material", us: true, them: false },
      { feature: "Fast Shipping", us: true, them: false },
      { feature: "Customer Support", us: true, them: false }
    ],
    multicolumn: [
      { title: "Free Shipping", text: "On all orders over $50." },
      { title: "Secure Checkout", text: "Encrypted payments." },
      { title: "24/7 Support", text: "We are here to help." }
    ],
    contact: {
      heading: "Need Help?",
      subheading: "Our team is available 24/7 to answer your questions."
    },
    upsell: {
      heading: "Complete The Look"
    },
    volume_bundles: {
      heading: "Buy More, Save More",
      label_buy_1: "1 Bag (Standard)",
      label_buy_2: "2 Bags (Gift One)",
      label_buy_3: "3 Bags (Family Pack)"
    },
    countdown: {
      heading: "Flash Sale Ends Soon",
      timer_text: "Offer expires in:"
    },
    logo_list: {
      heading: "As Seen In"
    },
    before_after: {
      heading: "Transformation",
      label_before: "Messy Purse",
      label_after: "Organized Luxe"
    },
    stats: [
      { value: "2,000+", label: "Bags Sold" },
      { value: "4.7/5", label: "Average Rating" },
      { value: "90", label: "Day Return Policy" }
    ],
    visual_showcase: {
      heading: "Detail Oriented",
      subheading: "From the stitching to the zippers, every detail matters."
    },
    how_it_works: [
      { title: "Choose Color", text: "Select from Black, White, or Golden." },
      { title: "Place Order", text: "Secure checkout in seconds." },
      { title: "Fast Delivery", text: "Track your package to your door." }
    ],
    trust_badges: {
      heading: "Shop with Confidence"
    },
    accordion: [
      { title: "Dimensions", content: "27x15x3cm" },
      { title: "Material", content: "High quality PU Leather + Polyester Lining" },
      { title: "Strap Type", content: "Single shoulder / Crossbody" }
    ],
    tabs: [
      { title: "Description", content: "Fashionable Black PU Leather Ladies Crossbody Bag 2025 New Style." },
      { title: "Shipping", content: "We ship via PostNL, DHL, and others." },
      { title: "Reviews", content: "See what our 200+ happy customers are saying." }
    ]
  }
};

async function run() {
  console.log("Generating theme for:", aliExpressProduct.name);
  
  try {
    const zip = prepareThemeZip(aliExpressProduct.name, aliExpressProduct.content, aliExpressProduct.colors);
    
    // Generate nodebuffer
    const content = await zip.generateAsync({ type: "nodebuffer" });
    
    const outputPath = path.resolve(__dirname, '../aliexpress-theme-test.zip');
    fs.writeFileSync(outputPath, content);
    
    console.log("✅ Theme successfully generated at:", outputPath);
    console.log("Size:", (content.length / 1024 / 1024).toFixed(2), "MB");
    
  } catch (error) {
    console.error("❌ Error generating theme:", error);
  }
}

run();
