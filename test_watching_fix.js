const https = require('https');

// Test the watching now API directly
async function testWatchingNowAPI(videoId) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      video_id: videoId,
      viewer_id: `viewer_${Date.now()}_${Math.random().toString(36).substring(7)}`
    });

    const options = {
      hostname: 'wn0.rumble.com',
      path: '/service.php?name=video.watching-now',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://rumble.com',
        'Referer': 'https://rumble.com/'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve(json);
        } catch (e) {
          resolve({ error: 'Parse error', raw: responseData });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

// Test with the video ID from test_wn_api.js
console.log('Testing Rumble watching now API...\n');
testWatchingNowAPI('359281535').then(result => {
  console.log('API Response:', JSON.stringify(result, null, 2));
  if (result.data && result.data.num !== undefined) {
    console.log(`\n✓ Success! Watching now: ${result.data.num}`);
  } else {
    console.log('\n✗ Failed to get watching count');
  }
});
