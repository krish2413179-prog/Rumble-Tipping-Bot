
export default async function DynamicRumblePlayer({ channelName, videoUrl }: { channelName?: string, videoUrl?: string }) {
  let embedUrl = null;

  try {
    let latestVideoUrl = videoUrl || null;

    if (!latestVideoUrl && channelName) {
      // 1. Fetch the RSS feed from Rumble
      // Try 'c' (channel) first, then fallback to 'user' if it fails
      let response = await fetch(`https://rumble.com/c/${channelName}/rss`, {
        next: { revalidate: 300 },
      });
      
      if (!response.ok) {
        console.warn(`Rumble channel feed failed (${response.status}), trying user feed...`);
        response = await fetch(`https://rumble.com/user/${channelName}/rss`, {
          next: { revalidate: 300 },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS feed from both channel and user endpoints for: ${channelName}`);
      }

      const responseText = await response.text();

      // 2. Extract the first <link> inside the first <item> (the newest video)
      // Note: Using Regex for a quick parse. For heavy production apps, use 'fast-xml-parser'
      const itemMatch = responseText.match(/<item>[\s\S]*?<link>(.*?)<\/link>/);
      
      if (itemMatch && itemMatch[1]) {
        latestVideoUrl = itemMatch[1];
      } else {
        // Fallback: If not an RSS feed (e.g. Rumble returns HTML for the user page),
        // look for the first video link in the HTML.
        const htmlVideoMatch = responseText.match(/href="(\/v[a-zA-Z0-9]+-[^"]+\.html[^"]*)"/);
        if (htmlVideoMatch && htmlVideoMatch[1]) {
          latestVideoUrl = `https://rumble.com${htmlVideoMatch[1]}`;
        }
      }
    }
    
    if (latestVideoUrl) {
      // 3. Convert standard URL to Embed URL using Rumble's OEmbed API
      try {
        const oembedRes = await fetch(`https://rumble.com/api/Media/oembed.json?url=${latestVideoUrl}`, {
           next: { revalidate: 300 }
        });
        if (oembedRes.ok) {
           const oembedData = await oembedRes.json();
           if (oembedData && oembedData.html) {
             const iframeSrcMatch = oembedData.html.match(/src="([^"]+)"/);
             if (iframeSrcMatch && iframeSrcMatch[1]) {
               embedUrl = iframeSrcMatch[1];
             }
           }
        }
      } catch (err) {
        console.error("Failed to parse OEmbed API:", err);
      }
    }
  } catch (error) {
    console.error("Failed to fetch Rumble feed:", error);
  }

  // 4. Render the player or a fallback state
  if (!embedUrl) {
    return <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 text-white rounded">Stream offline or unavailable.</div>;
  }

  return (
    <iframe
      src={embedUrl}
      title={channelName ? `Latest from ${channelName}` : 'Rumble Video'}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="absolute top-0 left-0 w-full h-full border-none"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}
