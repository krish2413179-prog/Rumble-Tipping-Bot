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

/** oembed → real embed slug */
async function getEmbedSlug(pageUrl: string, fallback: string | null): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    const m = (json?.html ?? '').match(/embed\/(v[a-z0-9]+)\//i);
    return m?.[1] ?? fallback;
  } catch {
    return fallback;
  }
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
  } catch {
    return null;
  }
}

/** wn0 API → live viewer count + stream status */
async function getWatchingNow(videoId: string): Promise<{ watching: number; isLive: boolean } | null> {
  try {
    const viewerId = Math.random().toString(36).substring(2, 10);
    const res = await tFetch('https://wn0.rumble.com/service.php?name=video.watching-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, 'Origin': 'https://rumble.com', 'Referer': 'https://rumble.com/' },
      body: JSON.stringify({ data: { video_id: parseInt(videoId, 10), viewer_id: viewerId } }),
    });
    const json = await res.json();
    const count = json.data?.num_watching_now ?? json.data?.viewer_count ?? null;
    return count !== null ? { watching: count, isLive: json.data?.livestream_status === 2 } : null;
  } catch {
    return null;
  }
}

/** Stream-read the Rumble page, stop as soon as we have the stats we need */
async function scrapePageStats(pageUrl: string): Promise<{
  views: string | null; likes: string | null; comments: string | null;
}> {
  const result = { views: null as string | null, likes: null as string | null, comments: null as string | null };
  try {
    const ctrl = new AbortController();
    // 25s timeout — Vercel Pro allows 30s, free tier 10s (will just return nulls on free)
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache' },
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.body) return result;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const MAX = 300_000; // read up to 300KB

    while (buf.length < MAX) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // Stop early once we have all three stats
      const hasViews = /"userInteractionCount"\s*:\s*\d+/i.test(buf);
      const hasComments = /Loading\s+[\d,.]+[KkMm]?\s+comments/i.test(buf);
      if (hasViews && hasComments) {
        reader.cancel();
        break;
      }
    }

    const viewsM = buf.match(/"userInteractionCount"\s*:\s*(\d+)/i);
    if (viewsM) result.views = formatNum(parseInt(viewsM[1], 10));

    const likesM = buf.match(/Likes\s*\|\s*([\d,.]+[KkMm]?)\s+Dislikes/i)
      || buf.match(/"likeCount"\s*:\s*"?([\d,.]+)"?/i);
    if (likesM) result.likes = likesM[1].trim();

    const commentsM = buf.match(/Loading\s+([\d,.]+[KkMm]?)\s+comments/i)
      || buf.match(/([\d,.]+[KkMm]?)\s+[Cc]omments/);
    if (commentsM) result.comments = commentsM[1];

    console.log('[Stats] Scraped from page:', result, `(${buf.length} bytes read)`);
  } catch (e: any) {
    console.warn('[Stats] Page scrape failed:', e.message);
  }
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const pageSlug = extractSlug(videoUrl);

  // Run oembed + page scrape in parallel (both are independent)
  const [embedSlug, pageStats] = await Promise.all([
    getEmbedSlug(videoUrl, pageSlug),
    scrapePageStats(videoUrl),
  ]);

  // Get video ID from embedJS
  const videoId = embedSlug ? await getVideoId(embedSlug) : null;

  // Get live viewer count
  let watching: string | null = null;
  let isLive = false;
  if (videoId) {
    const wn = await getWatchingNow(videoId);
    if (wn) { watching = wn.watching.toLocaleString(); isLive = wn.isLive; }
  }

  const result = {
    watching,
    views: pageStats.views,
    comments: pageStats.comments,
    likes: pageStats.likes,
    isLive,
    videoId,
    timestamp: new Date().toISOString(),
  };
  console.log('[Stats] Final:', result);
  return NextResponse.json(result);
}
