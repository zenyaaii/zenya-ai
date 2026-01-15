import { NextRequest, NextResponse } from 'next/server';
import { shopify } from '@/lib/shopify';
import { DataType } from '@shopify/shopify-api';
import { prepareThemeZip } from '@/utils/shopify-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop, themeData } = body;
    
    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Use the configured session storage (Prisma or File)
    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);
    
    if (sessions.length === 0) {
      return NextResponse.json({ error: 'No session found for shop' }, { status: 401 });
    }

    const session = sessions[0];
    const client = new shopify.clients.Rest({ session });

    // 2. Create a new theme
    const response = await client.post({
      path: 'themes',
      data: {
        theme: {
          name: themeData.productName || 'Zenya AI Theme',
          role: 'unpublished'
        }
      },
      type: DataType.JSON,
    });

    const theme = (response.body as any).theme;

    // 3. Upload assets
    try {
      const zip = await prepareThemeZip(
        themeData.productName || 'Zenya AI Theme',
        themeData.content,
        themeData.colors
      );

      const files = Object.keys(zip.files).filter(key => !zip.files[key].dir);
      console.log(`Uploading ${files.length} assets to theme ${theme.id}...`);

      for (const filePath of files) {
        const fileObj = zip.files[filePath];
        // Assuming text files for now (liquid, json)
        const content = await fileObj.async('string');
        
        await client.put({
          path: `themes/${theme.id}/assets`,
          data: {
            asset: {
              key: filePath,
              value: content
            }
          },
          type: DataType.JSON,
        });
        
        // Small delay to prevent rate limiting (Shopify limit: 2/s bucket 40)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (uploadError) {
      console.error('Failed to upload assets:', uploadError);
      // We still return success for the theme creation, but with a warning
      return NextResponse.json({ 
        success: true, 
        themeId: theme.id, 
        warning: 'Theme created but assets failed to upload' 
      });
    }
    
    return NextResponse.json({ success: true, themeId: theme.id });

  } catch (error) {
    console.error('Failed to create theme:', error);
    return NextResponse.json({ error: 'Failed to create theme', details: String(error) }, { status: 500 });
  }
}
