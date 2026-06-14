/**
 * Push a generated theme straight into a merchant's store using their
 * offline OAuth access token. Same pipeline we validate generator
 * output with: zip → stagedUploadsCreate → multipart upload →
 * themeCreate (UNPUBLISHED) → short poll for processing.
 */
import JSZip from 'jszip'
import type { ThemeFiles } from './theme-generator'

const API_VERSION = '2026-01'

async function adminGraphql(shop: string, accessToken: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify GraphQL ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors).slice(0, 300)}`)
  }
  return json.data
}

export type PushedTheme = {
  id: string
  numericId: string
  name: string
  processing: boolean
  previewUrl: string
  editorUrl: string
}

export async function pushThemeToShop(params: {
  shop: string
  accessToken: string
  files: ThemeFiles
  themeName: string
}): Promise<PushedTheme> {
  const { shop, accessToken, files, themeName } = params

  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) zip.file(path, content)
  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // 1. Staged upload target for the zip.
  const staged = await adminGraphql(
    shop,
    accessToken,
    `mutation StagedUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: [{
        resource: 'FILE',
        filename: 'zenya-theme.zip',
        mimeType: 'application/zip',
        httpMethod: 'POST',
        fileSize: String(zipBytes.byteLength),
      }],
    },
  )
  const target = staged?.stagedUploadsCreate?.stagedTargets?.[0]
  const stagedErrors = staged?.stagedUploadsCreate?.userErrors
  if (!target) throw new Error(`stagedUploadsCreate failed: ${JSON.stringify(stagedErrors).slice(0, 300)}`)

  // 2. Multipart POST the zip to the signed target (params first, file last).
  const form = new FormData()
  for (const p of target.parameters) form.append(p.name, p.value)
  form.append('file', new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' }), 'zenya-theme.zip')
  const uploadRes = await fetch(target.url, { method: 'POST', body: form })
  if (!uploadRes.ok && uploadRes.status !== 201) {
    throw new Error(`Staged upload failed: HTTP ${uploadRes.status}`)
  }

  // 3. Create the theme from the staged zip.
  const created = await adminGraphql(
    shop,
    accessToken,
    `mutation CreateTheme($source: URL!, $name: String!) {
      themeCreate(source: $source, name: $name) {
        theme { id name processing }
        userErrors { field message }
      }
    }`,
    { source: target.resourceUrl, name: themeName },
  )
  const theme = created?.themeCreate?.theme
  const createErrors = created?.themeCreate?.userErrors
  if (!theme?.id) throw new Error(`themeCreate failed: ${JSON.stringify(createErrors).slice(0, 300)}`)

  // 4. Short poll so the success screen usually links a ready theme.
  let processing = Boolean(theme.processing)
  for (let i = 0; i < 6 && processing; i++) {
    await new Promise((r) => setTimeout(r, 2500))
    try {
      const status = await adminGraphql(
        shop,
        accessToken,
        `query ThemeStatus($id: ID!) { theme(id: $id) { processing processingFailed } }`,
        { id: theme.id },
      )
      processing = Boolean(status?.theme?.processing)
      if (status?.theme?.processingFailed) throw new Error('Shopify rejected the theme during processing.')
    } catch (e) {
      if (e instanceof Error && e.message.includes('rejected')) throw e
      break // status poll hiccup — theme almost certainly fine, stop polling
    }
  }

  const numericId = theme.id.split('/').pop() || ''
  return {
    id: theme.id,
    numericId,
    name: theme.name,
    processing,
    previewUrl: `https://${shop}/?preview_theme_id=${numericId}`,
    editorUrl: `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/themes/${numericId}/editor`,
  }
}
