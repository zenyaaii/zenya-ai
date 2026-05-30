interface ShopifyProduct {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  images: { src?: string; attachment?: string; filename?: string }[];
  variants: {
    price: string;
    compare_at_price?: string;
    inventory_policy: string; // 'deny' or 'continue'
    inventory_management?: string; // 'shopify'
  }[];
}

const SHOPIFY_ADMIN_API_VERSION = '2026-01';

async function fetchImageAttachment(imageUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(imageUrl, { signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.length === 0) return null;
    if (buf.length > 2 * 1024 * 1024) return null;

    const filenameFromUrl = (() => {
      try {
        const u = new URL(imageUrl);
        const base = u.pathname.split('/').pop() || 'image';
        if (base.includes('.')) return base.split('?')[0];
        const ext = contentType.split('/')[1] || 'jpg';
        return `${base}.${ext}`;
      } catch {
        const ext = contentType.split('/')[1] || 'jpg';
        return `image.${ext}`;
      }
    })();

    return { attachment: buf.toString('base64'), filename: filenameFromUrl };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createShopifyProduct(
  shop: string,
  accessToken: string,
  productData: {
    name: string;
    description: string;
    images: string[];
    price: number;
    originalPrice: number;
    vendor?: string;
  }
) {
  try {
    const requestedImages = (productData.images || []).filter(Boolean).slice(0, 5);
    const firstThree = requestedImages.slice(0, 3);
    const attachments = await Promise.all(firstThree.map((u) => fetchImageAttachment(u)));

    const imagesPayload = firstThree.map((src, idx) => {
      const att = attachments[idx];
      if (att?.attachment) return { attachment: att.attachment, filename: att.filename };
      return { src };
    });
    const remaining = requestedImages.slice(3).map((src) => ({ src }));

    const newProduct: ShopifyProduct = {
      title: productData.name,
      body_html: productData.description,
      vendor: productData.vendor || 'Zenya',
      product_type: 'Zenya Product',
      images: [...imagesPayload, ...remaining],
      variants: [
        {
          price: productData.price.toString(),
          compare_at_price: productData.originalPrice > productData.price 
            ? productData.originalPrice.toString() 
            : undefined,
          inventory_policy: 'continue', 
          inventory_management: 'shopify'
        }
      ]
    };

    const response = await fetch(`https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/products.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ product: newProduct }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Shopify product:', errorText);
      throw new Error(`Shopify API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.product; // Returns the created product object (id, handle, etc.)
  } catch (error) {
    console.error('Error in createShopifyProduct:', error);
    throw error;
  }
}

export async function upsertProductMetafield(params: {
  shop: string;
  accessToken: string;
  productId: number | string;
  namespace: string;
  key: string;
  type: string;
  value: unknown;
}) {
  const { shop, accessToken, productId, namespace, key, type, value } = params;

  const response = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/products/${productId}/metafields.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        metafield: {
          namespace,
          key,
          type,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save metafield: ${response.status} ${errorText.slice(0, 400)}`);
  }

  const data = await response.json();
  return data.metafield;
}
