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

/**
 * embedJS — single call that gives us vid (numeric ID), title, isLive.
 * Rumble does NOT expose likes/views in embedJS for livestreams.
 * live field: 0=VOD, 1=upcoming, 2=live now
 */
async function getEmbedData(slug: string): Promise<{
  videoId: string | null; title: string | null; isLive: boolean;
}> {
  try {
    const res = await tFetch(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${slug}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://rumble.com/' } }
    );
    const json = await res.json();
    console.log('[Stats] embedJS live:', json.live, 'vid:', json.vid);
    return {
      videoId: json.vid != null ? String(json.vid) : null,
      title:   json.title ?? null,
      isLive:  json.live === 2,
    };
  } catch (e: any) {
    console.warn('[Stats] embedJS failed:', e.message);
    return { videoId: null, title: null, isLive: false };
  }
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
  const videoUrl = new URL(req.url).searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  const pageSlug  = extractSlug(videoUrl);
  const embedSlug = await getEmbedSlug(videoUrl, pageSlug);

  const embed = embedSlug
    ? await getEmbedData(embedSlug)
    : { videoId: null, title: null, isLive: false };

  const wn = embed.videoId ? await getWatchingNow(embed.videoId) : null;

  const result = {
    watching: wn ? wn.watching.toLocaleString() : null,
    isLive:   wn?.isLive ?? embed.isLive,
    timestamp: new Date().toISOString(),
  };

  console.log('[Stats] Final:', result);
  return NextResponse.json(result);
}
