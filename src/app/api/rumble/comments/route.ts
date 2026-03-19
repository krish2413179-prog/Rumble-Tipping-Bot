import { NextRequest, NextResponse } from 'next/server';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** Get embed slug via oembed, then numeric video ID via embedJS */
async function resolveVideoId(pageUrl: string): Promise<string | null> {
  try {
    // Step 1: oembed → embed slug
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

    // Step 2: embedJS → numeric vid
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 6000);
    const eRes = await fetch(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${embedSlug}`,
      { headers: { 'User-Agent': UA, 'Referer': 'https://rumble.com/' }, signal: ctrl2.signal }
    );
    clearTimeout(t2);
    const eText = await eRes.text();
    const vidMatch = eText.match(/"vid"\s*:\s*(\d+)/);
    return vidMatch?.[1] ?? null;
  } catch (e: any) {
    console.warn('[Comments] resolveVideoId failed:', e.message);
    return null;
  }
}

type ChatMessage = { author: string; text: string; timestamp: string; type: string };

/** Read the SSE stream until we get the init event (contains last ~25 messages) */
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
        'User-Agent': UA,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Origin': 'https://rumble.com',
        'Referer': 'https://rumble.com/',
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

        // SSE events separated by double newline
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

  // Resolve numeric video ID (no HTML scraping)
  const videoId = await resolveVideoId(videoUrl);
  console.log('[Comments] videoId:', videoId);

  if (!videoId) {
    return NextResponse.json({ comments: [], source: 'none', error: 'Could not resolve video ID' });
  }

  const comments = await fetchChatMessages(videoId);
  console.log(`[Comments] Got ${comments.length} messages for video ${videoId}`);

  return NextResponse.json({
    comments,
    source: comments.length > 0 ? 'live_chat' : 'none',
    chatId: videoId,
    videoId,
    timestamp: new Date().toISOString(),
  });
}
