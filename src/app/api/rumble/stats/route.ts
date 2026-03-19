import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

/**
 * Helper to fetch with cookie handling for Rumble's redirect loop
 */
async function fetchRumbleHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    function fetchWithCookie(targetUrl: string, cookie: string | null = null) {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      };
      if (cookie) headers['Cookie'] = cookie;

      const options: https.RequestOptions = {
        headers: headers
      };

      https.get(targetUrl, options, (res) => {
        // Handle redirects (Rumble uses 307 for bot protection)
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

/**
 * Helper to fetch watching now count from Rumble's API
 */
async function fetchWatchingNow(videoId: string): Promise<number | null> {
  return new Promise((resolve) => {
    // Generate exactly 8 character viewer ID
    const viewerId = Math.random().toString(36).substring(2, 10);
    
    const payload = JSON.stringify({
      data: {
        video_id: videoId,
        viewer_id: viewerId
      }
    });

    const options: https.RequestOptions = {
      hostname: 'wn0.rumble.com',
      path: '/service.php?name=video.watching-now',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
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
          resolve(json.data?.num_watching_now || json.data?.viewer_count || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(payload);
    req.end();
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
  }

  try {
    const html = await fetchRumbleHtml(videoUrl);

    // Extract video ID from HTML
    let videoId = null;
    const videoIdPatterns = [
      /\"video_id\"\s*[:=]\s*\"?(\d+)\"?/i,
      /video\":\s*\{\s*\"id\":\s*\"(\d+)\"/i,
      /\"id\":\s*(\d+)\s*,\s*\"title\"/i,
      /data-video-id=\"(\d+)\"/i
    ];
    
    for (const pattern of videoIdPatterns) {
      const match = html.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    // Fetch watching now from API if we have video ID
    let watching = null;
    if (videoId) {
      console.log(`[API] Extracted video ID: ${videoId}, fetching from Rumble API...`);
      const watchingCount = await fetchWatchingNow(videoId);
      console.log(`[API] Rumble API returned watching count: ${watchingCount}`);
      if (watchingCount !== null) {
        // Return full number with comma formatting
        watching = watchingCount.toLocaleString();
      }
    } else {
      console.log('[API] Could not extract video ID from HTML');
    }

    // Fallback to HTML scraping if API fails
    const cleanedHtml = html
      .replace(/<li[^>]*class="mediaList-item"[\s\S]*?<\/li>/gi, "")
      .replace(/<div[^>]*class="mediaList-item"[\s\S]*?<\/div>/gi, "");
    
    if (!watching) {
      console.log('[API] Falling back to HTML scraping for watching count...');
      
      // Try on the original HTML first
      const watchingMatch = html.match(/title="(\d[\d,.]*[KkMm]?)\s+users\s+watching\s+now"/i)
                         || cleanedHtml.match(/title="(\d[\d,.]*[KkMm]?)\s+users\s+watching\s+now"/i)
                         || cleanedHtml.match(/class="live-video-view-count-status-count[^>]*>(\d[\d,.]*[KkMm]?)</i)
                         || cleanedHtml.match(/class="media-heading-info"[^>]*>(\d[\d,.]*[KkMm]?)\s+watching/i)
                         || cleanedHtml.match(/(\d[\d,.]*[KkMm]?)\s+watching\s+now/i)
                         || cleanedHtml.match(/(\d[\d,.]*[KkMm]?)\s+watching/i);
      if (watchingMatch) {
        watching = watchingMatch[1];
        console.log(`[API] HTML scraping found watching count: ${watching}`);
      } else {
        console.log('[API] HTML scraping could not find watching count');
        // Debug: check if the pattern exists at all
        if (html.includes('watching now')) {
          console.log('[API] DEBUG: "watching now" text found in HTML but regex failed');
        }
      }
    }

    // 3. Extract Views (Recorded Videos / Total Views)
    let views = null;
    const viewsMatch = cleanedHtml.match(/class="media-description-info-views"[^>]*>[\s\S]*?([\d,.]+K?M?)\s*<\/div>/i)
                    || cleanedHtml.match(/<span[^>]*class="media-heading-info"[^>]*>([\d,.]+K?M?)\s+Views/i)
                    || cleanedHtml.match(/([\d,.]+K?M?)\s+Views/i)
                    || cleanedHtml.match(/interactionCount"\s*content="UserViews:(\d+)"/i);
    
    if (viewsMatch) {
      const originalViews = viewsMatch[1];
      // Helper to parse Rumble's shorthand (K/M)
      const parseVal = (val: string) => {
        let n = parseFloat(val.replace(/,/g, ''));
        if (val.toUpperCase().endsWith('K')) n *= 1000;
        if (val.toUpperCase().endsWith('M')) n *= 1000000;
        return n;
      };
      
      const numViews = parseVal(originalViews);
      const inflatedViews = numViews ;
      
      // Format back to string - if it was a small number, keep it as is, if large use K/M
      if (inflatedViews >= 1000000) {
        views = (inflatedViews / 1000000).toFixed(1) + 'M';
      } else if (inflatedViews >= 1000) {
        views = (inflatedViews / 1000).toFixed(2) + 'K';
      } else {
        views = inflatedViews.toString();
      }
    }

    // 4. Extract Comments
    let comments = null;
    const commentsMatch = cleanedHtml.match(/Loading\s+([\d,.]+K?M?)\s+comments/i)
                       || cleanedHtml.match(/([\d,.]+K?M?)\s+Comments/i);
    if (commentsMatch) comments = commentsMatch[1];

    // 5. Extract Likes (Rumbles)
    let likes = null;
    const likesMatch = cleanedHtml.match(/data-js="rumbles_up_votes"[^>]*>([\s\S]*?)<\/span>/i)
                    || cleanedHtml.match(/rumbles-vote-up[^>]*>([\d,.]+K?M?)/i)
                    || cleanedHtml.match(/\"rumbles\":(\d+)/i);
    if (likesMatch) likes = likesMatch[1].trim();

    console.log(`[API] Scraped Stats for ${videoUrl}:`, { watching, views, comments, likes });

    const stats = {
      watching: watching ,
      views: views,
      comments: comments,
      likes: likes,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching Rumble stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats', details: error.message }, { status: 500 });
  }
}
