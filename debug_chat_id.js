const https = require('https');

function get(url, cookie, depth) {
  if (depth > 5) return Promise.resolve('');
  return new Promise((res, rej) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 Chrome/120',
        'Accept': 'text/html',
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };
    https.get(opts, r => {
      if ([301, 302, 307].includes(r.statusCode)) {
        const loc = r.headers.location;
        const c = r.headers['set-cookie'] ? r.headers['set-cookie'][0].split(';')[0] : cookie;
        const next = loc && loc.startsWith('http') ? loc : 'https://rumble.com' + (loc || '');
        r.resume();
        return get(next, c, depth + 1).then(res).catch(rej);
      }
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(d));
    }).on('error', rej);
  });
}

get('https://rumble.com/v60552h-newsmax2-live-real-news-for-real-people.html', null, 0).then(html => {
  console.log('html length:', html.length);

  // Find RumbleChat call
  const rcIdx = html.indexOf('RumbleChat(');
  if (rcIdx > -1) {
    console.log('RumbleChat call:', html.slice(rcIdx, rcIdx + 400));
  } else {
    console.log('No RumbleChat call found');
  }

  // Find chat-related IDs
  const chatMatches = [...html.matchAll(/chat[^0-9"]{0,30}(\d{5,})/gi)].slice(0, 10);
  console.log('chat near numbers:', chatMatches.map(x => x[0].slice(0, 80)));

  // Find video ID
  const vidMatch = html.match(/"video_id"\s*[:=]\s*"?(\d+)"?/i);
  console.log('video_id:', vidMatch ? vidMatch[1] : 'not found');

  // Find any SSE or stream endpoint
  const streamMatch = html.match(/\/chat\/[^"']+/g);
  console.log('stream paths:', streamMatch ? [...new Set(streamMatch)].slice(0, 5) : 'none');

  // Look for the chat init data
  const initMatch = html.match(/window\.__CHAT[^;]{0,200}/);
  console.log('window.__CHAT:', initMatch ? initMatch[0] : 'not found');

}).catch(e => console.log('err:', e.message));
