export default function Head() {
  const apiKey = process.env.SHOPIFY_API_KEY || ''
  return (
    <>
      <meta name="shopify-api-key" content={apiKey} />
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key={apiKey} />
    </>
  )
}
