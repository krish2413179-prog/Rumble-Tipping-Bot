import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const RUMBLE_LIVESTREAM_API_KEY = process.env.RUMBLE_LIVESTREAM_API_KEY ?? '';

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

/** Rumble Livestream API — watching count */
async function fetchWatchingNow(): Promise<{ watching: string | null; isLive: boolean }> {
  if (!RUMBLE_LIVESTREAM_API_KEY) return { watching: null, isLive: false };
  try {
    const res = await tFetch(
      `https://rumble.com/-livestream-api/get-data?key=${RUMBLE_LIVESTREAM_API_KEY}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    console.log('[Stats] Livestream API raw:', JSON.stringify(json).substring(0, 400));
    const stream = Array.isArray(json.livestreams) ? json.livestreams[0] : null;
    if (!stream) return { watching: null, isLive: false };
    const w = stream.watching_now ?? stream.viewers ?? null;
    return {
      watching: w != null ? Number(w).toLocaleString() : null,
      isLive: true,
    };
  } catch (e: any) {
    console.warn('[Stats] Livestream API failed:', e.message);
    return { watching: null, isLive: false };
  }
}

/** Media.GetByRefID — real likes, views, comments by embed slug */
async function fetchMediaByRef(slug: string): Promise<{
  likes: string | null; views: string | null; comments: string | null;
}> {
  const empty = { likes: null, views: null, comments: null };
  if (!RUMBLE_LIVESTREAM_API_KEY || !slug) return empty;
  try {
    const res = await tFetch(
      `https://rumble.com/api/Media.GetByRefID?ref=${slug}&api_key=${RUMBLE_LIVESTREAM_API_KEY}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    console.log('[Stats] GetByRefID raw:', JSON.stringify(json).substring(0, 600));

    // Try common response shapes
    const media = json?.media ?? json?.data ?? json?.result ?? json;

    return {
      likes:    media?.likes    != null ? formatNum(Number(media.likes))    : null,
      views:    media?.views    != null ? formatNum(Number(media.views))    : null,
      comments: media?.comments != null ? formatNum(Number(media.comments)) : null,
    };
  } catch (e: any) {
    console.warn('[Stats] GetByRefID failed:', e.message);
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const pageSlug  = extractSlug(videoUrl);
  const embedSlug = await getEmbedSlug(videoUrl, pageSlug);

  // Run both API calls in parallel
  const [liveData, mediaData] = await Promise.all([
    fetchWatchingNow(),
    embedSlug ? fetchMediaByRef(embedSlug) : Promise.resolve({ likes: null, views: null, comments: null }),
  ]);

  const result = {
    watching: liveData.watching,   // null → shows '--' on frontend
    isLive:   liveData.isLive,
    likes:    mediaData.likes,     // null → shows '--', no mock
    views:    mediaData.views,     // null → shows '--', no mock
    comments: mediaData.comments,  // null → shows '--', no mock
    timestamp: new Date().toISOString(),
  };

  console.log('[Stats] Final:', result);
  return NextResponse.json(result);
}
