const fs = require('fs');
const html = fs.readFileSync('debug_fetched.html', 'utf8');

// Look for viewer_count in JavaScript
const patterns = [
  /viewer_count[\"']?\s*[:=]\s*(\d+)/gi,
  /"viewer_count":\s*(\d+)/gi,
  /current_count[\"']?\s*[:=]\s*(\d+)/gi,
  /"watching":\s*(\d+)/gi,
  /"num":\s*(\d+)/gi
];

console.log('Searching for viewer count patterns...\n');
patterns.forEach((pattern, i) => {
  const matches = [...html.matchAll(pattern)];
  if (matches.length > 0) {
    console.log(`Pattern ${i + 1} (${pattern}): FOUND ${matches.length} matches`);
    matches.slice(0, 3).forEach(m => console.log(`  - ${m[1]}`));
  }
});

// Look for the video data object
const videoDataMatch = html.match(/"video":\s*\{[^}]{0,2000}\}/i);
if (videoDataMatch) {
  console.log('\nFound video data object:');
  console.log(videoDataMatch[0].substring(0, 500));
}
