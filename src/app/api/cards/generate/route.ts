import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import type { CardFormat } from '@/types/creator'

const DIMENSIONS: Record<CardFormat, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
  x: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  reddit: { width: 1080, height: 1080 },
}

function buildCardHtml(params: {
  width: number
  height: number
  backgroundUrl: string | null
  backgroundMode: string
  logoUrl: string
  showLogo: boolean
  primaryColor: string
  secondaryColor: string
  headline: string
  subtext: string
  creatorName: string
}): string {
  const {
    width, height, backgroundUrl, backgroundMode, logoUrl, showLogo,
    primaryColor, secondaryColor, headline, subtext, creatorName,
  } = params

  const hasImage = backgroundMode !== 'text-only' && backgroundUrl

  const cardBg = backgroundMode === 'text-only'
    ? `background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);`
    : `background: ${primaryColor};`

  const overlayGradient = backgroundMode === 'text-only'
    ? 'background: transparent;'
    : `background: linear-gradient(to top, rgba(13,17,23,0.92) 0%, rgba(13,17,23,0.6) 35%, rgba(13,17,23,0.15) 60%, rgba(13,17,23,0.05) 100%);`

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .card {
    width: ${width}px;
    height: ${height}px;
    position: relative;
    ${cardBg}
  }
  .bg-image {
    position: absolute;
    inset: 0;
    width: ${width}px;
    height: ${height}px;
    object-fit: cover;
  }
  .overlay {
    position: absolute;
    inset: 0;
    ${overlayGradient}
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: ${Math.round(width * 0.07)}px;
    z-index: 2;
  }
  .logo {
    position: absolute;
    top: ${Math.round(width * 0.05)}px;
    left: ${Math.round(width * 0.05)}px;
    width: ${Math.round(width * 0.12)}px;
    height: ${Math.round(width * 0.12)}px;
    object-fit: contain;
    z-index: 3;
  }
  .headline {
    font-size: ${Math.round(width * 0.065)}px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.1;
    margin-bottom: ${Math.round(width * 0.02)}px;
    text-shadow: ${backgroundMode === 'text-only' ? 'none' : '0 2px 8px rgba(0,0,0,0.3)'};
  }
  .subtext {
    font-size: ${Math.round(width * 0.032)}px;
    font-weight: 400;
    color: rgba(255,255,255,0.85);
    line-height: 1.4;
    margin-bottom: ${Math.round(width * 0.04)}px;
    text-shadow: ${backgroundMode === 'text-only' ? 'none' : '0 1px 4px rgba(0,0,0,0.3)'};
  }
  .brand-bar {
    display: flex;
    align-items: center;
    gap: ${Math.round(width * 0.015)}px;
    padding-top: ${Math.round(width * 0.03)}px;
    border-top: 2px solid ${secondaryColor};
  }
  .brand-name {
    font-size: ${Math.round(width * 0.025)}px;
    font-weight: 600;
    color: ${secondaryColor};
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .brand-dot {
    width: ${Math.round(width * 0.01)}px;
    height: ${Math.round(width * 0.01)}px;
    border-radius: 50%;
    background: ${secondaryColor};
  }
</style>
</head>
<body>
  <div class="card">
    ${hasImage ? `<img class="bg-image" src="${backgroundUrl}" />` : ''}
    <div class="overlay"></div>
    ${showLogo && logoUrl ? `<img class="logo" src="${logoUrl}" />` : ''}
    <div class="content">
      <div class="headline">${escapeHtml(headline)}</div>
      <div class="subtext">${escapeHtml(subtext)}</div>
      <div class="brand-bar">
        <div class="brand-dot"></div>
        <div class="brand-name">${escapeHtml(creatorName)}</div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    format = 'instagram',
    backgroundUrl,
    backgroundMode = 'text-only',
    logoUrl = '',
    showLogo = true,
    primaryColor = '#0D1117',
    secondaryColor = '#FF4D2E',
    headline = '',
    subtext = '',
    creatorName = '',
  } = body

  const dim = DIMENSIONS[format as CardFormat] || DIMENSIONS.instagram

  const html = buildCardHtml({
    width: dim.width, height: dim.height,
    backgroundUrl, backgroundMode, logoUrl, showLogo,
    primaryColor, secondaryColor, headline, subtext, creatorName,
  })

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: dim.width, height: dim.height })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.evaluate(() => document.fonts.ready)
    await new Promise(resolve => setTimeout(resolve, 500))

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: dim.width, height: dim.height },
    })

    return new NextResponse(new Uint8Array(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="card-${format}-${Date.now()}.png"`,
      },
    })
  } finally {
    await browser.close()
  }
}
