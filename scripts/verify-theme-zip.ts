
import JSZip from 'jszip';
import * as fs from 'fs';
import * as path from 'path';

async function verify() {
  const zipPath = path.resolve(__dirname, '../aliexpress-theme-test.zip');
  console.log("Verifying zip at:", zipPath);
  
  const buffer = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(buffer);
  
  // 1. Check Header for SVG and Announcement logic
  const headerFile = zip.file('sections/zenya-header.liquid');
  if (headerFile) {
    const content = await headerFile.async('string');
    console.log("\n--- Checking Header Section ---");
    
    if (content.includes('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"')) {
      console.log("✅ Cart Icon SVG found.");
    } else {
      console.error("❌ Cart Icon SVG NOT found.");
    }
    
    if (content.includes('bg-red-500')) {
      console.log("✅ Red Cart Badge found.");
    } else {
      console.error("❌ Red Cart Badge NOT found.");
    }
  } else {
    console.error("❌ zenya-header.liquid not found in zip.");
  }
  
  // 2. Check Settings Schema for Dynamic Defaults
  const settingsFile = zip.file('config/settings_schema.json'); // Wait, shopify-generator writes to config/settings_schema.json?
  // Actually, let's check config/settings_data.json if we injected presets there, 
  // OR sections/zenya-header.liquid schema to see if the default value for announcement text is dynamic.
  
  if (headerFile) {
    const content = await headerFile.async('string');
    // We expect the default value to be injected into the schema JSON string
    // "default": "Flash Sale Ends Soon" (from our test data: content.countdown.heading)
    if (content.includes('"default": "Flash Sale Ends Soon"')) {
      console.log("✅ Dynamic Announcement Text Default found in Header Schema.");
    } else {
      console.error("❌ Dynamic Announcement Text Default NOT found. Found what?");
      // Print the schema part
      const schemaMatch = content.match(/announcement_text.*?default":\s*"(.*?)"/);
      if (schemaMatch) console.log("   Found:", schemaMatch[1]);
    }
  }

  // 3. Check a new section (e.g. Volume Bundles)
  const bundlesFile = zip.file('sections/zenya-volume-bundles.liquid');
  if (bundlesFile) {
     const content = await bundlesFile.async('string');
     console.log("\n--- Checking Volume Bundles Section ---");
     // Check for dynamic heading injection
     if (content.includes('"default": "Buy More, Save More"')) {
       console.log("✅ Dynamic Heading found in Volume Bundles.");
     } else {
       console.log("⚠️ Dynamic Heading check failed or schema structure differs.");
     }
  } else {
    // It might not be a separate file if we didn't add it in the generator yet? 
    // Wait, did we add all new sections to the generator?
    // The user's prompt said "if we generated for all the sections".
    // I need to check shopify-generator.ts to see if it actually writes 'zenya-volume-bundles.liquid'.
    // I remember reading the file and it stopped at Footer. 
    // I should check if the generator actually has the code to write these new sections.
    // If not, I need to add them!
  }
  
  // List all files in zip to see coverage
  console.log("\n--- Files in Zip ---");
  const files = Object.keys(zip.files);
  console.log("Total files:", files.length);
  const sections = files.filter(f => f.startsWith('sections/'));
  console.log("Sections count:", sections.length);
  // console.log(sections.join('\n'));
}

verify();
