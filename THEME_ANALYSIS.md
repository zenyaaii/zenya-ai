# Zenya AI Theme Analysis & Developer Guide

This document analyzes the architecture of the generated Shopify theme, specifically focusing on the Product Page logic, conversion tactics, and areas requiring manual configuration.

## 1. Product Page Architecture (`templates/product.json`)

The product page is designed as a **Direct Response Sales Page**, not a standard e-commerce product page. It consists of 4 vertically stacked sections:

| Order | Section Type | File | Purpose |
| :--- | :--- | :--- | :--- |
| 1 | `zenya-product` | `sections/zenya-product.liquid` | **Main Conversion Engine:** Images, Price, Bundles, Urgency. |
| 2 | `zenya-comparison` | `sections/zenya-comparison.liquid` | **Objection Handling:** "Us vs Them" comparison table. |
| 3 | `zenya-testimonials`| `sections/zenya-testimonials.liquid`| **Social Proof:** Reuses homepage testimonials. |
| 4 | `zenya-faq` | `sections/zenya-faq.liquid` | **Reassurance:** Accordion-style Q&A. |

---

## 2. Deep Dive: Main Product Section (`zenya-product.liquid`)

This section contains "grey hat" conversion tactics implemented via **Alpine.js**.

### A. Urgency Engines (Hardcoded)
These elements reset on every page load and are NOT connected to real data.

*   **Stock Counter:**
    *   **Logic:** `stock: 14` (Alpine.js state).
    *   **Behavior:** Shows a red progress bar and "Only 14 items left!".
    *   **Edit Location:** `shopify-generator.ts` -> `productLiquid` string.
*   **Countdown Timer:**
    *   **Logic:** `timeLeft: 43200` (12 hours in seconds).
    *   **Behavior:** Counts down every second. Resets on refresh.

### B. Volume Bundles (Pricing Disconnect)
The theme offers "Buy More, Save More" options:

*   **Option 1:** Buy 1 (Standard Price)
*   **Option 2:** Buy 2 (Save 15%)
*   **Option 3:** Buy 3 (Save 25%)

**⚠️ CRITICAL WARNING:**
The theme **VISUALLY** calculates the total price:
```javascript
get totalPrice() {
    // ... logic to multiply price * 0.85 ...
}
```
**HOWEVER**, the form only sends the `quantity` to Shopify.
*   **The Problem:** If a user clicks "Buy 3", Shopify adds 3 items to the cart at **FULL PRICE**.
*   **The Fix:** You MUST create "Automatic Discounts" in Shopify Admin:
    1.  **Discount 1:** "Buy 2 items, get 15% off".
    2.  **Discount 2:** "Buy 3 items, get 25% off".

---

## 3. Schema & Settings

These settings are editable in the Shopify Theme Editor ("Customize" button):

| Section | Setting ID | Description | Default |
| :--- | :--- | :--- | :--- |
| **Product** | `show_stock` | Toggle the fake stock counter. | `true` |
| **Product** | `guarantee_text` | Text inside the "Guarantee" dropdown. | Dynamic |
| **Comparison** | `heading` | Title of the table. | "Why Choose Us?" |
| **Comparison** | `us_label` | Label for your brand column. | Shop Name |
| **Comparison** | `them_label` | Label for competitor column. | "Others" |

---

## 4. Proposed Improvements (Action Items)

To make this theme "better" and easier to edit, we should:

1.  **Centralize Constants:** Move the `stock: 14` and `timeLeft: 43200` values out of the Liquid string into TypeScript constants at the top of `shopify-generator.ts`.
2.  **Dynamic Review Count:** The "1,234 Reviews" text is currently hardcoded. It should be a setting or connected to a metafield.
3.  **Bundle Configuration:** Allow the discount percentages (15%, 25%) to be passed as arguments to the generator function.
