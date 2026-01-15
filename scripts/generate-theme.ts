import fs from 'fs';
import path from 'path';
import { prepareThemeZip } from '../utils/shopify-generator';

const content = {
  hero: { headline: "Welcome to Zenya", subheadline: "The Future of E-commerce", cta: "Shop Now" },
  features: [
    { title: "Fast Shipping", desc: "Get it tomorrow", icon: "truck" },
    { title: "Secure Payment", desc: "100% Secure", icon: "lock" },
    { title: "24/7 Support", desc: "We are here for you", icon: "phone" }
  ],
  problem: { headline: "Tired of Slow Stores?", text: "Most stores are slow and ugly." },
  solution: { headline: "Zenya is Fast", text: "We optimized everything for speed." },
  testimonials: [
    { name: "Alice", text: "Amazing theme!", location: "NY", rating: 5 },
    { name: "Bob", text: "Increased my sales", location: "CA", rating: 5 }
  ],
  faq: [
    { q: "Is it fast?", a: "Yes, very." },
    { q: "Is it responsive?", a: "Yes, fully." }
  ],
  guarantee: { title: "30-Day Money Back", text: "No questions asked", days: 30 },
  shopName: "Zenya Demo Store",
  slideshow: [{ heading: "Slide 1", subheading: "Sub 1", cta: "Button 1" }],
  video_hero: { heading: "Watch Video", subheading: "See it in action", cta: "Play" },
  timeline: [{ year: "2023", title: "Founded", text: "We started here" }],
  rich_text: { title: "About Us", text: "We are cool." },
  image_text: { title: "Our Story", text: "Long story short...", cta: "Read More" },
  newsletter: { title: "Stay Updated", text: "Join our list" },
  scrolling_text: ["Free Shipping", "Sale Now On", "New Arrivals"],
  comparison: [{ feature: "Speed", us: true, them: false }],
  multicolumn: [{ title: "Column 1", text: "Text 1" }]
};

const colors = { primary: "#3b82f6", secondary: "#1e293b" };

async function run() {
  console.log("Generating theme...");
  try {
    const zip = await prepareThemeZip("Zenya Theme", content, colors) as any;
    
    // Check if generateAsync exists (it should since it's JSZip)
    if (zip.generateAsync) {
        const buffer = await zip.generateAsync({ type: "nodebuffer" });
        const outputPath = path.resolve(__dirname, "../zenya-theme-latest.zip");
        fs.writeFileSync(outputPath, buffer);
        console.log(`Theme saved to ${outputPath}`);
    } else {
        console.error("zip.generateAsync is not a function. Check JSZip version or usage.");
    }

  } catch (error) {
    console.error("Error generating theme:", error);
  }
}

run();
