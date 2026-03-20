import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const RUMBLE_LIVESTREAM_API_KEY = process.env.RUMBLE_LIVESTREAM_API_KEY ?? '';

type ChatMessage = { author: string; text: string; timestamp: string; type: string };

/**
 * Primary: Rumble Livestream API recent_messages
 * GET https://rumble.com/-livestream-api/get-data?key=KEY
 * livestreams[0].chat.recent_messages
 */
async function fetchViaLivestreamApi(): Promise<ChatMessage[] | null> {
  if (!RUMBLE_LIVESTREAM_API_KEY) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `https://rumble.com/-livestream-api/get-data?key=${RUMBLE_LIVESTREAM_API_KEY}`,
      { headers: { 'User-Agent': UA }, signal: ctrl.signal }
    );
    clearTimeout(t);
    const json = await res.json();
    console.log('[Comments] Livestream API raw:', JSON.stringify(json).substring(0, 400));

    const stream = Array.isArray(json.livestreams) ? json.livestreams[0] : null;
    if (!stream) {
      console.log('[Comments] No active livestream in API response');
      return null;
    }

    // recent_messages can be under stream.chat.recent_messages or stream.recent_messages
    const msgs: any[] =
      stream.chat?.recent_messages ??
      stream.recent_messages ??
      [];

    if (msgs.length === 0) return null;

    return msgs.slice(-50).map((m: any) => ({
      author:    m.username ?? m.user ?? m.author ?? 'Anonymous',
      text:      m.text ?? m.message ?? m.comment ?? '',
      timestamp: m.time ?? m.created_at ?? new Date().toISOString(),
      type:      m.rant ? 'rant' : 'message',
    })).filter((m: ChatMessage) => m.text.length > 0);
  } catch (e: any) {
    console.warn('[Comments] Livestream API failed:', e.message);
    return null;
  }
}

/** Fallback: oembed → embedJS → numeric video ID */
async function resolveVideoId(pageUrl: string): Promise<string | null> {
  try {
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 6000);
    const oRes = await fetch(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      { headers: { 'User-Agent': UA }, signal: ctrl1.signal }
    );
    clearTimeout(t1);
    const oJson = await oRes.json();
    const slugMatch = (oJson?.html ?? '').match(/embed\/(v[a-z0-9]+)\//i);
    const embedSlug = slugMatch?.[1] ?? null;
    if (!embedSlug) return null;

    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 6000);
    const eRes = await fetch(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${embedSlug}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://rumble.com/' }, signal: ctrl2.signal }
    );
    clearTimeout(t2);
    const eText = await eRes.text();
    return eText.match(/"vid"\s*:\s*(\d+)/)?.[1] ?? null;
  } catch (e: any) {
    console.warn('[Comments] resolveVideoId failed:', e.message);
    return null;
  }
}

/** Fallback: SSE chat stream */
async function fetchChatMessages(chatId: string): Promise<ChatMessage[]> {
  return new Promise((resolve) => {
    const messages: ChatMessage[] = [];
    let buffer = '';
    let settled = false;

    const done = (msgs: ChatMessage[]) => {
      if (settled) return;
      settled = true;
      resolve(msgs);
    };

    const ctrl = new AbortController();
    const timeout = setTimeout(() => { ctrl.abort(); done(messages); }, 10000);

    fetch(`https://web7.rumble.com/chat/api/chat/${chatId}/stream`, {
      headers: {
        'User-Agent': UA, 'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache', 'Origin': 'https://rumble.com', 'Referer': 'https://rumble.com/',
      },
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.body) { done([]); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const dataLine = event.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const json = JSON.parse(dataLine.slice(5).trim());
            if (json.type === 'init' && json.data?.messages) {
              const msgs: any[] = json.data.messages ?? [];
              const users: any[] = json.data.users ?? [];
              const userMap: Record<string, string> = {};
              for (const u of users) userMap[u.id] = u.username;

              for (const msg of msgs.slice(-25)) {
                if (!msg.text || msg.is_deleted) continue;
                messages.push({
                  author: userMap[msg.user_id] || `User${msg.user_id?.slice(-4) ?? ''}`,
                  text: msg.text,
                  timestamp: msg.time || new Date().toISOString(),
                  type: msg.rant ? 'rant' : 'message',
                });
              }
              clearTimeout(timeout);
              reader.cancel();
              done(messages);
              return;
            }
          } catch { /* incomplete chunk */ }
        }
      }
      done(messages);
    }).catch((e) => {
      if (e.name !== 'AbortError') console.warn('[Comments] SSE error:', e.message);
      done(messages);
    });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  if (!videoUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Try Livestream API first (fastest — no extra resolution needed)
  const liveComments = await fetchViaLivestreamApi();
  if (liveComments && liveComments.length > 0) {
    console.log(`[Comments] Got ${liveComments.length} messages via Livestream API`);
    return NextResponse.json({
      comments: liveComments,
      source: 'livestream_api',
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback: SSE stream via numeric video ID
  const videoId = await resolveVideoId(videoUrl);
  console.log('[Comments] Fallback videoId:', videoId);
  if (!videoId) {
    return NextResponse.json({ comments: [], source: 'none', error: 'Could not resolve video ID' });
  }

  const comments = await fetchChatMessages(videoId);
  console.log(`[Comments] Got ${comments.length} messages via SSE for video ${videoId}`);

  return NextResponse.json({
    comments,
    source: comments.length > 0 ? 'live_chat' : 'none',
    videoId,
    timestamp: new Date().toISOString(),
  });
}
