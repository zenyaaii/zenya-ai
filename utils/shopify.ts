/**
 * Creates the scraped product in a merchant's Shopify store.
 *
 * GraphQL, not REST. Creating products through REST `products.json` has been
 * deprecated since 2024-04 and new public apps must use the GraphQL Admin API
 * only, so this module uses `productCreate` + `productVariantsBulkUpdate`.
 *
 * What the merchant gets:
 *   • every image they picked (up to MAX_IMAGES), re-hosted on Shopify's CDN.
 *     We download each image ourselves and hand Shopify the bytes through a
 *     staged upload, because supplier CDNs (AliExpress especially) often refuse
 *     Shopify's own fetcher. If our download fails we still pass the URL and
 *     let Shopify try.
 *   • the price and the "was" price they typed — never a default.
 *   • stock NOT tracked. The theme and admin would otherwise show "0 in stock"
 *     for a dropshipping product nobody counted.
 *   • the product published to the Online Store, so the theme can find it.
 *     That needs `write_publications`; without it the product is created as a
 *     hidden draft-for-the-store and `published: false` tells the caller to
 *     ask the merchant for one click.
 */
import { adminGraphql } from '@/lib/build/shopify-push'

const MAX_IMAGES = 10
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const IMAGE_FETCH_TIMEOUT_MS = 8000

export type CreatedShopifyProduct = {
  /** Numeric id, as used in admin URLs. */
  id: string
  gid: string
  handle: string | null
  /** True when the product is visible on the Online Store. */
  published: boolean
  /** Why it isn't, when it isn't. */
  publishError: string | null
  /** Images Shopify was given (it processes them in the background). */
  imageCount: number
}

