import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Use a realistic browser User-Agent to avoid being blocked
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // 1. Try og:image meta tag (property before content)
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    );
    if (ogImageMatch) {
      return resolveUrl(ogImageMatch[1], url);
    }

    // 2. Try og:image meta tag (content before property)
    const ogImageMatchAlt = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    );
    if (ogImageMatchAlt) {
      return resolveUrl(ogImageMatchAlt[1], url);
    }

    // 3. Try twitter:image meta tag
    const twitterImageMatch = html.match(
      /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    );
    if (twitterImageMatch) {
      return resolveUrl(twitterImageMatch[1], url);
    }

    const twitterImageMatchAlt = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i,
    );
    if (twitterImageMatchAlt) {
      return resolveUrl(twitterImageMatchAlt[1], url);
    }

    // 4. Try _fbImage meta tag (Facebook-specific)
    const fbImageMatch = html.match(
      /<meta[^>]*(?:name|property)=["']_fbImage["'][^>]*content=["']([^"']+)["']/i,
    );
    if (fbImageMatch) {
      return resolveUrl(fbImageMatch[1], url);
    }

    const fbImageMatchAlt = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']_fbImage["']/i,
    );
    if (fbImageMatchAlt) {
      return resolveUrl(fbImageMatchAlt[1], url);
    }

    // 4. Try link rel="image_src"
    const linkImageMatch = html.match(
      /<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i,
    );
    if (linkImageMatch) {
      return resolveUrl(linkImageMatch[1], url);
    }

    // 5. Try JSON-LD schema for product images
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );
    if (jsonLdMatch) {
      for (const script of jsonLdMatch) {
        const jsonContent = script.replace(
          /<script[^>]*>|<\/script>/gi,
          "",
        );
        try {
          const data = JSON.parse(jsonContent);
          const image = extractImageFromJsonLd(data);
          if (image) {
            return resolveUrl(image, url);
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    }

    // 6. Try itemprop="image" meta tag (used by some sites including Amazon)
    const itempropImageMatch = html.match(
      /<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i,
    );
    if (itempropImageMatch) {
      return resolveUrl(itempropImageMatch[1], url);
    }

    // 7. Try to find main product image (common patterns)
    const mainImageMatch = html.match(
      /<img[^>]*(?:id=["'](?:main|product|hero|landingImage|imgBlkFront)[^"']*["']|class=["'][^"']*(?:main|product|hero|primary)[^"']*["'])[^>]*src=["']([^"']+)["']/i,
    );
    if (mainImageMatch) {
      return resolveUrl(mainImageMatch[1], url);
    }

    // 8. Amazon-specific: parse colorImages JavaScript data
    const amazonColorImagesMatch = html.match(
      /'colorImages':\s*\{\s*'initial':\s*\[([\s\S]*?)\]/,
    );
    if (amazonColorImagesMatch) {
      const hiResMatch = amazonColorImagesMatch[1].match(/"hiRes":"([^"]+)"/);
      if (hiResMatch) {
        return hiResMatch[1];
      }
      const largeMatch = amazonColorImagesMatch[1].match(/"large":"([^"]+)"/);
      if (largeMatch) {
        return largeMatch[1];
      }
    }

    // 9. Amazon-specific: try imageGalleryData
    const amazonGalleryMatch = html.match(
      /imageGalleryData\s*['"]?\s*:\s*\[([\s\S]*?)\]/,
    );
    if (amazonGalleryMatch) {
      const mainUrlMatch = amazonGalleryMatch[1].match(/"mainUrl":"([^"]+)"/);
      if (mainUrlMatch) {
        return mainUrlMatch[1];
      }
    }

    // 10. Amazon-specific: data-a-dynamic-image attribute
    const dynamicImageMatch = html.match(
      /data-a-dynamic-image=["']\{([^}]+)\}/,
    );
    if (dynamicImageMatch) {
      const urlMatch = dynamicImageMatch[1].match(/(https:\/\/[^"]+\.jpg)/);
      if (urlMatch) {
        return urlMatch[1];
      }
    }

    // 11. Generic: find any large Amazon media image
    const amazonMediaMatch = html.match(
      /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9_+-]+\._[^"'\s]*?(?:SX|SY|UX|UY)[0-9]{3,4}[^"'\s]*?\.jpg/,
    );
    if (amazonMediaMatch) {
      // Convert to a larger size
      return amazonMediaMatch[0].replace(
        /\._[^.]+_\./,
        "._SL1500_.",
      );
    }

    return null;
  } catch {
    return null;
  }
}

function resolveUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("//")) {
    return "https:" + imageUrl;
  }
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return imageUrl;
  }
}

function extractImageFromJsonLd(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // Handle arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractImageFromJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  // Check for image property
  if (obj.image) {
    if (typeof obj.image === "string") {
      return obj.image;
    }
    if (Array.isArray(obj.image) && obj.image.length > 0) {
      const first = obj.image[0];
      if (typeof first === "string") return first;
      if (typeof first === "object" && first !== null) {
        const imgObj = first as Record<string, unknown>;
        if (typeof imgObj.url === "string") return imgObj.url;
      }
    }
    if (typeof obj.image === "object" && obj.image !== null) {
      const imgObj = obj.image as Record<string, unknown>;
      if (typeof imgObj.url === "string") return imgObj.url;
    }
  }

  // Check @graph for schema.org
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const result = extractImageFromJsonLd(item);
      if (result) return result;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const id = parseInt(itemId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid itemId" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // If we already have the OG image, return it
  if (item.ogImage) {
    return NextResponse.json({ ogImage: item.ogImage });
  }

  // Fetch the OG image from the URL
  const ogImage = await fetchOgImage(item.url);

  if (ogImage) {
    // Save to database for future requests
    await prisma.item.update({
      where: { id },
      data: { ogImage },
    });
  }

  return NextResponse.json({ ogImage });
}
