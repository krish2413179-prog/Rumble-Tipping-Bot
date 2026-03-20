import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const API_KEY = process.env.RUMBLE_LIVESTREAM_API_KEY ?? '';

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function extractSlug(url: string): string | null {
  const m = url.match(/rumble\.com\/(v[a-z0-9]+)[-./]/i);
  return m?.[1] ?? null;
}

async function tFetch(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, ...(opts.headers ?? {}) },
      ...opts,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Resolve embed slug: oembed → embedJS → page slug fallback */
async function resolveEmbedSlug(pageUrl: string, fallback: string | null): Promise<string | null> {
  try {
    const res = await tFetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(pageUrl)}`
    );
    const json = await res.json();
    const m = (json?.html ?? '').match(/embed\/(v[a-z0-9]+)\//i);
    if (m?.[1]) return m[1];
  } catch { /* fall through */ }

  // Try embedJS with page slug
  if (fallback) {
    try {
      const res = await tFetch(
        `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${fallback}`
      );
      const json = await res.json();
      const vid = json?.video?.id ?? json?.id;
      if (vid) return String(vid);
    } catch { /* fall through */ }
  }

  return fallback;
}

/** wn0 fallback for watching count only */
async function fetchWatchingNowFallback(videoId: string): Promise<number | null> {
  try {
    const res = await tFetch(
      'https://wn0.rumble.com/service.php?name=video.watching-now',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `video_id=${encodeURIComponent(videoId)}`,
      }
    );
    const json = await res.json();
    const count = json?.data?.watching_now ?? json?.watching_now;
    return count != null ? Number(count) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const videoUrl = new URL(req.url).searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // No API key → return all nulls (show "--" on frontend)
  if (!API_KEY) {
    console.warn('[Stats] RUMBLE_LIVESTREAM_API_KEY is not set');
    return NextResponse.json(
      { watching: null, isLive: false, likes: null, views: null, comments: null, timestamp: new Date().toISOString() },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Fetch Livestream API
  let stream: Record<string, any> | null = null;
  try {
    const res = await tFetch(
      `https://rumble.com/-livestream-api/get-data?key=${API_KEY}`
    );
    const json = await res.json();
    stream = json?.livestreams?.[0] ?? null;

    if (stream) {
      console.log('[Stats] Livestream API stream keys:', Object.keys(stream));
    } else {
      console.warn('[Stats] Livestream API returned no livestreams');
    }
  } catch (e: any) {
    console.warn('[Stats] Livestream API failed:', e.message);
  }

  // If no live stream, return all nulls
  if (!stream) {
    return NextResponse.json(
      { watching: null, isLive: false, likes: null, views: null, comments: null, timestamp: new Date().toISOString() },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }

  // Parse stats from stream object
  const rawWatching = stream.watching_now ?? stream.viewers ?? stream.watching;
  const rawLikes    = stream.likes ?? stream.like_count;
  const rawComments = stream.comments ?? stream.comment_count ?? stream.chat_count;
  const rawViews    = stream.total_views ?? stream.views ?? stream.view_count;

  let watchingCount: number | null = rawWatching != null ? Number(rawWatching) : null;

  // wn0 fallback for watching count only
  if (watchingCount == null) {
    const pageSlug  = extractSlug(videoUrl);
    const embedSlug = await resolveEmbedSlug(videoUrl, pageSlug);
    if (embedSlug) {
      watchingCount = await fetchWatchingNowFallback(embedSlug);
    }
  }

  return NextResponse.json({
    watching: watchingCount != null ? formatNum(watchingCount) : null,
    isLive:   true,
    likes:    rawLikes    != null ? formatNum(Number(rawLikes))    : null,
    comments: rawComments != null ? formatNum(Number(rawComments)) : null,
    views:    rawViews    != null ? formatNum(Number(rawViews))    : null,
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
