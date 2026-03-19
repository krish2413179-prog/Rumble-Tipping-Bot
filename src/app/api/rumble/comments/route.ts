import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

/**
 * Fetch Rumble page HTML with cookie/redirect handling
 */
async function fetchRumbleHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    function fetchWithCookie(targetUrl: string, cookie: string | null = null) {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      };
      if (cookie) headers['Cookie'] = cookie;

      https.get(targetUrl, { headers }, (res) => {
        if (res.statusCode === 307 || res.statusCode === 301 || res.statusCode === 302) {
          const newCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : cookie;
          const location = res.headers.location || '';
          const redirectUrl = location.startsWith('http') ? location : `https://rumble.com${location}`;
          fetchWithCookie(redirectUrl, newCookie);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    }
    fetchWithCookie(url);
  });
}

/**
 * Extract video/chat ID from Rumble HTML
 */
function extractIds(html: string): { videoId: string | null; chatId: string | null } {
  let videoId: string | null = null;
  let chatId: string | null = null;

  const videoPatterns = [
    /"video_id"\s*[:=]\s*"?(\d+)"?/i,
    /video":\s*\{\s*"id":\s*"(\d+)"/i,
    /data-video-id="(\d+)"/i,
    /"id":\s*(\d+)\s*,\s*"title"/i,
  ];
  for (const p of videoPatterns) {
    const m = html.match(p);
    if (m) { videoId = m[1]; break; }
  }

  // Chat ID is often the same as video ID on Rumble live streams
  const chatPatterns = [
    /chat[_-]?id['":\s]+(\d+)/i,
    // RumbleChat(apiUrl, apiUrl2, chatId, ...) — 3rd numeric argument
    /RumbleChat\s*\([^,]+,[^,]+,\s*(\d+)/i,
    /\/chat\/api\/chat\/(\d+)/i,
  ];
  for (const p of chatPatterns) {
    const m = html.match(p);
    if (m) { chatId = m[1]; break; }
  }

  // Fallback: chat ID = video ID for live streams
  if (!chatId && videoId) chatId = videoId;

  return { videoId, chatId };
}

/**
 * Fetch recent chat messages from Rumble's SSE chat stream.
 * The chat API lives at web7.rumble.com/chat/api/chat/{id}/stream
 * It sends an "init" event with the last batch of messages, then streams new ones.
 */
async function fetchChatMessages(chatId: string): Promise<Array<{ author: string; text: string; timestamp: string; type: string }>> {
  return new Promise((resolve) => {
    const options: https.RequestOptions = {
      hostname: 'web7.rumble.com',
      path: `/chat/api/chat/${chatId}/stream`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Origin': 'https://rumble.com',
        'Referer': 'https://rumble.com/',
      },
    };

    const req = https.request(options, (res) => {
      let buffer = '';
      const messages: Array<{ author: string; text: string; timestamp: string; type: string }> = [];

      // Hard timeout — SSE never ends on its own
      const timeout = setTimeout(() => {
        req.destroy();
        resolve(messages);
      }, 8000);

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // SSE events are separated by double newlines
        const events = buffer.split('\n\n');
        // Keep the last incomplete chunk in the buffer
        buffer = events.pop() || '';

        for (const event of events) {
          const dataLine = event.split('\n').find(l => l.startsWith('data:'));
          if (!dataLine) continue;

          let json: any;
          try {
            json = JSON.parse(dataLine.slice(5).trim());
          } catch {
            continue; // incomplete chunk, wait for more data
          }

          // "init" event contains the last N messages + user list
          if (json.type === 'init' && json.data?.messages) {
            const msgs: any[] = json.data.messages || [];
            const users: any[] = json.data.users || [];

            for (const msg of msgs.slice(-25)) {
              if (!msg.text || msg.is_deleted) continue;
              const user = users.find((u: any) => u.id === msg.user_id);
              messages.push({
                author: user?.username || 'Anonymous',
                text: msg.text,
                timestamp: msg.time || new Date().toISOString(),
                type: msg.rant ? 'rant' : 'message',
              });
            }

            // We have what we need — stop reading
            clearTimeout(timeout);
            req.destroy();
            resolve(messages);
            return;
          }
        }
      });

      res.on('error', () => { clearTimeout(timeout); resolve(messages); });
      res.on('end', () => { clearTimeout(timeout); resolve(messages); });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

/**
 * Scrape static comments from HTML (for non-live videos)
 */
function scrapeHtmlComments(html: string): Array<{ author: string; text: string; timestamp: string; type: string }> {
  const comments: Array<{ author: string; text: string; timestamp: string; type: string }> = [];

  // Try to find comment data in JSON embedded in page
  const commentBlockMatch = html.match(/"comments"\s*:\s*(\[[\s\S]*?\])\s*[,}]/);
  if (commentBlockMatch) {
    try {
      const parsed = JSON.parse(commentBlockMatch[1]);
      for (const c of parsed.slice(0, 20)) {
        if (c.text || c.body || c.content) {
          comments.push({
            author: c.username || c.author || c.user?.username || 'Anonymous',
            text: c.text || c.body || c.content,
            timestamp: c.created_on || c.time || new Date().toISOString(),
            type: 'comment',
          });
        }
      }
    } catch { /* ignore */ }
  }

  return comments;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
  }

  try {
    // 1. Fetch page HTML to extract IDs
    const html = await fetchRumbleHtml(videoUrl);
    const { videoId, chatId } = extractIds(html);

    console.log(`[Comments API] videoId=${videoId}, chatId=${chatId}`);

    let comments: Array<{ author: string; text: string; timestamp: string; type: string }> = [];
    let source = 'none';

    // 2. Try live chat stream first (for live videos)
    if (chatId) {
      const chatMessages = await fetchChatMessages(chatId);
      if (chatMessages.length > 0) {
        comments = chatMessages;
        source = 'live_chat';
        console.log(`[Comments API] Got ${comments.length} messages from live chat`);
      }
    }

    // 3. Fallback: scrape HTML for static comments
    if (comments.length === 0) {
      comments = scrapeHtmlComments(html);
      source = 'html_scrape';
      console.log(`[Comments API] Got ${comments.length} comments from HTML scrape`);
    }

    // 4. If still nothing, return empty — no fake data
    if (comments.length === 0) {
      console.log('[Comments API] No comments found from any source');
    }

    return NextResponse.json({
      comments,
      source,
      chatId,
      videoId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Comments API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments', details: error.message }, { status: 500 });
  }
}
