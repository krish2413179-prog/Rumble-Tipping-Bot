const https = require('https');

async function testAPI() {
  const videoId = '359281535';
  const viewerId = Math.random().toString(36).substring(2, 10);
  console.log('Using viewer_id:', viewerId, '(length:', viewerId.length, ')');
  
  const data = JSON.stringify({
    data: {
      video_id: videoId,
      viewer_id: viewerId
    }
  });

  const options = {
    hostname: 'wn0.rumble.com',
    path: '/service.php?name=video.watching-now',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'User-Agent': 'Mozilla/5.0',
      'Origin': 'https://rumble.com',
      'Referer': 'https://rumble.com/'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        console.log('Raw response:', responseData);
        try {
          const json = JSON.parse(responseData);
          console.log('Parsed JSON:', json);
          resolve(json);
        } catch (e) {
          console.log('Parse error:', e.message);
          resolve({ error: 'parse_error', raw: responseData });
        }
      });
    });

    req.on('error', (e) => {
      console.log('Request error:', e.message);
      resolve({ error: e.message });
    });

    req.write(data);
    req.end();
  });
}

console.log('Testing Rumble API...\n');
testAPI().then(result => {
  console.log('\nFinal result:', result);
  if (result.data && result.data.num !== undefined) {
    console.log(`\n✓ Watching now: ${result.data.num}`);
  }
});
