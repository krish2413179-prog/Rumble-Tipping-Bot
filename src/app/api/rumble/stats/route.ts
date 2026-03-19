import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT = 6000;

async function timedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function parseNum(val: string): number {
  const n = parseFloat(val.replace(/,/g, ''));
  if (/k$/i.test(val)) return n * 1000;
  if (/m$/i.test(val)) return n * 1_000_000;
  return n;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

// Get embed slug + basic info from oEmbed (fast, reliable)
async function getOEmbed(videoUrl: string): Promise<{ embedSlug: string | null; title: string | null }> {
  try {
    const res = await timedFetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(videoUrl)}`
    );
    const data = await res.json();
    const m = (data.html as string)?.match(/embed\/(\w+)\//);
    return { embedSlug: m?.[1] ?? null, title: data.title ?? null };
  } catch {
    return { embedSlug: null, title: null };
  }
}

// Get numeric video ID from embed page (needed for watching-now API)
async function getNumericVideoId(embedSlug: string): Promise<string | null> {
  try {
    const res = await timedFetch(`https://rumble.com/embed/${embedSlug}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await res.text();
    // Look for numeric video ID in the embed page JS
    const patterns = [
      /"video_id"\s*:\s*"?(\d+)"?/i,
      /video_id=(\d+)/i,
      /"id"\s*:\s*(\d{6,})/,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Get watching-now count using numeric video ID
async function getWatchingNow(videoId: string): Promise<number | null> {
  try {
    const viewerId = Math.random().toString(36).substring(2, 10);
    const res = await timedFetch('https://wn0.rumble.com/service.php?name=video.watching-now', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

// Scrape views/likes/comments from the main video page
async function scrapePageStats(videoUrl: string): Promise<{ views: string | null; likes: string | null; comments: string | null }> {
  try {
    const res = await timedFetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    const html = await res.text();

    let views: string | null = null;
    const vm = html.match(/interactionCount"\s*content="UserViews:(\d+)"/i)
            || html.match(/([\d,.]+[KkMm]?)\s+Views/i);
    if (vm) views = formatNum(parseNum(vm[1]));

    let comments: string | null = null;
    const cm = html.match(/Loading\s+([\d,.]+[KkMm]?)\s+comments/i)
            || html.match(/([\d,.]+[KkMm]?)\s+Comments/i);
    if (cm) comments = cm[1];

    let likes: string | null = null;
    const lm = html.match(/data-js="rumbles_up_votes"[^>]*>([\s\S]*?)<\/span>/i)
            || html.match(/"rumbles"\s*:\s*(\d+)/i);
    if (lm) likes = lm[1].trim();

    return { views, likes, comments };
  } catch {
    return { views: null, likes: null, comments: null };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Run all fetches in parallel
  const [oembed, pageStats] = await Promise.all([
    getOEmbed(videoUrl),
    scrapePageStats(videoUrl),
  ]);

  // Get watching count: need numeric ID from embed page
  let watching: string | null = null;
  if (oembed.embedSlug) {
    const numericId = await getNumericVideoId(oembed.embedSlug);
    if (numericId) {
      const count = await getWatchingNow(numericId);
      if (count !== null) watching = count.toLocaleString();
    }
  }

  const result = {
    watching,
    views: pageStats.views,
    comments: pageStats.comments,
    likes: pageStats.likes,
    timestamp: new Date().toISOString(),
  };

  console.log(`[Rumble Stats] ${videoUrl} →`, result);
  return NextResponse.json(result);
}
