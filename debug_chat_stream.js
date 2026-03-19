const https = require('https');

// The chat API base is web7.rumble.com/chat/api
// Stream endpoint is likely: web7.rumble.com/chat/api/chat/359281535/stream
const chatId = '359281535';

const options = {
  hostname: 'web7.rumble.com',
  path: `/chat/api/chat/${chatId}/stream`,
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Origin': 'https://rumble.com',
    'Referer': 'https://rumble.com/',
  }
};

console.log('Connecting to SSE stream...');
const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);

  let buf = '';
  const timeout = setTimeout(() => {
    console.log('Timeout - destroying connection');
    console.log('Buffer so far:', buf.slice(0, 3000));
    req.destroy();
  }, 6000);

  res.on('data', (chunk) => {
    buf += chunk.toString();
    // Stop once we have the init event
    if (buf.includes('"type":"init"') || buf.includes('"type": "init"')) {
      clearTimeout(timeout);
      req.destroy();
      console.log('Got init event! Buffer length:', buf.length);
      // Parse first event
      const events = buf.split('\n\n');
      for (const ev of events) {
        const dataLine = ev.split('\n').find(l => l.startsWith('data:'));
        if (dataLine) {
          try {
            const json = JSON.parse(dataLine.slice(5).trim());
            console.log('Event type:', json.type);
            if (json.type === 'init') {
              const msgs = json.data?.messages || [];
              const users = json.data?.users || [];
              console.log('Messages count:', msgs.length);
              console.log('Users count:', users.length);
              // Print last 5 messages
              msgs.slice(-5).forEach(m => {
                const user = users.find(u => u.id === m.user_id);
                console.log(`  [${user?.username || 'anon'}]: ${m.text}`);
              });
            }
          } catch (e) {
            console.log('Parse error:', e.message, dataLine.slice(0, 100));
          }
        }
      }
    }
  });

  res.on('error', (e) => {
    clearTimeout(timeout);
    console.log('Stream error:', e.message);
  });

  res.on('end', () => {
    clearTimeout(timeout);
    console.log('Stream ended');
  });
});

req.on('error', (e) => console.log('Request error:', e.message));
req.end();
