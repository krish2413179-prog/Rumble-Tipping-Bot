import { NextRequest, NextResponse } from 'next/server';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchWatchingNow(videoId: string): Promise<number | null> {
  try {
    const viewerId = Math.random().toString(36).substring(2, 10);
    const res = await fetchWithTimeout('https://wn0.rumble.com/service.php?name=video.watching-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Origin': 'https://rumble.com',
        'Referer': 'https://rumble.com/',
      },
      body: JSON.stringify({ data: { video_id: videoId, viewer_id: viewerId } }),
    });
    const json = await res.json();
    return json.data?.num_watching_now ?? json.data?.viewer_count ?? null;
  } catch {
    return null;
  }
}

async function fetchRumblePage(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });
  return res.text();
}

function parseNum(val: string): number {
  const n = parseFloat(val.replace(/,/g, ''));
  if (val.toUpperCase().endsWith('K')) return n * 1000;
  if (val.toUpperCase().endsWith('M')) return n * 1000000;
  return n;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const html = await fetchRumblePage(videoUrl);

    // Extract video ID
    let videoId: string | null = null;
    for (const pattern of [
      /"video_id"\s*[:=]\s*"?(\d+)"?/i,
      /video":\s*\{\s*"id":\s*"(\d+)"/i,
      /"id":\s*(\d+)\s*,\s*"title"/i,
      /data-video-id="(\d+)"/i,
      /\/embed\/(\d+)/i,
    ]) {
      const m = html.match(pattern);
      if (m) { videoId = m[1]; break; }
    }

    // Watching now
    let watching: string | null = null;
    if (videoId) {
      const count = await fetchWatchingNow(videoId);
      if (count !== null) watching = count.toLocaleString();
    }
    if (!watching) {
      const m = html.match(/title="(\d[\d,.]*[KkMm]?)\s+users\s+watching/i)
             || html.match(/(\d[\d,.]*[KkMm]?)\s+watching\s+now/i)
             || html.match(/(\d[\d,.]*[KkMm]?)\s+watching/i);
      if (m) watching = m[1];
    }

    // Views
    let views: string | null = null;
    const vm = html.match(/interactionCount"\s*content="UserViews:(\d+)"/i)
            || html.match(/([\d,.]+[KkMm]?)\s+Views/i)
            || html.match(/class="media-description-info-views"[^>]*>[\s\S]*?([\d,.]+[KkMm]?)\s*<\/div>/i);
    if (vm) views = formatNum(parseNum(vm[1]));

    // Comments
    let comments: string | null = null;
    const cm = html.match(/Loading\s+([\d,.]+[KkMm]?)\s+comments/i)
            || html.match(/([\d,.]+[KkMm]?)\s+Comments/i);
    if (cm) comments = cm[1];

    // Likes / Rumbles
    let likes: string | null = null;
    const lm = html.match(/data-js="rumbles_up_votes"[^>]*>([\s\S]*?)<\/span>/i)
            || html.match(/"rumbles":(\d+)/i)
            || html.match(/rumbles-vote-up[^>]*>([\d,.]+[KkMm]?)/i);
    if (lm) likes = lm[1].trim();

    console.log(`[Rumble Stats] videoId=${videoId} watching=${watching} views=${views} likes=${likes} comments=${comments}`);

    return NextResponse.json({ watching, views, comments, likes, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Rumble Stats] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
