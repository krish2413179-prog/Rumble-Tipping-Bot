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

async function tFetch(url: string, init: RequestInit = {}, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Scrape likes, views, watching_now directly from the Rumble video page HTML */
async function scrapePublicStats(videoUrl: string): Promise<{
  likes: string | null; views: string | null; watching: string | null; isLive: boolean;
}> {
  const empty = { likes: null, views: null, watching: null, isLive: false };
  try {
    const res = await tFetch(videoUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      console.warn('[Stats] Page fetch failed:', res.status);
      return empty;
    }

    const html = await res.text();
    console.log('[Stats] Page HTML length:', html.length);

    // Rumble embeds stats in JSON blobs and meta tags — try multiple patterns
    const likesMatch =
      html.match(/"likes"\s*:\s*(\d+)/) ??
      html.match(/["']likes["']\s*:\s*(\d+)/) ??
      html.match(/data-likes="(\d+)"/);

    const viewsMatch =
      html.match(/"views"\s*:\s*(\d+)/) ??
      html.match(/["']views["']\s*:\s*(\d+)/) ??
      html.match(/data-views="(\d+)"/) ??
      html.match(/"view_count"\s*:\s*(\d+)/);

    const watchingMatch =
      html.match(/"watching_now"\s*:\s*(\d+)/) ??
      html.match(/"viewers"\s*:\s*(\d+)/) ??
      html.match(/data-watching="(\d+)"/);

    const isLiveMatch =
      html.includes('"isLiveBroadcast"') ||
      html.includes('"live_status":1') ||
      html.includes('"livestream_status":2') ||
      html.includes('data-is-live="1"');

    const likes    = likesMatch    ? formatNum(parseInt(likesMatch[1]))    : null;
    const views    = viewsMatch    ? formatNum(parseInt(viewsMatch[1]))    : null;
    const watching = watchingMatch ? formatNum(parseInt(watchingMatch[1])) : null;

    console.log('[Stats] Scraped:', { likes, views, watching, isLive: isLiveMatch });
    return { likes, views, watching, isLive: isLiveMatch };
  } catch (e: any) {
    console.warn('[Stats] Scrape failed:', e.message);
    return empty;
  }
}

/** oembed → embed slug */
async function getEmbedSlug(pageUrl: string, fallback: string | null): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    const m = (json?.html ?? '').match(/embed\/(v[a-z0-9]+)\//i);
    return m?.[1] ?? fallback;
  } catch { return fallback; }
}

/** embedJS → numeric video ID */
async function getVideoId(slug: string): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${slug}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://rumble.com/' } }
    );
    const text = await res.text();
    return text.match(/"vid"\s*:\s*(\d+)/)?.[1] ?? null;
  } catch { return null; }
}

/** wn0 — reliable watching now count for any public video */
async function getWatchingNow(videoId: string): Promise<{ watching: number; isLive: boolean } | null> {
  try {
    const viewerId = Math.random().toString(36).substring(2, 10);
    const res = await tFetch('https://wn0.rumble.com/service.php?name=video.watching-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'User-Agent': UA,
        'Origin': 'https://rumble.com', 'Referer': 'https://rumble.com/',
      },
      body: JSON.stringify({ data: { video_id: parseInt(videoId, 10), viewer_id: viewerId } }),
    });
    const json = await res.json();
    const count = json.data?.num_watching_now ?? json.data?.viewer_count ?? null;
    return count !== null ? { watching: count, isLive: json.data?.livestream_status === 2 } : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Run page scrape + slug resolution in parallel
  const pageSlug = extractSlug(videoUrl);
  const [scraped, embedSlug] = await Promise.all([
    scrapePublicStats(videoUrl),
    getEmbedSlug(videoUrl, pageSlug),
  ]);

  // wn0 is the most reliable source for watching count — always use it
  let watching = scraped.watching;
  let isLive   = scraped.isLive;

  const videoId = embedSlug ? await getVideoId(embedSlug) : null;
  if (videoId) {
    const wn = await getWatchingNow(videoId);
    if (wn) {
      watching = wn.watching.toLocaleString();
      isLive   = wn.isLive;
    }
  }

  const result = {
    watching,
    isLive,
    likes:    scraped.likes,    // null → '--' on frontend, no mocks
    views:    scraped.views,    // null → '--' on frontend, no mocks
    comments: scraped.watching ? null : null, // comments not available via scrape
    timestamp: new Date().toISOString(),
  };

  console.log('[Stats] Final:', result);
  return NextResponse.json(result);
}
