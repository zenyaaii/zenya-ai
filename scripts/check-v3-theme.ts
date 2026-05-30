import fs from 'node:fs';
import path from 'node:path';
import { generateShopifyThemeV3OneProduct } from '../utils/shopify-generator-v3';

async function run() {
  const blob = await generateShopifyThemeV3OneProduct(
    {
      brand: { name: 'Zenya Premium', tagline: 'Premium one-product storefront.' },
      hero: {
        heading: 'A premium storefront that passes Shopify checks',
        subheading: 'Built for conversion, editing, and safer upload into Shopify.',
        primaryLabel: 'Shop now',
        secondaryLabel: 'Learn more'
      },
      highlights: [
        { title: 'Fast shipping', text: 'Tracked delivery and a cleaner customer experience.' },
        { title: 'Secure checkout', text: 'Simple Shopify-native buying flow.' },
        { title: 'Premium design', text: 'A more polished storefront from the generator.' }
      ],
      testimonials: [
        { name: 'Sarah', text: 'Looks much more premium now.' },
        { name: 'Adam', text: 'The editor experience is cleaner too.' },
        { name: 'Lina', text: 'Upload and validation feel safer.' }
      ],
      faq: [
        { question: 'Can I edit this later?', answer: 'Yes, inside Shopify Theme Editor.' },
        { question: 'Does it validate better now?', answer: 'Yes, that is what this check is verifying.' }
      ],
      product: { reassurance: 'Tracked shipping, safe checkout, and easy edits.' }
    },
    {
      primary: '#5b5bd6',
      accent: '#22c55e',
      background: '#f5f7fb',
      surface: '#ffffff',
      text: '#111827'
    }
  );

  const buffer = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(path.resolve(process.cwd(), 'tmp-v3-theme-check.zip'), buffer);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
