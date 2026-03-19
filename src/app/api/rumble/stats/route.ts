import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function extractSlug(url: string): string | null {
  const m = url.match(/rumble\.com\/(v[a-z0-9]+)[-./]/i);
  return m?.[1] ?? null;
}

async function tFetch(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Step 1: Use oembed to get the real embed slug (e.g. v5xwnen from v60552h page URL)
 * This is fast (~200ms) and reliable.
 */
async function getEmbedSlug(pageUrl: string, pageSlug: string | null): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    // Extract embed slug from iframe src: "https://rumble.com/embed/v5xwnen/"
    const m = (json?.html ?? '').match(/embed\/(v[a-z0-9]+)\//i);
    const slug = m?.[1] ?? null;
    console.log('[API] oembed embed slug:', slug, '(page slug was:', pageSlug + ')');
    return slug;
  } catch (e: any) {
    console.warn('[API] oembed failed:', e.message);
    return pageSlug; // fall back to page slug
  }
}

/**
 * Step 2: Use embedJS to get numeric video ID
 */
async function getVideoId(embedSlug: string): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${embedSlug}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://rumble.com/' } }
    );
    const text = await res.text();
    const m = text.match(/"vid"\s*:\s*(\d+)/);
    console.log('[API] embedJS vid:', m?.[1], 'for slug:', embedSlug);
    return m?.[1] ?? null;
  } catch (e: any) {
    console.warn('[API] embedJS failed:', e.message);
    return null;
  }
}

/**
 * Step 3: Get live viewer count from wn0 API
 */
async function getWatchingNow(videoId: string): Promise<{ watching: number; isLive: boolean } | null> {
  try {
    const viewerId = Math.random().toString(36).substring(2, 10);
    const res = await tFetch('https://wn0.rumble.com/service.php?name=video.watching-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
        'Origin': 'https://rumble.com',
        'Referer': 'https://rumble.com/',
      },
      body: JSON.stringify({ data: { video_id: parseInt(videoId, 10), viewer_id: viewerId } }),
    });
    const json = await res.json();
    const count = json.data?.num_watching_now ?? json.data?.viewer_count ?? null;
    const isLive = json.data?.livestream_status === 2;
    console.log('[API] watching-now:', count, 'isLive:', isLive);
    return count !== null ? { watching: count, isLive } : null;
  } catch (e: any) {
    console.warn('[API] watching-now failed:', e.message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const pageSlug = extractSlug(videoUrl);
  console.log('[API] pageSlug:', pageSlug);

  // Step 1: Get real embed slug via oembed
  const embedSlug = await getEmbedSlug(videoUrl, pageSlug);

  // Step 2: Get numeric video ID from embedJS
  const videoId = embedSlug ? await getVideoId(embedSlug) : null;

  // Step 3: Get watching-now count
  let watching: string | null = null;
  let isLive = false;
  if (videoId) {
    const wnData = await getWatchingNow(videoId);
    if (wnData) {
      watching = wnData.watching.toLocaleString();
      isLive = wnData.isLive;
    }
  }

  // For live streams, views/comments aren't available via lightweight APIs.
  // We return what we have — the watching count is the key live metric.
  const result = {
    watching,
    views: null as string | null,
    comments: null as string | null,
    likes: null as string | null,
    isLive,
    videoId,
    timestamp: new Date().toISOString(),
  };

  console.log('[API] Final stats:', result);
  return NextResponse.json(result);
}
