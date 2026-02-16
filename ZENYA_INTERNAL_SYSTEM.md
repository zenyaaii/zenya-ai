# ZENYA AI - INTERNAL SYSTEM & ARCHITECTURE WIKI

> **INTERNAL USE ONLY**: This document serves as the "Source of Truth" for the Zenya AI team. Refer to this when you need to recall our core identity, system logic, or technical workflow.

---

## 1. WHO WE ARE (Core Identity)
**We are NOT a Theme Store.** We are a **Theme Generator**.
*   **Company Name**: Zenya AI
*   **Product**: An AI-powered SaaS platform that builds custom Shopify themes in seconds.
*   **Mission**: To automate the manual process of Shopify store creation (design, copywriting, coding) using AI.

## 2. HOW THE SYSTEM WORKS (The Engine)

### The 4-Step Generation Flow
1.  **User Input (The Trigger)**
    *   **Text Prompt**: User types "A luxury watch store with a dark, gold aesthetic."
    *   **Product Link (Planned)**: User pastes an AliExpress/Amazon link -> System scrapes product details.

2.  **AI Processing (The Brain)**
    *   We send the input to an LLM (Large Language Model).
    *   The LLM returns a structured **JSON Object** containing:
        *   `copy`: Headlines, descriptions, testimonials, FAQ.
        *   `design`: Color palette (Primary, Secondary, Background), Font choices.
        *   `structure`: Which sections to use (Hero, Features, Video) and in what order.

3.  **Theme Assembly (The Builder)**
    *   **Script**: `utils/shopify-generator.ts` is the core builder script.
    *   **The Master Theme**: We maintain a "Skeleton Theme" (Liquid files) in our repository.
    *   **Injection**: The script takes the AI's JSON and "injects" it into the Master Theme's `settings_data.json` and `templates/index.json`.
    *   **Asset Bundling**: It bundles the modified Liquid files + config + assets (Tailwind/Alpine) into a ZIP.

4.  **Delivery (The Output)**
    *   The user receives a `zenya-theme-release.zip`.
    *   They upload this to Shopify -> The store is live and looks exactly like the AI designed it.

---

## 3. THE "MASTER THEME" (Our Foundation)
*   **What it is**: The collection of `.liquid` files in `shopify-theme/`.
*   **Why we edit it**: This is the *template* for every generated store.
    *   If the Master Theme has a **404 error**, *every* generated store will have a 404 error.
    *   If the Master Theme has **bad mobile view**, *every* generated store will have bad mobile view.
*   **Key Tech**:
    *   **Tailwind CSS**: For styling (utility-first, easy for AI to manipulate via config).
    *   **Alpine.js**: For interactivity (cart drawers, sliders, variant pickers) without heavy jQuery/React.
    *   **Shopify 2.0**: Uses JSON templates (`index.json`) for modularity.

---

## 4. TARGET USER & USE CASES
*   **The "Lazy" Entrepreneur**: Wants to test a dropshipping product immediately. Doesn't want to learn design.
*   **The "Non-Tech" Founder**: Has a great product but is scared of website builders.
*   **The Agency Scaler**: Uses Zenya to build the "base" for a client in 30 seconds, then charges for custom tweaks.

## 5. TECHNICAL ARCHITECTURE
*   **Frontend**: Next.js (The dashboard where users type prompts).
*   **Backend API**: Handles the AI requests and Zip generation.
*   **Generator Logic**: `jszip` (library) creates the file structure in memory.
*   **Validation**: We run scripts (like `validate_index.py`) to ensure our generated JSON is valid Shopify code.

---

## 6. CURRENT DEVELOPMENT FOCUS
*   **Stability**: Ensuring the Master Theme never throws errors (404s, invalid Liquid).
*   **Compliance**: Meeting Shopify Theme Store requirements (e.g., "Max 2 words per preset").
*   **Quality**: Adding high-conversion sections (Volume Bundles, Sticky ATC) to the Master Theme so AI can use them.

---

**REMEMBER**: We are building the **tool** that builds the themes. The theme itself is just the output.
