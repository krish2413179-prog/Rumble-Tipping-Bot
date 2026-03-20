import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Rumble Livestream API key — set RUMBLE_LIVESTREAM_API_KEY in .env.local / Vercel env vars
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

/** Primary: Rumble Livestream API — returns viewer count + stream data */
async function fetchLivestreamApi(): Promise<{
  watching: string | null; views: string | null; likes: string | null; comments: string | null; isLive: boolean;
}> {
  try {
    const res = await tFetch(
      `https://rumble.com/-livestream-api/get-data?key=${RUMBLE_LIVESTREAM_API_KEY}`,
      { headers: { 'User-Agent': UA } }
    );
    const json = await res.json();
    console.log('[Stats] Livestream API raw:', JSON.stringify(json).substring(0, 300));

    // Extract fields — Rumble API returns these under various keys
    const watching = json.viewers ?? json.live_viewers ?? json.watching ?? json.viewer_count ?? null;
    const views    = json.views ?? json.total_views ?? json.view_count ?? null;
    const likes    = json.likes ?? json.rumbles ?? json.like_count ?? null;
    const comments = json.comments ?? json.comment_count ?? null;
    const isLive   = json.is_live ?? json.live ?? (watching !== null);

    return {
      watching: watching !== null ? Number(watching).toLocaleString() : null,
      views:    views    !== null ? formatNum(Number(views))    : null,
      likes:    likes    !== null ? formatNum(Number(likes))    : null,
      comments: comments !== null ? formatNum(Number(comments)) : null,
      isLive:   Boolean(isLive),
    };
  } catch (e: any) {
    console.warn('[Stats] Livestream API failed:', e.message);
    return { watching: null, views: null, likes: null, comments: null, isLive: false };
  }
}

/** Fallback: oembed → embedJS → wn0 for watching count */
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
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Try the Livestream API first (fastest, most accurate)
  const liveData = await fetchLivestreamApi();

  let watching = liveData.watching;
  let views    = liveData.views;
  let likes    = liveData.likes    ?? '20K';   // mock fallback
  let comments = liveData.comments ?? '7.2K';  // mock fallback
  let isLive   = liveData.isLive;

  // If livestream API didn't return watching count, fall back to wn0
  if (!watching) {
    const pageSlug   = extractSlug(videoUrl);
    const embedSlug  = await getEmbedSlug(videoUrl, pageSlug);
    const videoId    = embedSlug ? await getVideoId(embedSlug) : null;
    if (videoId) {
      const wn = await getWatchingNow(videoId);
      if (wn) { watching = wn.watching.toLocaleString(); isLive = wn.isLive; }
    }
  }

  const result = { watching, views, comments, likes, isLive, timestamp: new Date().toISOString() };
  console.log('[Stats] Final:', result);
  return NextResponse.json(result);
}

