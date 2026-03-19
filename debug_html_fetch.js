const https = require('https');
const fs = require('fs');

async function fetchRumbleHtml(url) {
  return new Promise((resolve, reject) => {
    function fetchWithCookie(targetUrl, cookie = null) {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (cookie) headers['Cookie'] = cookie;

      https.get(targetUrl, { headers }, (res) => {
        if (res.statusCode === 307 || res.statusCode === 301 || res.statusCode === 302) {
          const newCookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : cookie;
          let location = res.headers.location || '';
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

async function test() {
  const url = 'https://rumble.com/v60552h-newsmax2-live-real-news-for-real-people.html';
  console.log('Fetching:', url);
  const html = await fetchRumbleHtml(url);
  
  // Save to file for inspection
  fs.writeFileSync('debug_fetched.html', html);
  console.log('Saved HTML to debug_fetched.html');
  
  // Test the regex patterns
  const patterns = [
    /title="(\d[\d,.]*[KkMm]?)\s+users\s+watching\s+now"/i,
    /class="live-video-view-count-status-count[^>]*>(\d[\d,.]*[KkMm]?)</i,
    /(\d[\d,.]*[KkMm]?)\s+watching\s+now/i,
    /(\d[\d,.]*[KkMm]?)\s+watching/i
  ];
  
  console.log('\nTesting patterns:');
  patterns.forEach((pattern, i) => {
    const match = html.match(pattern);
    console.log(`Pattern ${i + 1}: ${match ? `MATCH: ${match[1]}` : 'NO MATCH'}`);
  });
  
  // Check if text exists
  console.log('\nText search:');
  console.log('Contains "watching now":', html.includes('watching now'));
  console.log('Contains "users watching":', html.includes('users watching'));
  
  // Find the actual text
  const snippet = html.match(/.{50}watching now.{50}/i);
  if (snippet) {
    console.log('\nSnippet around "watching now":');
    console.log(snippet[0]);
  }
}

test().catch(console.error);