function numericId(gid: string): string {
  return gid.split('/').pop() || gid
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Scraped text → safe HTML paragraphs. Scraped pages are not trusted markup. */
function descriptionHtml(text: string): string {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function userErrors(label: string, errs: Array<{ field?: string[] | null; message: string }> | undefined) {
  if (errs?.length) throw new Error(`${label}: ${errs.map((e) => e.message).join('; ').slice(0, 300)}`)
}

async function downloadImage(url: string): Promise<{ bytes: ArrayBuffer; mimeType: string; filename: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    const mimeType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!mimeType.startsWith('image/')) return null
    const bytes = await res.arrayBuffer()
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
    let base = 'image'
    try {
      base = (new URL(url).pathname.split('/').pop() || 'image').split('.')[0].replace(/[^\w-]+/g, '') || 'image'
    } catch {}
    return { bytes, mimeType, filename: `${base.slice(0, 60)}.${ext}` }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Turn the picked image URLs into `originalSource` values Shopify can read:
 * a staged-upload resource URL where we could fetch the bytes, the original
 * URL where we couldn't.
 */
async function stageImages(shop: string, accessToken: string, urls: string[]): Promise<string[]> {
  const downloads = await Promise.all(urls.map(downloadImage))
  const toStage = downloads
    .map((d, i) => ({ d, i }))
    .filter((x): x is { d: NonNullable<typeof x.d>; i: number } => x.d !== null)

  const sources = [...urls]
  if (toStage.length === 0) return sources

  try {
    const data = await adminGraphql(
      shop,
      accessToken,
      `mutation ZenyaStagedImages($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`,
      {
        input: toStage.map(({ d }) => ({
          resource: 'IMAGE',
          filename: d.filename,
          mimeType: d.mimeType,
          httpMethod: 'POST',
          fileSize: String(d.bytes.byteLength),
        })),
      },
    )
    userErrors('stagedUploadsCreate', data?.stagedUploadsCreate?.userErrors)
    const targets = data?.stagedUploadsCreate?.stagedTargets || []

    await Promise.all(
      toStage.map(async ({ d, i }, k) => {
        const target = targets[k]
        if (!target?.url || !target?.resourceUrl) return
        const form = new FormData()
        for (const p of target.parameters || []) form.append(p.name, p.value)
        form.append('file', new Blob([d.bytes], { type: d.mimeType }), d.filename)
        const up = await fetch(target.url, { method: 'POST', body: form }).catch(() => null)
        if (up && (up.ok || up.status === 201)) sources[i] = target.resourceUrl
      }),
    )
  } catch (e) {
    // Staging is an improvement, not a requirement: fall back to the URLs.
    console.warn('stageImages: staged upload failed, passing URLs instead:', e)
  }
  return sources
}

async function publishToOnlineStore(shop: string, accessToken: string, productGid: string): Promise<string | null> {
  try {
    const data = await adminGraphql(
      shop,
      accessToken,
      `query ZenyaPublications { publications(first: 25) { nodes { id catalog { title } } } }`,
      {},
    )
    const nodes: Array<{ id: string; catalog?: { title?: string } | null }> = data?.publications?.nodes || []
    const online = nodes.find((n) => /online store/i.test(n.catalog?.title || ''))
    if (!online) return 'The store has no Online Store sales channel.'

    const res = await adminGraphql(
      shop,
      accessToken,
      `mutation ZenyaPublish($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`,
      { id: productGid, input: [{ publicationId: online.id }] },
    )
    userErrors('publishablePublish', res?.publishablePublish?.userErrors)
    return null
  } catch (e: any) {
    const msg = String(e?.message || e)
    // Older installs granted only write_products. Say so plainly.
    if (/access denied|publications/i.test(msg)) {
      return 'Zenya is missing permission to publish products (write_publications). Reconnect the store, or press Publish on the product in Shopify.'
    }
    return msg.slice(0, 300)
  }
}

export async function createShopifyProduct(
  shop: string,
  accessToken: string,
  productData: {
    name: string
    description: string
    images: string[]
    price: number
    originalPrice: number
    /** Brand shown on the product. Left out, Shopify uses the store's name. */
    vendor?: string
  },
): Promise<CreatedShopifyProduct> {
  const title = productData.name.trim()
  if (!title) throw new Error('Product name is required.')
  if (!Number.isFinite(productData.price) || productData.price <= 0) {
    throw new Error('A sale price above zero is required.')
  }

  const imageUrls = (productData.images || [])
    .map((u) => String(u || '').trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_IMAGES)
  const sources = await stageImages(shop, accessToken, imageUrls)

  const created = await adminGraphql(
    shop,
    accessToken,
    `mutation ZenyaProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }`,
    {
      product: {
        title,
        descriptionHtml: descriptionHtml(productData.description || ''),
        ...(productData.vendor?.trim() ? { vendor: productData.vendor.trim() } : {}),
        status: 'ACTIVE',
      },
      media: sources.map((src) => ({ originalSource: src, mediaContentType: 'IMAGE', alt: title })),
    },
  )
  userErrors('productCreate', created?.productCreate?.userErrors)
  const product = created?.productCreate?.product
  if (!product?.id) throw new Error('productCreate returned no product.')

  const variantId = product.variants?.nodes?.[0]?.id
  if (variantId) {
    const compareAt =
      Number.isFinite(productData.originalPrice) && productData.originalPrice > productData.price
        ? productData.originalPrice.toFixed(2)
        : null
    const priced = await adminGraphql(
      shop,
      accessToken,
      `mutation ZenyaVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id }
          userErrors { field message }
        }
      }`,
      {
        productId: product.id,
        variants: [{
          id: variantId,
          price: productData.price.toFixed(2),
          compareAtPrice: compareAt,
          inventoryItem: { tracked: false },
        }],
      },
    )
    userErrors('productVariantsBulkUpdate', priced?.productVariantsBulkUpdate?.userErrors)
  }

  const publishError = await publishToOnlineStore(shop, accessToken, product.id)

  return {
    id: numericId(product.id),
    gid: product.id,
    handle: product.handle || null,
    published: publishError === null,
    publishError,
    imageCount: sources.length,
  }
}

export async function upsertProductMetafield(params: {
  shop: string
  accessToken: string
  productId: number | string
  namespace: string
  key: string
  type: string
  value: unknown
}) {
  const { shop, accessToken, productId, namespace, key, type, value } = params
  const ownerId = String(productId).startsWith('gid://') ? String(productId) : `gid://shopify/Product/${productId}`

  const data = await adminGraphql(
    shop,
    accessToken,
    `mutation ZenyaMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id }
        userErrors { field message }
      }
    }`,
    {
      metafields: [{
        ownerId,
        namespace,
        key,
        type,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }],
    },
  )
  userErrors('metafieldsSet', data?.metafieldsSet?.userErrors)
  return data?.metafieldsSet?.metafields?.[0] || null
}
