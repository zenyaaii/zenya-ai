# Deployment Guide

Follow these steps to deploy Zenya AI to Vercel and configure it for Shopify.

## Prerequisites

1.  **Unpause Supabase:** Ensure your Supabase project is active. The build logs showed connection errors, which means the database is unreachable.
    *   Go to [Supabase Dashboard](https://supabase.com/dashboard).
    *   Click "Restore" if the project is paused.

## Part 1: Deploy to Vercel

1.  **Install Vercel CLI** (if not installed):
    ```bash
    npm install -g vercel
    ```

2.  **Deploy:**
    Run the following command in your terminal:
    ```bash
    vercel
    ```
    *   Follow the prompts (Log in, select project settings).
    *   **Important:** When asked `Want to modify these settings? [y/N]`, answer **N** (defaults are usually correct).

3.  **Add Environment Variables:**
    Once the project is created on Vercel, go to the **Vercel Dashboard** > **Settings** > **Environment Variables**.
    Add the following variables (copy values from your `.env.local` file):

    *   `DATABASE_URL`
    *   `DIRECT_URL`
    *   `SHOPIFY_API_KEY`
    *   `SHOPIFY_API_SECRET`
    *   `SHOPIFY_APP_URL` (Set this to your new Vercel URL, e.g., `https://zenya-ai.vercel.app`)
    *   `SCOPES` (value: `read_products,read_themes,write_products,write_themes`)
    *   `HOST` (Same as `SHOPIFY_APP_URL`)
    *   `NEXTAUTH_SECRET`
    *   `NEXTAUTH_URL` (Same as `SHOPIFY_APP_URL`)

4.  **Redeploy:**
    After adding variables, you may need to redeploy for them to take effect:
    ```bash
    vercel --prod
    ```

## Part 2: Connect to Shopify

1.  **Get your Vercel URL:**
    Copy the domain Vercel gave you (e.g., `https://zenya-ai-xyz.vercel.app`).

2.  **Update Shopify Partner Dashboard:**
    *   Go to [Shopify Partners](https://partners.shopify.com/).
    *   Select your app (**Zenya AI**).
    *   Click **Configuration**.
    *   **App URL:** Paste your Vercel URL (e.g., `https://zenya-ai-xyz.vercel.app`).
    *   **Allowed Redirection URLs:** Add the following paths:
        *   `https://zenya-ai-xyz.vercel.app/api/auth/callback`
        *   `https://zenya-ai-xyz.vercel.app/api/shopify/callback`
        *   `https://zenya-ai-xyz.vercel.app/auth/callback`
    *   Click **Save**.

3.  **Update Config File (Optional but Recommended):**
    Update `shopify.app.zenya-ai.toml` locally with your new URLs so future deploys don't overwrite them.

## Part 3: Verify

1.  Open your Shopify Store.
2.  Go to **Apps** > **Zenya AI**.
3.  The app should load from Vercel.
4.  Try generating a theme to ensure the database connection works.
